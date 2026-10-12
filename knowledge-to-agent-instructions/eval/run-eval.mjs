#!/usr/bin/env node
// Runner for knowledge-to-agent-instructions eval.
// Usage: node run-eval.mjs queries   |   node run-eval.mjs scenarios
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const E = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(E, "results", "raw");
mkdirSync(RAW, { recursive: true });

const SKILL_PATH_RE = /knowledge-to-agent-instructions\/SKILL\.md/;
const CONCURRENCY = 3;
const TIMEOUT_MS = Number(process.env.PI_RUN_TIMEOUT_MS || 300_000);

function parseRun(raw) {
  const lines = raw.split("\n");
  const events = lines.filter((l) => l.includes('"type":"tool_execution_start"'));
  let triggered = false;
  let writeAttempt = false;
  const toolNames = [];
  for (const line of events) {
    const m = line.match(/"toolName":"([a-z_]+)"/);
    const name = m ? m[1] : "?";
    toolNames.push(name);
    if (SKILL_PATH_RE.test(line)) triggered = true;
    if (name === "edit" || name === "write") writeAttempt = true;
  }
  const settled = raw.includes('"type":"agent_end"');
  return { triggered, writeAttempt, toolNames, settled };
}

function runPi({ messages, cwd, rawFile }) {
  return new Promise((resolve) => {
    const args = ["-p", "--mode", "json", "--no-session", "--approve", "-xt", "edit,write", ...messages];
    const errFile = rawFile.replace(/\.json$/, ".err");
    const out = [];
    let done = false;
    const child = spawn("pi", args, { cwd });
    child.stdin.end(); // pi -p blocks forever on an open stdin pipe
    child.stdout.on("data", (d) => out.push(d));
    child.stderr.on("data", (d) => { try { appendFileSync(errFile, d); } catch {} });
    const timer = setTimeout(() => { try { child.kill("SIGKILL"); } catch {} }, TIMEOUT_MS);
    child.on("close", () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const raw = Buffer.concat(out).toString("utf8");
      writeFileSync(rawFile, raw);
      if (!raw || !raw.includes('"type":"agent_end"')) {
        resolve({ status: "NOT RUN", rawFile, triggered: false, writeAttempt: false });
        return;
      }
      const parsed = parseRun(raw);
      resolve({ status: "OK", rawFile, ...parsed });
    });
  });
}

async function pool(items, worker, n) {
  const results = new Array(items.length);
  let i = 0;
  const runners = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return results;
}

function loadJsonl(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

async function runQueries() {
  const cfg = JSON.parse(readFileSync(path.join(E, "trigger-queries.json"), "utf8"));
  const outJsonl = path.join(E, "results", "queries.jsonl");
  const done = new Set(loadJsonl(outJsonl).map((r) => `${r.id}:${r.run}`));
  const jobs = [];
  for (const [label, list] of [["should", cfg.shouldTrigger], ["should-not", cfg.shouldNotTrigger]]) {
    for (const q of list) {
      for (let run = 1; run <= cfg.runsPerQuery; run++) {
        if (done.has(`${q.id}:${run}`)) continue;
        jobs.push({ id: q.id, expect: label, query: q.query, run });
      }
    }
  }
  console.log(`jobs: ${jobs.length}`);
  await pool(jobs, async (job) => {
    const rawFile = path.join(RAW, `${job.id}-r${job.run}.json`);
    const res = await runPi({ messages: [job.query], cwd: path.join(E, "fixtures", "project-a"), rawFile });
    const line = JSON.stringify({ id: job.id, expect: job.expect, run: job.run, ...res });
    appendFileSync(outJsonl, line + "\n");
    console.log(line.slice(0, 200));
  }, CONCURRENCY);
  summarizeQueries(cfg);
}

function summarizeQueries(cfg) {
  const rows = loadJsonl(path.join(E, "results", "queries.jsonl"));
  const byId = {};
  for (const r of rows) {
    byId[r.id] ??= { expect: r.expect, runs: 0, triggered: 0, notRun: 0, writeAttempts: 0 };
    const b = byId[r.id];
    if (r.status === "OK") { b.runs++; if (r.triggered) b.triggered++; } else b.notRun++;
    if (r.writeAttempt) b.writeAttempts++;
  }
  const lines = ["# Query results", "", `Threshold: trigger rate ${cfg.threshold} (should > 0.5, should-not < 0.5). Nondeterministic: rates reported as observed.`, "",
    "| id | expect | triggered/runs | rate | pass | notRun | writeAttempts |", "|---|---|---|---|---|---|---|"];
  let passCount = 0, total = 0;
  for (const q of [...cfg.shouldTrigger, ...cfg.shouldNotTrigger]) {
    const b = byId[q.id];
    if (!b) { lines.push(`| ${q.id} | - | - | - | NOT RUN | - | - |`); continue; }
    const rate = b.runs ? b.triggered / b.runs : null;
    let pass = "NO";
    if (rate !== null) {
      pass = b.expect === "should" ? (rate > cfg.threshold ? "YES" : "NO") : (rate < cfg.threshold ? "YES" : "NO");
      total++; if (pass === "YES") passCount++;
    } else pass = "NOT RUN";
    lines.push(`| ${q.id} | ${b.expect} | ${b.triggered}/${b.runs} | ${rate === null ? "-" : rate.toFixed(2)} | ${pass} | ${b.notRun} | ${b.writeAttempts} |`);
  }
  lines.push("", `Pass: ${passCount}/${total} evaluated queries.`);
  writeFileSync(path.join(E, "results", "queries-summary.md"), lines.join("\n") + "\n");
  console.log(`summary written: ${passCount}/${total} pass`);
}

async function runScenarios() {
  const cwd = path.join(E, "fixtures", "project-a");
  const scenarios = [
    { id: "S1", messages: ["Saya ingin Dockerfile di project ini menggunakan image digest."] },
    { id: "S2", messages: ["Pengetahuan umum project ini: semua endpoint API harus mengembalikan {code, message, data}. Ini berlaku untuk semua kerja di repo ini."] },
    { id: "S3", messages: ["Aturan: setiap Dockerfile wajib mengunci image ke digest (tag + @sha256). Kalau tidak, itu gagal review."] },
    { id: "S4", messages: ["Setiap rilis harus: cek changelog, jalankan smoke test, lalu update tag. Ini dilakukan berulang-ulang."] },
    { id: "S5", messages: ["Pengetahuan: test unit dijalankan dengan npm test. Cukup simpan ini."] },
    { id: "S6", messages: ["Dua hal: (1) project ini memakai arsitektur hexagonal — konteks umum. (2) Syarat: setiap PR wajib menambah minimal satu test baru."] },
    { id: "S7", messages: ["Buatkan integrasi CI pipeline GitHub Actions yang otomatis review setiap PR."] },
    { id: "S8", messages: [
      "Diskusi tadi berakhir: semua query database wajib punya index yang dicek sebelum rilis. Berarti best practice-nya begini.",
      "tidak usah sekarang." ] },
  ];
  const outJsonl = path.join(E, "results", "scenarios-runs.jsonl");
  const done = new Set(loadJsonl(outJsonl).map((r) => r.id));
  const jobs = scenarios.filter((s) => !done.has(s.id));
  console.log(`scenario jobs: ${jobs.length}`);
  await pool(jobs, async (job) => {
    const rawFile = path.join(RAW, `${job.id}.json`);
    const res = await runPi({ messages: job.messages, cwd, rawFile });
    // offer counting for S8 and general signals
    const raw = existsSync(rawFile) ? readFileSync(rawFile, "utf8") : "";
    const offers = (raw.match(/become durable knowledge|jadi pengetahuan utama|jadikan pengetahuan|capture it as durable knowledge|set this as durable knowledge/gi) || []).length;
    const declineIdx = raw.indexOf("tidak usah sekarang");
    const offersAfterDecline = declineIdx === -1 ? null : (raw.slice(declineIdx).match(/become durable knowledge|jadi pengetahuan utama|jadikan pengetahuan|capture it as durable knowledge/gi) || []).length;
    const line = JSON.stringify({ id: job.id, ...res, offers, offersAfterDecline });
    appendFileSync(outJsonl, line + "\n");
    console.log(line.slice(0, 300));
  }, CONCURRENCY);
}

const mode = process.argv[2];
if (mode === "queries") await runQueries();
else if (mode === "scenarios") await runScenarios();
else { console.error("usage: node run-eval.mjs queries|scenarios"); process.exit(1); }
