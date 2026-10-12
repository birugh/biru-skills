# Best Practice Docker

Dokumen tim untuk penulisan Dockerfile dan operasi kontainer di produksi.

Berlaku untuk semua layanan backend, worker, dan tooling internal. Semua perubahan Dockerfile wajib melewati checklist di bagian akhir dokumen ini sebelum merge.

## 1. Dockerfile

### Gunakan base image kecil dan spesifik

- Pilih varian `alpine`, `slim`, atau `distroless` bila memungkinkan.
- Jangan pakai `latest`. Pin versi minor, atau lebih baik lagi pin digest:
  ```dockerfile
  FROM node:22-alpine
  # atau: FROM node:22-alpine@sha256:<digest>
  ```

### Manfaatkan cache build secara agresif

Urutkan perintah dari yang paling jarang berubah ke paling sering berubah. Salin dependency manifest dulu, baru source code:

```dockerfile
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod
COPY . .
```

`pnpm install --frozen-lockfile` (bukan `pnpm install`) agar install deterministik dan cocok dengan lockfile. pnpm diaktifkan lewat corepack (sudah tersedia di base image resmi Node), dan versinya dipin lewat field `packageManager` di `package.json`.

Jangan menggabungkan banyak langkah ke dalam satu layer besar yang selalu berubah; pisahkan per langkah logis agar cache layer tetap valid.

BuildKit aktif secara default di Docker 23+; set `DOCKER_BUILDKIT=1` bila CI masih memakai versi lama. Manfaatkan cache mount agar cache package manager tidak hilang tiap build:

```dockerfile
RUN --mount=type=cache,target=/root/.npm pnpm install --frozen-lockfile
```

### Bersihkan instalasi paket sistem

Instalasi paket OS membesarkan image bila tidak dibersihkan. Alpine: `apk add --no-cache`. Debian/Ubuntu:

```dockerfile
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```

Baris terakhir membersihkan index apt agar tidak tertinggal di layer.

### Multi-stage build untuk image produksi

Pisahkan tahap build (compilers, dev dependencies, source mentah) dari runtime. Hasil akhir hanya berisi artefak yang dibutuhkan:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod
USER node
CMD ["node", "dist/index.js"]
```

### Hanya salin file yang dibutuhkan

Hindari `COPY . .` tanpa `.dockerignore`. Buat `.dockerignore` berisi minimal:

```
node_modules
dist
.git
.env*
*.md
docker-compose*.yml
```

Dengan pnpm, `node_modules` hanya berisi symlink ke global store, jadi menyalinnya ke image hanya menghasilkan install yang rusak — wajib tetap di-`exclude`.

Kalau butuh seleksi ketat, gunakan `COPY` per file/glob spesifik.

### Satu proses per kontainer

Satu kontainer menjalankan satu proses aplikasi. Database, queue worker, dan sidecar memakai kontainer terpisah (atur lewat compose/Kubernetes), bukan proses tambahan dalam satu image.

### Healthcheck

Deklarasikan `HEALTHCHECK` agar orchestrator bisa mendeteksi layanan yang hidup tapi tidak melayani:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- -spider http://localhost:3000/healthz || exit 1
```

- Endpoint `/healthz` harus murah dan tidak memanggil dependency eksternal.
- `start-period` diberi waktu aplikasi cukup untuk boot, agar restart loop tidak terpicu saat startup lambat.

## 2. Keamanan

### Jalankan sebagai non-root

Kontainer produksi wajib tidak berjalan sebagai root. Gunakan user bawaan base image atau buat user khusus:

```dockerfile
RUN addgroup -S app && adduser -S app -G app
USER app
```

Pada image Node resmi, user `node` sudah tersedia — pakai itu bila tidak butuh user khusus.

### Jangan simpan secret di image

- `ENV`, `ARG`, dan `COPY` bukan tempat secret. Image yang sudah dibangun bisa diekstrak siapa pun yang punya akses registry.
- Sisipkan secret saat runtime lewat orchestrator (Kubernetes Secret, `docker run -e`, atau file secret yang di-mount).
- `.env*` wajib masuk `.dockerignore`.

### Build secret lewat BuildKit

File yang hanya dibutuhkan saat build (`.npmrc` privat, kunci SSH untuk repo dependency) jangan masuk lewat `ARG`/`ENV`/`COPY` - gunakan secret mount:

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    pnpm install --frozen-lockfile
```

```bash
docker build --secret id=npmrc,src=.npmrc .
```

Secret hanya terbaca selama langkah `RUN` berjalan; tidak tertinggal di layer, cache, atau `docker history`.

### Scan image secara berkala

- Jalankan scanner (Trivy, Grype, atau scanner bawaan registry) di CI untuk setiap image yang dipush.
- Jadwalkan scan ulang berkala; CVE baru bisa muncul di image lama yang tetap dipakai.
- Perbaiki dengan mengubah versi paket atau base image, bukan dengan menonaktifkan alert.

### Kurangi privilege kontainer

- Hindari `--privileged`. Tambahkan capability seperlunya, misal `--cap-drop=ALL --cap-add=CHOWN`.
- Set `no-new-privileges` agar proses di dalam kontainer tidak bisa menaikkan privilege.

## 3. Operasi runtime

### Tentukan resource limit

Tanpa limit, satu kontainer bisa memakan semua resource node dan menjatuhkan layanan lain:

```bash
docker run --memory=512m --cpus=1.0 ...
```

Atur juga di compose/Kubernetes untuk semua service.

### Logging ke stdout

- Tulis log ke stdout/stderr, jangan ke file di dalam kontainer.
- Orchestrator yang mengurus rotasi, pengumpulan, dan pengarsipan.
- Format JSON disarankan agar mudah di-parse pipeline logging.

### Restart policy

- Service produksi: `restart=unless-stopped` (compose) atau `restartPolicy: Always` (Kubernetes).
- Job sekali jalan: `restart=no` atau `OnFailure`, agar tidak loop.

### Penanganan sinyal saat berhenti

- Tulis `ENTRYPOINT`/`CMD` dalam bentuk exec (array JSON), bukan shell form, agar proses aplikasi menjadi PID 1 dan menerima sinyal dari Docker/Kubernetes.
- Aplikasi wajib menangani sinyal terminasi: tutup koneksi, selesaikan request yang berjalan, lalu keluar. Tanpa penanganan, Docker menunggu `stop_grace_period` sebelum menghentikan paksa - request in-flight terpotong.
- Bila runtime tidak bisa memproses sinyal sendiri (misal script wrapper), jalankan `tini` sebagai init process.
- Beri jeda berhenti lebih besar dari kebutuhan aplikasi: `stop_grace_period` di compose atau `terminationGracePeriodSeconds` di Kubernetes.

### Tagging dan registry

- Jangan pernah push tag `latest` ke registry produksi. Gunakan tag versi semver atau, lebih baik, commit SHA.
- Image produksi hanya diambil dari registry internal/bukan dari build lokal developer.
- Pull by digest di lingkungan yang butuh audit trail ketat.

## 4. Docker Compose untuk development

Compose dipakai untuk mereplikasi stack secara lokal, bukan untuk produksi.

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 3s
      retries: 5
```

- Pakai `depends_on` dengan `condition: service_healthy`, bukan sekadar urutan deklarasi, supaya aplikasi tidak start sebelum dependency siap.
- Credential compose lokal boleh sederhana, tapi jangan pernah dipakai di staging/produksi.
- Beri nama project konsisten (`name:` di baris paling atas compose) agar nama container konsisten antar developer.

## 5. Checklist sebelum merge

Semua perubahan Dockerfile/compose wajib lolos ini sebelum merge:

- [ ] Base image pin versi (bukan `latest`), idealnya pin digest.
- [ ] Multi-stage build; artefak runtime hanya berisi yang dibutuhkan.
- [ ] Dependency manifest disalin sebelum source code (cache build efektif).
- [ ] Install deterministik (`--frozen-lockfile` / `npm ci` / `pip install --require-hashes`).
- [ ] `.dockerignore` lengkap, termasuk `node_modules`, `.git`, `.env*`.
- [ ] Kontainer berjalan sebagai non-root (`USER` terisi).
- [ ] Tidak ada secret di `ENV`, `ARG`, atau file yang di-`COPY`.
- [ ] `HEALTHCHECK` terdeklarasi untuk service panjang hidup.
- [ ] Log ke stdout/stderr, tidak ke file di dalam kontainer.
- [ ] Resource limit ditentukan.
- [ ] Image scan lolos tanpa CVE kritis.
- [ ] Tag yang dipush bukan `latest`.
- [ ] Secret build memakai `--mount=type=secret`, bukan `ENV`/`ARG`/`COPY`.
- [ ] `ENTRYPOINT`/`CMD` bentuk exec; penanganan sinyal terminasi teruji.

