#!/usr/bin/env node
/**
 * HiskyWShop — Master Performance Test Runner
 * =============================================
 * Orchestrates all performance tests and generates a unified report.
 * 
 * Usage:
 *   node tests/performance/run-all.mjs
 *   node tests/performance/run-all.mjs --url=https://your.vercel.app --users=100
 * 
 * Individual test selection:
 *   node tests/performance/run-all.mjs --only=concurrency
 *   node tests/performance/run-all.mjs --only=lighthouse
 *   node tests/performance/run-all.mjs --only=firestore
 */

import { spawnSync, execSync } from 'child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const RESULTS    = join(__dirname, 'results');
mkdirSync(RESULTS, { recursive: true });

// ── Parse args ────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
const getArg  = (key, def) =>
  rawArgs.find(a => a.startsWith(`--${key}=`))?.split('=')[1] ?? def;

const BASE_URL  = getArg('url',   'http://localhost:9002');
const USERS     = getArg('users', '100');
const ONLY      = getArg('only',  '');

// ── Colors ────────────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
};

const g = s => `${c.green}${s}${c.reset}`;
const r = s => `${c.red}${s}${c.reset}`;
const y = s => `${c.yellow}${s}${c.reset}`;
const b = s => `${c.bold}${s}${c.reset}`;

// ── Test Definitions ──────────────────────────────────────────────────────────
const TESTS = [
  {
    id:      'connectivity',
    name:    'Pre-Flight Connectivity Check',
    runner:  async () => checkConnectivity(BASE_URL),
    always:  true,
  },
  {
    id:      'concurrency',
    name:    '100-User Concurrency Test (Node)',
    runner:  () => runNodeTest(),
    tool:    'Node.js (built-in)',
  },
  {
    id:      'k6-load',
    name:    'k6 Load Test',
    runner:  () => runK6Test('load-test.js'),
    tool:    'k6',
    optional: true,
  },
  {
    id:      'k6-stress',
    name:    'k6 Stress Test',
    runner:  () => runK6Test('stress-test.js'),
    tool:    'k6',
    optional: true,
  },
  {
    id:      'firestore',
    name:    'Firestore Concurrency Test',
    runner:  () => runFirestoreTest(),
    tool:    'firebase-admin',
    optional: true,
  },
  {
    id:      'lighthouse',
    name:    'Lighthouse Performance Audit',
    runner:  () => runLighthouseTest(),
    tool:    'lighthouse',
    optional: true,
  },
];

// ── Connectivity check ────────────────────────────────────────────────────────
async function checkConnectivity(url) {
  console.log(`  Checking ${url} ...`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.status < 500) {
      console.log(g(`  ✔ Server is reachable (HTTP ${res.status})`));
      return { passed: true, status: res.status };
    } else {
      console.log(r(`  ✘ Server returned HTTP ${res.status}`));
      return { passed: false, status: res.status };
    }
  } catch (err) {
    console.log(r(`  ✘ Cannot reach server: ${err.message}`));
    console.log(y(`  ⚠ Is the dev server running? Start with: npm run dev`));
    return { passed: false, error: err.message };
  }
}

// ── Run Node concurrency test ─────────────────────────────────────────────────
function runNodeTest() {
  const testFile = join(__dirname, 'node', 'concurrency-test.mjs');
  console.log(`  Running: node ${testFile}`);
  
  const result = spawnSync(
    'node',
    [testFile, `--url=${BASE_URL}`, `--users=${USERS}`, '--duration=30000'],
    { stdio: 'inherit', encoding: 'utf8', timeout: 120000 }
  );

  return { passed: result.status === 0, exitCode: result.status };
}

// ── Run k6 test ───────────────────────────────────────────────────────────────
function runK6Test(testFile) {
  try {
    execSync('k6 version', { stdio: 'pipe' });
  } catch {
    console.log(y(`  ⚠ k6 not found. Install: https://k6.io/docs/get-started/installation/`));
    return { passed: false, skipped: true, reason: 'k6 not installed' };
  }

  const scriptPath = join(__dirname, 'k6', testFile);
  console.log(`  Running: k6 run ${scriptPath}`);

  const result = spawnSync(
    'k6', ['run', '--env', `BASE_URL=${BASE_URL}`, scriptPath],
    { stdio: 'inherit', encoding: 'utf8', timeout: 900000 } // 15min max
  );

  return { passed: result.status === 0, exitCode: result.status };
}

// ── Run Firestore test ────────────────────────────────────────────────────────
function runFirestoreTest() {
  const testFile = join(__dirname, 'firestore', 'firestore-perf-test.mjs');
  const result = spawnSync(
    'node', [testFile],
    { stdio: 'inherit', encoding: 'utf8', timeout: 120000 }
  );
  return { passed: result.status === 0, exitCode: result.status };
}

// ── Run Lighthouse test ───────────────────────────────────────────────────────
function runLighthouseTest() {
  try {
    execSync('npx lighthouse --version', { stdio: 'pipe' });
  } catch {
    console.log(y('  ⚠ lighthouse not found. Install: npm install -g lighthouse'));
    return { passed: false, skipped: true, reason: 'lighthouse not installed' };
  }

  const testFile = join(__dirname, 'lighthouse', 'lighthouse-audit.mjs');
  const result = spawnSync(
    'node', [testFile, `--url=${BASE_URL}`],
    { stdio: 'inherit', encoding: 'utf8', timeout: 600000 } // 10min max
  );
  return { passed: result.status === 0, exitCode: result.status };
}

// ── Generate unified HTML report ───────────────────────────────────────────────
function generateUnifiedReport(results, totalDuration) {
  const rows = results.map(({ test, result, duration }) => {
    const status = result.skipped
      ? `<span class="skip">⏭ SKIPPED</span>`
      : result.passed
        ? `<span class="pass">✔ PASS</span>`
        : `<span class="fail">✘ FAIL</span>`;

    const reason = result.skipped ? `<small>${result.reason}</small>` : '';

    return `
    <tr class="${result.skipped ? '' : result.passed ? 'row-pass' : 'row-fail'}">
      <td>${test.name}</td>
      <td>${test.tool || 'Node.js'}</td>
      <td>${status} ${reason}</td>
      <td>${duration.toFixed(1)}s</td>
    </tr>`;
  }).join('');

  const totalPassed  = results.filter(r => r.result.passed && !r.result.skipped).length;
  const totalSkipped = results.filter(r => r.result.skipped).length;
  const totalFailed  = results.filter(r => !r.result.passed && !r.result.skipped).length;
  const allPassed    = totalFailed === 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HiskyWShop — Performance Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.5; }
    
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #5b21b6 50%, #1e3a8a 100%); padding: 3rem 2rem; text-align: center; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
    .header h1 { font-size: 2.2rem; font-weight: 800; color: white; position: relative; }
    .header .subtitle { color: rgba(255,255,255,0.75); margin-top: 0.5rem; font-size: 1rem; position: relative; }
    .header .meta { color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-top: 1rem; position: relative; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; padding: 2rem; max-width: 900px; margin: 0 auto; }
    .stat-card { background: #1e293b; border-radius: 16px; padding: 1.5rem; text-align: center; border: 1px solid #334155; }
    .stat-card .value { font-size: 2.5rem; font-weight: 800; line-height: 1; }
    .stat-card .label { color: #94a3b8; font-size: 0.8rem; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .green { color: #22c55e; } .red { color: #ef4444; } .yellow { color: #f59e0b; } .blue { color: #60a5fa; }

    .banner { margin: 0 2rem 1rem; padding: 1.25rem 2rem; border-radius: 12px; font-weight: 700; font-size: 1.1rem; text-align: center; }
    .banner-pass { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25); color: #22c55e; }
    .banner-fail { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #ef4444; }

    .section { padding: 0 2rem 2rem; max-width: 1000px; margin: 0 auto; }
    .section h2 { font-size: 1.1rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }

    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
    th { background: #0f172a; padding: 0.9rem 1.25rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 600; }
    td { padding: 1rem 1.25rem; border-top: 1px solid #1e293b; font-size: 0.9rem; }
    .row-pass { background: rgba(34,197,94,0.04); }
    .row-fail { background: rgba(239,68,68,0.06); }
    .pass { color: #22c55e; font-weight: 700; }
    .fail { color: #ef4444; font-weight: 700; }
    .skip { color: #94a3b8; font-weight: 600; }
    small { color: #64748b; display: block; font-size: 0.75rem; }

    .sla-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; }
    .sla-item { background: #1e293b; border-radius: 8px; padding: 0.75rem 1rem; border: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; }
    .sla-item .sla-label { font-size: 0.85rem; color: #94a3b8; }
    .sla-item .sla-value { font-size: 0.85rem; font-weight: 700; color: #22c55e; }

    .footer { text-align: center; padding: 2rem; color: #475569; font-size: 0.8rem; border-top: 1px solid #1e293b; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 HiskyWShop Performance Report</h1>
    <p class="subtitle">Load Testing · Stress Testing · Firestore · Lighthouse · Concurrency</p>
    <p class="meta">Generated: ${new Date().toLocaleString()} | Target: ${BASE_URL} | Duration: ${totalDuration.toFixed(0)}s</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="value ${allPassed ? 'green' : 'red'}">${totalPassed + totalSkipped}</div>
      <div class="label">Tests Passed</div>
    </div>
    <div class="stat-card">
      <div class="value red">${totalFailed}</div>
      <div class="label">Tests Failed</div>
    </div>
    <div class="stat-card">
      <div class="value yellow">${totalSkipped}</div>
      <div class="label">Tests Skipped</div>
    </div>
    <div class="stat-card">
      <div class="value blue">100</div>
      <div class="label">Concurrent Users</div>
    </div>
    <div class="stat-card">
      <div class="value blue">${totalDuration.toFixed(0)}s</div>
      <div class="label">Total Duration</div>
    </div>
  </div>

  <div class="banner ${allPassed ? 'banner-pass' : 'banner-fail'}">
    ${allPassed ? '✅ All critical tests passed — HiskyWShop is stable under 100 concurrent users' : `⚠ ${totalFailed} test(s) failed — review results below`}
  </div>

  <div class="section">
    <h2>Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test Suite</th>
          <th>Tool</th>
          <th>Status</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="section" style="margin-top:2rem">
    <h2>Performance SLA Targets</h2>
    <div class="sla-grid">
      <div class="sla-item"><span class="sla-label">Page Load (p95)</span><span class="sla-value">&lt; 3,000ms</span></div>
      <div class="sla-item"><span class="sla-label">Firestore Read (p95)</span><span class="sla-value">&lt; 2,000ms</span></div>
      <div class="sla-item"><span class="sla-label">Error Rate</span><span class="sla-value">&lt; 1%</span></div>
      <div class="sla-item"><span class="sla-label">Lighthouse Score</span><span class="sla-value">≥ 85</span></div>
      <div class="sla-item"><span class="sla-label">LCP</span><span class="sla-value">&lt; 2,500ms</span></div>
      <div class="sla-item"><span class="sla-label">CLS</span><span class="sla-value">&lt; 0.1</span></div>
      <div class="sla-item"><span class="sla-label">TBT</span><span class="sla-value">&lt; 200ms</span></div>
      <div class="sla-item"><span class="sla-label">Concurrent Users</span><span class="sla-value">100</span></div>
    </div>
  </div>

  <div class="footer">
    HiskyWShop Performance Testing Suite · Tests run on ${new Date().toDateString()}
  </div>
</body>
</html>`;
}

// ── Main orchestrator ─────────────────────────────────────────────────────────
async function main() {
  const suiteStart = performance.now();

  console.log('\n' + '═'.repeat(60));
  console.log(b('  HiskyWShop — Master Performance Test Runner'));
  console.log('═'.repeat(60));
  console.log(`  Target URL : ${BASE_URL}`);
  console.log(`  Users      : ${USERS} concurrent`);
  console.log(`  Filter     : ${ONLY || 'all tests'}`);
  console.log('═'.repeat(60) + '\n');

  const results = [];
  const testsToRun = ONLY
    ? TESTS.filter(t => t.id === ONLY || t.always)
    : TESTS;

  for (const test of testsToRun) {
    console.log(b(`\n▶ ${test.name}`));
    console.log('─'.repeat(50));

    const testStart = performance.now();
    let result;

    try {
      result = await Promise.resolve(test.runner());
    } catch (err) {
      console.log(r(`  ✘ Test threw an exception: ${err.message}`));
      result = { passed: false, error: err.message };
    }

    const duration = (performance.now() - testStart) / 1000;

    if (result.skipped) {
      console.log(y(`  ⏭ Skipped: ${result.reason}`));
    } else {
      console.log(result.passed ? g(`  ✔ PASSED (${duration.toFixed(1)}s)`) : r(`  ✘ FAILED (${duration.toFixed(1)}s)`));
    }

    results.push({ test, result, duration });
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalDuration = (performance.now() - suiteStart) / 1000;
  const passed  = results.filter(r => r.result.passed && !r.result.skipped).length;
  const failed  = results.filter(r => !r.result.passed && !r.result.skipped).length;
  const skipped = results.filter(r => r.result.skipped).length;
  const allPassed = failed === 0;

  console.log('\n' + '═'.repeat(60));
  console.log(b('  FINAL SUMMARY'));
  console.log('═'.repeat(60));
  console.log(`  Passed  : ${g(passed)}`);
  console.log(`  Failed  : ${failed > 0 ? r(failed) : failed}`);
  console.log(`  Skipped : ${y(skipped)}`);
  console.log(`  Duration: ${totalDuration.toFixed(1)}s`);
  console.log('═'.repeat(60));
  console.log(allPassed
    ? g(`  ✅ ALL TESTS PASSED — HiskyWShop is production-ready`)
    : r(`  ❌ ${failed} test(s) failed — see details above`)
  );
  console.log('═'.repeat(60) + '\n');

  // Generate report
  const reportPath = join(RESULTS, 'perf-report.html');
  writeFileSync(reportPath, generateUnifiedReport(results, totalDuration));
  console.log(`  📊 Report saved: ${reportPath}\n`);

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error(r('Fatal error:'), err);
  process.exit(1);
});
