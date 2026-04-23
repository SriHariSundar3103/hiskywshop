/**
 * HiskyWShop — Lighthouse CI Performance Audit
 * ==============================================
 * Automated Lighthouse audits across all critical pages.
 * Measures LCP, FID, CLS, TTI, TBT, and overall score.
 *
 * Install:
 *   npm install -g @lhci/cli lighthouse
 *
 * Run:
 *   node tests/performance/lighthouse/lighthouse-audit.mjs
 *   node tests/performance/lighthouse/lighthouse-audit.mjs --url=https://your.vercel.app
 */

import { execSync, spawn } from 'child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL    = process.argv.find(a => a.startsWith('--url='))?.split('=')[1]
                 || 'http://localhost:9002';
const RESULTS_DIR = join(__dirname, '..', 'results', 'lighthouse');

mkdirSync(RESULTS_DIR, { recursive: true });

// ── Pages to audit ────────────────────────────────────────────────────────────
const PAGES = [
  { path: '/',                label: 'Homepage',          critical: true  },
  { path: '/products',        label: 'Products',          critical: true  },
  { path: '/products/men',    label: 'Men Category',      critical: true  },
  { path: '/products/women',  label: 'Women Category',    critical: true  },
  { path: '/products/kids',   label: 'Kids Category',     critical: true  },
  { path: '/search?q=shirt',  label: 'Search Results',    critical: false },
  { path: '/about',           label: 'About',             critical: false },
  { path: '/login',           label: 'Login',             critical: true  },
];

// ── Score thresholds ──────────────────────────────────────────────────────────
const THRESHOLDS = {
  performance:    85,   // Minimum Lighthouse performance score
  accessibility:  90,
  seo:            90,
  lcp:            2500, // ms — Largest Contentful Paint
  cls:            0.1,  // Cumulative Layout Shift
  tbt:            200,  // ms — Total Blocking Time
  tti:            3800, // ms — Time to Interactive
  fcp:            1800, // ms — First Contentful Paint
};

// ── Color helpers ─────────────────────────────────────────────────────────────
const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan   = (s) => `\x1b[36m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;

function scoreColor(score, threshold) {
  if (score >= threshold)       return green(`${score}`);
  if (score >= threshold * 0.9) return yellow(`${score}`);
  return red(`${score}`);
}

// ── Run a single Lighthouse audit ────────────────────────────────────────────
async function runLighthouseAudit(page) {
  const url        = `${BASE_URL}${page.path}`;
  const outputFile = join(RESULTS_DIR, `${page.label.replace(/\s+/g, '-').toLowerCase()}.json`);

  console.log(cyan(`\n  Auditing: ${page.label} (${url})`));

  try {
    execSync(
      `npx lighthouse "${url}" ` +
      `--output=json ` +
      `--output-path="${outputFile}" ` +
      `--chrome-flags="--headless --no-sandbox --disable-gpu" ` +
      `--quiet ` +
      `--only-categories=performance,accessibility,seo`,
      { stdio: 'pipe', timeout: 120000 }
    );

    const report  = JSON.parse(readFileSync(outputFile, 'utf8'));
    const cats    = report.categories;
    const audits  = report.audits;

    const scores = {
      performance:   Math.round(cats.performance?.score   * 100 || 0),
      accessibility: Math.round(cats.accessibility?.score * 100 || 0),
      seo:           Math.round(cats.seo?.score           * 100 || 0),
    };

    const metrics = {
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue  || 0,
      tbt: audits['total-blocking-time']?.numericValue      || 0,
      tti: audits['interactive']?.numericValue              || 0,
      fcp: audits['first-contentful-paint']?.numericValue   || 0,
      si:  audits['speed-index']?.numericValue              || 0,
    };

    // Determine pass/fail
    const passed =
      scores.performance   >= THRESHOLDS.performance   &&
      scores.accessibility >= THRESHOLDS.accessibility &&
      scores.seo           >= THRESHOLDS.seo           &&
      metrics.lcp          <= THRESHOLDS.lcp           &&
      metrics.cls          <= THRESHOLDS.cls           &&
      metrics.tbt          <= THRESHOLDS.tbt;

    // Print results
    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  Performance    : ${scoreColor(scores.performance, THRESHOLDS.performance)}/100`);
    console.log(`  Accessibility  : ${scoreColor(scores.accessibility, THRESHOLDS.accessibility)}/100`);
    console.log(`  SEO            : ${scoreColor(scores.seo, THRESHOLDS.seo)}/100`);
    console.log(`  LCP            : ${metrics.lcp <= THRESHOLDS.lcp ? green(`${(metrics.lcp/1000).toFixed(2)}s`) : red(`${(metrics.lcp/1000).toFixed(2)}s`)} (target: <${THRESHOLDS.lcp/1000}s)`);
    console.log(`  CLS            : ${metrics.cls <= THRESHOLDS.cls ? green(metrics.cls.toFixed(3)) : red(metrics.cls.toFixed(3))} (target: <${THRESHOLDS.cls})`);
    console.log(`  TBT            : ${metrics.tbt <= THRESHOLDS.tbt ? green(`${Math.round(metrics.tbt)}ms`) : red(`${Math.round(metrics.tbt)}ms`)} (target: <${THRESHOLDS.tbt}ms)`);
    console.log(`  TTI            : ${Math.round(metrics.tti)}ms`);
    console.log(`  FCP            : ${Math.round(metrics.fcp)}ms`);
    console.log(`  Status         : ${passed ? green('✔ PASS') : red('✘ FAIL')}`);

    return { page: page.label, url, scores, metrics, passed };

  } catch (err) {
    console.log(red(`  ✘ Lighthouse failed for ${page.label}: ${err.message.slice(0, 100)}`));
    return { page: page.label, url, passed: false, error: err.message.slice(0, 200) };
  }
}

// ── Generate HTML summary report ──────────────────────────────────────────────
function generateHtmlReport(results) {
  const rows = results.map(r => {
    const status = r.passed
      ? `<span class="pass">✔ PASS</span>`
      : `<span class="fail">✘ FAIL</span>`;

    const perf = r.scores?.performance ?? 'N/A';
    const lcp  = r.metrics ? `${(r.metrics.lcp/1000).toFixed(2)}s` : 'N/A';
    const cls  = r.metrics ? r.metrics.cls.toFixed(3) : 'N/A';
    const tbt  = r.metrics ? `${Math.round(r.metrics.tbt)}ms` : 'N/A';

    return `
      <tr class="${r.passed ? 'row-pass' : 'row-fail'}">
        <td>${r.page}</td>
        <td>${status}</td>
        <td>${perf}</td>
        <td>${r.scores?.accessibility ?? 'N/A'}</td>
        <td>${r.scores?.seo ?? 'N/A'}</td>
        <td>${lcp}</td>
        <td>${cls}</td>
        <td>${tbt}</td>
      </tr>`;
  }).join('\n');

  const passCount = results.filter(r => r.passed).length;
  const allPassed = passCount === results.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HiskyWShop — Lighthouse Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 2rem; text-align: center; }
    .header h1 { font-size: 1.8rem; font-weight: 700; color: white; }
    .header p  { color: rgba(255,255,255,0.8); margin-top: 0.5rem; }
    .summary { display: flex; gap: 1rem; padding: 2rem; justify-content: center; flex-wrap: wrap; }
    .card { background: #1e293b; border-radius: 12px; padding: 1.5rem 2rem; text-align: center; min-width: 140px; }
    .card .value { font-size: 2rem; font-weight: 700; }
    .card .label { color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem; }
    .pass-val { color: #22c55e; }
    .fail-val { color: #ef4444; }
    .table-wrap { padding: 0 2rem 2rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; }
    th { background: #334155; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    td { padding: 0.85rem 1rem; border-top: 1px solid #334155; font-size: 0.9rem; }
    .row-pass { background: rgba(34,197,94,0.04); }
    .row-fail { background: rgba(239,68,68,0.06); }
    .pass { color: #22c55e; font-weight: 600; }
    .fail { color: #ef4444; font-weight: 600; }
    .status-banner { margin: 0 2rem 1rem; padding: 1rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 1.1rem; text-align: center; }
    .banner-pass { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; }
    .banner-fail { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 HiskyWShop — Lighthouse Performance Report</h1>
    <p>Generated: ${new Date().toLocaleString()} | Target: ${BASE_URL}</p>
  </div>
  <div class="summary">
    <div class="card">
      <div class="value ${allPassed ? 'pass-val' : 'fail-val'}">${passCount}/${results.length}</div>
      <div class="label">Pages Passed</div>
    </div>
    <div class="card">
      <div class="value">${THRESHOLDS.performance}</div>
      <div class="label">Min Perf Score</div>
    </div>
    <div class="card">
      <div class="value">${THRESHOLDS.lcp/1000}s</div>
      <div class="label">LCP Target</div>
    </div>
    <div class="card">
      <div class="value">${THRESHOLDS.cls}</div>
      <div class="label">CLS Target</div>
    </div>
  </div>
  <div class="status-banner ${allPassed ? 'banner-pass' : 'banner-fail'}">
    ${allPassed ? '✅ All pages meet performance SLA' : `⚠ ${results.length - passCount} page(s) failed performance SLA`}
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Page</th><th>Status</th><th>Performance</th><th>Accessibility</th>
          <th>SEO</th><th>LCP</th><th>CLS</th><th>TBT</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(bold(`\n${'═'.repeat(60)}`));
  console.log(bold(`  HiskyWShop — Lighthouse Performance Audit`));
  console.log(bold('═'.repeat(60)));
  console.log(`  Target: ${cyan(BASE_URL)}`);
  console.log(`  Pages:  ${PAGES.length}`);
  console.log(bold('═'.repeat(60)));

  const allResults = [];
  for (const page of PAGES) {
    const result = await runLighthouseAudit(page);
    allResults.push(result);
  }

  // Save reports
  writeFileSync(
    join(RESULTS_DIR, 'lighthouse-summary.json'),
    JSON.stringify(allResults, null, 2)
  );
  writeFileSync(
    join(RESULTS_DIR, 'lighthouse-report.html'),
    generateHtmlReport(allResults)
  );

  // Final verdict
  const passed    = allResults.filter(r => r.passed).length;
  const allPassed = passed === allResults.length;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(bold('  LIGHTHOUSE AUDIT COMPLETE'));
  console.log('═'.repeat(60));
  console.log(`  Pages Passed: ${passed}/${allResults.length}`);
  console.log(`  Report:       ${join(RESULTS_DIR, 'lighthouse-report.html')}`);
  console.log(bold('═'.repeat(60)));
  console.log(allPassed ? green('  ✅ All pages pass!') : red(`  ❌ ${allResults.length - passed} page(s) failed`));
  console.log('');

  process.exit(allPassed ? 0 : 1);
}

main();
