#!/usr/bin/env node
// Runner for install-prompt-authoring eval.
// Usage: node run-eval.mjs queries   |   node run-eval.mjs scenarios   |   node run-eval.mjs all
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const E = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(E, "results", "raw");
mkdirSync(RAW, { recursive: true });

const SKILL_PATH_RE = /install-prompt-authoring\/SKILL\.md/;
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
    if (name === "bash" && /(^|[^>])>\s*[^&]/.test(line.replace(/^.*"command":"/, ""))) writeAttempt = true;
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
  const lines = ["# Query results — install-prompt-authoring", "",
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

// Gate scenarios: G1-G4 run in fixtures/project-b (owner INSTALL.md exists),
// G5 runs in fixtures/project-a (no INSTALL.md).
const GATE_MARKERS = ["pakai yang ada", "use the existing", "ada tambahan", "additional", "dibedakan", "differentiate", "tiga opsi", "three options"];

// Assistant-visible text only (text_delta payloads). Scanning the whole raw
// transcript would match the markers echoed from SKILL.md's own tool results.
function assistantText(raw) {
  const blocks = [];
  let cur = null;
  const re = /"type":"(text_start|text_delta|text_end)"(?:[^}]*?"delta":"((?:[^"\\]|\\.)*)")?/g;
  for (const m of raw.matchAll(re)) {
    if (m[1] === "text_start") cur = [];
    else if (m[1] === "text_delta" && m[2] !== undefined) {
      if (cur === null) cur = [];
      try { cur.push(JSON.parse(`"${m[2]}"`)); } catch { cur.push(m[2]); }
    } else if (m[1] === "text_end" && cur !== null) {
      blocks.push(cur.join(""));
      cur = null;
    }
  }
  if (cur !== null) blocks.push(cur.join(""));
  return blocks.join("\n");
}

function scenarioSignals(raw) {
  const text = assistantText(raw);
  const lower = text.toLowerCase();
  const gateAsked = GATE_MARKERS.filter((m) => lower.includes(m)).length >= 2;
  const askBack = /bagian apanya|which parts|mau dibedakan/i.test(text);
  const lines = raw.split("\n").filter((l) => l.includes('"type":"tool_execution_start"'));
  let promptDocAttempt = false;
  let readmeAttempt = false;
  for (const line of lines) {
    if (!/INSTALL-PROMPT/.test(line)) continue;
    const m = line.match(/"toolName":"([a-z_]+)"/);
    const name = m ? m[1] : "?";
    if (name === "edit" || name === "write" || name === "bash") promptDocAttempt = true;
  }
  for (const line of lines) {
    if (!/README/.test(line)) continue;
    const m = line.match(/"toolName":"([a-z_]+)"/);
    const name = m ? m[1] : "?";
    if (name === "edit" || name === "write" || (name === "bash" && /INSTALL-PROMPT|Install with a prompt/.test(line))) readmeAttempt = true;
  }
  return { gateAsked, askBack, promptDocAttempt, readmeAttempt };
}

function verdictFor(id, s, status) {
  if (status !== "OK") return "NOT RUN";
  if (!s.gateAsked && id !== "G5") return "FAIL"; // gate skipped
  if (id === "G1") return s.gateAsked && !s.promptDocAttempt ? "PASS" : "FAIL";
  if (id === "G2" || id === "G3") return s.gateAsked && s.promptDocAttempt ? "PASS" : "FAIL";
  if (id === "G4") return s.gateAsked && s.askBack ? "PASS" : "FAIL";
  if (id === "G5") return !s.gateAsked && s.promptDocAttempt ? "PASS" : "FAIL";
  return "?";
}

async function runScenarios() {
  const scenarios = [
    { id: "G1", cwd: "project-b", messages: [
      "Create install with a prompt for this project: a README section with a paste-ready prompt plus the AI-executor install docs.",
      "Pakai yang ada aja, INSTALL.md yang sekarang cukup." ] },
    { id: "G2", cwd: "project-b", messages: [
      "Create install with a prompt for this project: a README section with a paste-ready prompt plus the AI-executor install docs.",
      "Ada tambahan: tambahkan instruksi supaya AI wajib cek dependency dulu sebelum install, dan verify di akhir. Sisanya ikut INSTALL.md." ] },
    { id: "G3", cwd: "project-b", messages: [
      "Create install with a prompt for this project: a README section with a paste-ready prompt plus the AI-executor install docs.",
      "Dibedakan: INSTALL-PROMPT.md khusus AI, INSTALL.md untuk user biasa." ] },
    { id: "G4", cwd: "project-b", messages: [
      "Create install with a prompt for this project: a README section with a paste-ready prompt plus the AI-executor install docs.",
      "Dibedakan.",
      "Bagian refusal path dan security note aja — biar AI punya aturan berhenti sendiri, sisanya tetap sama." ] },
    { id: "G5", cwd: "project-a", messages: [
      "Create install with a prompt for this project: a README section with a paste-ready prompt plus the AI-executor install docs." ] },
  ];
  const outJsonl = path.join(E, "results", "scenarios-runs.jsonl");
  const done = new Set(loadJsonl(outJsonl).filter((r) => r.status === "OK").map((r) => r.id));
  const jobs = scenarios.filter((s) => !done.has(s.id));
  console.log(`scenario jobs: ${jobs.length}`);
  await pool(jobs, async (job) => {
    const rawFile = path.join(RAW, `${job.id}.json`);
    const res = await runPi({ messages: job.messages, cwd: path.join(E, "fixtures", job.cwd), rawFile });
    const raw = existsSync(rawFile) ? readFileSync(rawFile, "utf8") : "";
    const signals = scenarioSignals(raw);
    const line = JSON.stringify({ id: job.id, ...res, ...signals, verdict: verdictFor(job.id, signals, res.status) });
    appendFileSync(outJsonl, line + "\n");
    console.log(line.slice(0, 300));
  }, CONCURRENCY);
  summarizeScenarios();
}

function summarizeScenarios() {
  const rows = loadJsonl(path.join(E, "results", "scenarios-runs.jsonl"));
  const byId = {};
  for (const r of rows) byId[r.id] = r; // latest run wins
  const lines = ["# Scenario results — install-prompt-authoring", "",
    "| id | verdict | triggered | gateAsked | askBack | promptDocAttempt | readmeAttempt |", "|---|---|---|---|---|---|---|"];
  for (const id of ["G1", "G2", "G3", "G4", "G5"]) {
    const r = byId[id];
    if (!r) { lines.push(`| ${id} | NOT RUN | - | - | - | - | - |`); continue; }
    lines.push(`| ${id} | ${r.verdict} | ${r.triggered} | ${r.gateAsked} | ${r.askBack} | ${r.promptDocAttempt} | ${r.readmeAttempt} |`);
  }
  const pass = ["G1", "G2", "G3", "G4", "G5"].filter((id) => byId[id]?.verdict === "PASS").length;
  lines.push("", `Pass: ${pass}/5 scenarios.`);
  writeFileSync(path.join(E, "results", "scenarios.md"), lines.join("\n") + "\n");
  console.log(`scenario summary written: ${pass}/5 pass`);
}

function recompute() {
  const file = path.join(E, "results", "scenarios-runs.jsonl");
  const rows = loadJsonl(file);
  for (const r of rows) {
    const raw = existsSync(r.rawFile) ? readFileSync(r.rawFile, "utf8") : "";
    const s = scenarioSignals(raw);
    Object.assign(r, s, { verdict: verdictFor(r.id, s, r.status) });
    console.log(`${r.id}: ${r.verdict} gate=${s.gateAsked} askBack=${s.askBack} doc=${s.promptDocAttempt} readme=${s.readmeAttempt}`);
  }
  writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  summarizeScenarios();
}

const mode = process.argv[2];
if (mode === "queries") await runQueries();
else if (mode === "scenarios") await runScenarios();
else if (mode === "recompute") recompute();
else if (mode === "all") { await runQueries(); await runScenarios(); }
else { console.error("usage: node run-eval.mjs queries|scenarios|recompute|all"); process.exit(1); }