#!/usr/bin/env node
// Runner for skill-authoring eval.
// Usage: node run-eval.mjs queries   |   node run-eval.mjs scenarios   |   node run-eval.mjs all
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const E = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(E, "results", "raw");
mkdirSync(RAW, { recursive: true });

const SKILL_PATH_RE = /skill-authoring\/SKILL\.md/;
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
  const runners = [];
  for (let r = 0; r < Math.min(n, items.length); r++) {
    runners.push((async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await worker(items[idx], idx);
      }
    })());
  }
  await Promise.all(runners);
  return results;
}

function loadJsonl(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

// Load trigger-queries.json -> { threshold, runsPerQuery, shouldTrigger: [{id, query}], shouldNotTrigger: [...] }
function loadCfg() {
  try {
    return JSON.parse(readFileSync(path.join(E, "trigger-queries.json"), "utf8"));
  } catch (err) {
    console.error(`trigger-queries.json unreadable: ${err.message}`);
    process.exit(1);
  }
}

async function runQueries() {
  const cfg = loadCfg();
  const only = (process.env.PI_EVAL_ONLY || "").split(",").filter(Boolean);
  const outJsonl = path.join(E, "results", "queries.jsonl");
  const done = new Set(loadJsonl(outJsonl).filter((r) => r.status === "OK").map((r) => `${r.id}:${r.run}`));
  const jobs = [];
  for (const [label, list] of [["should", cfg.shouldTrigger], ["should-not", cfg.shouldNotTrigger]]) {
    for (const q of list) {
      if (only.length && !only.includes(q.id)) continue;
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
    byId[r.id] ??= { expect: r.expect, runs: 0, triggered: 0, notRun: 0 };
    const b = byId[r.id];
    if (r.status === "OK") { b.runs++; if (r.triggered) b.triggered++; } else b.notRun++;
  }
  const all = [...cfg.shouldTrigger, ...cfg.shouldNotTrigger];
  const lines = ["# Query results — skill-authoring", "",
    `Threshold: trigger rate ${cfg.threshold} (should > 0.5, should-not < 0.5). Nondeterministic: rates as observed.`, "",
    "| id | expect | triggered/runs | rate | pass | notRun |", "|---|---|---|---|---|---|"];
  let passCount = 0, total = 0;
  for (const q of all) {
    const b = byId[q.id];
    if (!b) { lines.push(`| ${q.id} | - | - | - | NOT RUN | - |`); continue; }
    const rate = b.runs ? b.triggered / b.runs : null;
    let pass = "NO";
    if (rate !== null) {
      pass = b.expect === "should" ? (rate > cfg.threshold ? "YES" : "NO") : (rate < cfg.threshold ? "YES" : "NO");
      total++; if (pass === "YES") passCount++;
    } else pass = "NOT RUN";
    lines.push(`| ${q.id} | ${b.expect} | ${b.triggered}/${b.runs} | ${rate === null ? "-" : rate.toFixed(2)} | ${pass} | ${b.notRun} |`);
  }
  lines.push("", `Pass: ${passCount}/${total} evaluated queries.`);
  writeFileSync(path.join(E, "results", "queries-summary.md"), lines.join("\n") + "\n");
  console.log(`summary written: ${passCount}/${total} pass`);
}

async function runScenarios() {
  const cwd = path.join(E, "fixtures", "project-a");
  const scenarios = [
    { id: "S1", messages: ["Buatkan agent skill: tiap kali agent nemu bug berupa null pointer di config parser, dia harus nanya user dulu soal input yang belum disebut, baru fix."] },
    { id: "S2", messages: ["Bikin skill buat bantuin agent nyalin data antar database."] },
    { id: "S3", messages: ["Audit skill kita yang ini: eval/fixtures/skill-audit-test/SKILL.md. Cek frontmatter sama struktur, sesuai spesifikasi resmi nggak."] },
    { id: "S4", messages: ["Skill `foo-skill` punya description yang terlalu sempit jadi nggak pernah ke-trigger. Perbaiki."] },
    { id: "S5", messages: ["Evaluasi skill `bar-skill`: apakah dia ke-trigger pas dibutuhin dan output-nya bener?"] },
    { id: "S6", messages: ["Buatkan aturan buat agent: semua endpoint harus pake format {code, message, data}. Apakah ini AGENTS.md atau supervisor rule?"] },
    { id: "S7", messages: ["Tulis dokumentasi tentang cara pakai API internal kita."] },
    { id: "S8", messages: [
      "Kita baru sepakat soal aturan ini: tiap PR wajib sertakan test. Jadikan ini instruksi agent untuk repo ini.",
      "Ternyata harusnya sebagai skill Agent Skills. Buatkan skill-nya." ] },
  ];
  const outJsonl = path.join(E, "results", "scenarios-runs.jsonl");
  const done = new Set(loadJsonl(outJsonl).filter((r) => r.status === "OK").map((r) => r.id));
  const jobs = scenarios.filter((s) => !done.has(s.id));
  console.log(`scenario jobs: ${jobs.length}`);
  await pool(jobs, async (job) => {
    const rawFile = path.join(RAW, `${job.id}.json`);
    const res = await runPi({ messages: job.messages, cwd, rawFile });
    const line = JSON.stringify({ id: job.id, ...res });
    appendFileSync(outJsonl, line + "\n");
    console.log(line.slice(0, 300));
  }, CONCURRENCY);
}

const mode = process.argv[2];
if (mode === "queries") await runQueries();
else if (mode === "scenarios") await runScenarios();
else if (mode === "all") { await runQueries(); await runScenarios(); }
else { console.error("usage: node run-eval.mjs queries|scenarios|all"); process.exit(1); }