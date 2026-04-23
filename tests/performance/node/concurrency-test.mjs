/**
 * HiskyWShop — Node.js Concurrency Test
 * =======================================
 * Pure Node.js script — no external tools needed.
 * Tests concurrent Firestore-backed API calls and page loads.
 * 
 * Run:
 *   node tests/performance/node/concurrency-test.mjs
 *   node tests/performance/node/concurrency-test.mjs --url=https://your-site.vercel.app
 */

import { performance } from 'perf_hooks';
import { createWriteStream, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => a.slice(2).split('='))
);

const BASE_URL     = args.url        || 'http://localhost:9002';
const CONCURRENCY  = parseInt(args.users || '100');
const RAMP_STEPS   = parseInt(args.steps || '5');
const DURATION_MS  = parseInt(args.duration || '30000'); // 30s sustained

// Results storage
const results = {
  passed:   0,
  failed:   0,
  errors:   [],
  timings:  [],
  byRoute:  {},
  startTime: Date.now(),
};

// ── Routes to test ────────────────────────────────────────────────────────────
const TEST_ROUTES = [
  { url: '/',                    label: 'Homepage',           critical: true,  maxMs: 3000 },
  { url: '/products',            label: 'Products',           critical: true,  maxMs: 3000 },
  { url: '/products/men',        label: 'Men Category',       critical: true,  maxMs: 3000 },
  { url: '/products/women',      label: 'Women Category',     critical: true,  maxMs: 3000 },
  { url: '/products/kids',       label: 'Kids Category',      critical: true,  maxMs: 3000 },
  { url: '/search?q=shirt',      label: 'Search',             critical: false, maxMs: 3000 },
  { url: '/about',               label: 'About Page',         critical: false, maxMs: 2000 },
  { url: '/contact',             label: 'Contact Page',       critical: false, maxMs: 2000 },
  { url: '/admin',               label: 'Admin Dashboard',    critical: false, maxMs: 4000 },
  { url: '/login',               label: 'Login Page',         critical: true,  maxMs: 3000 },
];

// ── Color helpers ─────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
};

const pass = (s) => `${c.green}✔${c.reset} ${s}`;
const fail = (s) => `${c.red}✘${c.reset} ${s}`;
const info = (s) => `${c.cyan}ℹ${c.reset} ${s}`;
const warn = (s) => `${c.yellow}⚠${c.reset} ${s}`;

// ── Single request with timing ────────────────────────────────────────────────
async function makeRequest(route, userId) {
  const url     = `${BASE_URL}${route.url}`;
  const t0      = performance.now();
  let   status  = 0;
  let   error   = null;
  let   bodyLen = 0;

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':  `node-concurrency-test/1.0 VU-${userId}`,
        'Accept':      'text/html,application/json,*/*',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);
    status  = res.status;
    const body = await res.text();
    bodyLen = body.length;

  } catch (err) {
    if (err.name === 'AbortError') {
      error = 'TIMEOUT (>10s)';
      status = 0;
    } else {
      error = err.message;
      status = 0;
    }
  }

  const duration = performance.now() - t0;

  return {
    route:    route.url,
    label:    route.label,
    userId,
    status,
    duration: Math.round(duration),
    bodyLen,
    error,
    maxMs:    route.maxMs,
    critical: route.critical,
    passed:   !error && status >= 200 && status < 500 && duration <= route.maxMs,
    slaPass:  !error && status >= 200 && status < 500,
  };
}

// ── Concurrent batch execution ────────────────────────────────────────────────
async function runConcurrentBatch(users, batchLabel) {
  const promises = users.map(({ userId, route }) =>
    makeRequest(route, userId)
  );

  const batchStart = performance.now();
  const batchResults = await Promise.allSettled(promises);
  const batchDuration = performance.now() - batchStart;

  const resolved = batchResults
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  return { results: resolved, batchDuration };
}

// ── Statistics calculator ─────────────────────────────────────────────────────
function calcStats(timings) {
  if (!timings.length) return {};
  const sorted = [...timings].sort((a, b) => a - b);
  const sum    = timings.reduce((a, b) => a + b, 0);
  return {
    min:  sorted[0],
    max:  sorted[sorted.length - 1],
    avg:  Math.round(sum / timings.length),
    p50:  sorted[Math.floor(timings.length * 0.50)],
    p75:  sorted[Math.floor(timings.length * 0.75)],
    p90:  sorted[Math.floor(timings.length * 0.90)],
    p95:  sorted[Math.floor(timings.length * 0.95)],
    p99:  sorted[Math.floor(timings.length * 0.99)],
  };
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function progressBar(current, total, width = 30) {
  const pct  = current / total;
  const fill = Math.round(pct * width);
  const bar  = '█'.repeat(fill) + '░'.repeat(width - fill);
  return `[${bar}] ${(pct * 100).toFixed(0)}%`;
}

// ── Main test runner ──────────────────────────────────────────────────────────
async function runTest() {
  console.log('\n' + '═'.repeat(60));
  console.log(`${c.bold}  HiskyWShop — Concurrency Performance Test${c.reset}`);
  console.log('═'.repeat(60));
  console.log(info(`Target:      ${BASE_URL}`));
  console.log(info(`Concurrency: ${CONCURRENCY} users`));
  console.log(info(`Ramp Steps:  ${RAMP_STEPS}`));
  console.log(info(`Duration:    ${DURATION_MS / 1000}s sustained`));
  console.log('═'.repeat(60) + '\n');

  const allTimings      = [];
  const routeTimings    = {};
  const routeErrors     = {};
  let   totalRequests   = 0;
  let   totalErrors     = 0;
  let   totalSlaPasses  = 0;

  // ── Phase 1: Ramp Up ────────────────────────────────────────────────────
  console.log(`${c.bold}📈 Phase 1: Ramp-Up (1 → ${CONCURRENCY} users)${c.reset}\n`);

  for (let step = 1; step <= RAMP_STEPS; step++) {
    const stepUsers = Math.round((CONCURRENCY / RAMP_STEPS) * step);
    const route = TEST_ROUTES[step % TEST_ROUTES.length];

    process.stdout.write(
      `  Step ${step}/${RAMP_STEPS} — ${stepUsers} users — ${route.label} ${progressBar(step, RAMP_STEPS)}\r`
    );

    const users = Array.from({ length: stepUsers }, (_, i) => ({
      userId: i + 1,
      route,
    }));

    const { results: batchRes, batchDuration } = await runConcurrentBatch(users, `Ramp Step ${step}`);

    batchRes.forEach(r => {
      allTimings.push(r.duration);
      routeTimings[r.label] = routeTimings[r.label] || [];
      routeTimings[r.label].push(r.duration);
      routeErrors[r.label]  = routeErrors[r.label] || 0;

      totalRequests++;
      if (r.passed) totalSlaPasses++;
      if (!r.slaPass) {
        totalErrors++;
        routeErrors[r.label]++;
        results.errors.push({
          phase: 'ramp-up',
          step,
          ...r,
        });
      }
    });

    await new Promise(r => setTimeout(r, 500)); // Pause between ramp steps
  }

  console.log(`\n  ${pass('Ramp-up complete')}\n`);

  // ── Phase 2: Sustained Load ─────────────────────────────────────────────
  console.log(`${c.bold}⚡ Phase 2: Sustained Load (${CONCURRENCY} concurrent users × ${DURATION_MS / 1000}s)${c.reset}\n`);

  const sustainedStart   = Date.now();
  let   sustainedBatches = 0;

  while (Date.now() - sustainedStart < DURATION_MS) {
    const route = TEST_ROUTES[sustainedBatches % TEST_ROUTES.length];
    const users = Array.from({ length: CONCURRENCY }, (_, i) => ({
      userId: i + 1,
      route,
    }));

    const elapsed = ((Date.now() - sustainedStart) / 1000).toFixed(0);
    process.stdout.write(
      `  Batch #${sustainedBatches + 1} — ${route.label} — Elapsed: ${elapsed}s / ${DURATION_MS / 1000}s\r`
    );

    const { results: batchRes } = await runConcurrentBatch(users, `Sustained batch ${sustainedBatches}`);

    batchRes.forEach(r => {
      allTimings.push(r.duration);
      routeTimings[r.label] = routeTimings[r.label] || [];
      routeTimings[r.label].push(r.duration);
      routeErrors[r.label]  = routeErrors[r.label] || 0;

      totalRequests++;
      if (r.passed) totalSlaPasses++;
      if (!r.slaPass) {
        totalErrors++;
        routeErrors[r.label]++;
        if (results.errors.length < 50) { // Cap to 50 errors
          results.errors.push({ phase: 'sustained', batch: sustainedBatches, ...r });
        }
      }
    });

    sustainedBatches++;
    await new Promise(r => setTimeout(r, 200)); // Small breathing room
  }

  console.log(`\n  ${pass('Sustained load complete')}\n`);

  // ── Phase 3: Per-Route Sequential Check ─────────────────────────────────
  console.log(`${c.bold}🔍 Phase 3: Per-Route Validation (sequential)${c.reset}\n`);

  for (const route of TEST_ROUTES) {
    const res = await makeRequest(route, 999);
    const status = res.slaPass ? pass : fail;
    const speed  = res.duration <= route.maxMs
      ? `${c.green}${res.duration}ms${c.reset}`
      : `${c.red}${res.duration}ms (>${route.maxMs}ms SLA)${c.reset}`;

    console.log(
      `  ${status(`${route.label.padEnd(22)}`)} ` +
      `HTTP ${res.status}  ${speed}`
    );

    if (res.error) {
      console.log(`    ${c.red}Error: ${res.error}${c.reset}`);
    }
  }

  // ── Results ───────────────────────────────────────────────────────────────
  const stats      = calcStats(allTimings);
  const errorRate  = ((totalErrors / totalRequests) * 100).toFixed(2);
  const passRate   = ((totalSlaPasses / totalRequests) * 100).toFixed(2);
  const testPassed = parseFloat(errorRate) < 1 && stats.p95 <= 3000;

  console.log('\n' + '═'.repeat(60));
  console.log(`${c.bold}  RESULTS SUMMARY${c.reset}`);
  console.log('═'.repeat(60));
  console.log(`  Total Requests  : ${c.bold}${totalRequests}${c.reset}`);
  console.log(`  Pass Rate       : ${c.green}${passRate}%${c.reset}`);
  console.log(`  Error Rate      : ${parseFloat(errorRate) < 1 ? c.green : c.red}${errorRate}%${c.reset}`);
  console.log(`  Avg Response    : ${stats.avg}ms`);
  console.log(`  P50             : ${stats.p50}ms`);
  console.log(`  P75             : ${stats.p75}ms`);
  console.log(`  P90             : ${stats.p90}ms`);
  console.log(`  P95             : ${stats.p95 <= 3000 ? c.green : c.red}${stats.p95}ms${c.reset} (SLA: <3000ms)`);
  console.log(`  P99             : ${stats.p99}ms`);
  console.log(`  Min             : ${stats.min}ms`);
  console.log(`  Max             : ${stats.max}ms`);

  console.log('\n  Per-Route Statistics:');
  Object.entries(routeTimings).forEach(([label, times]) => {
    const s = calcStats(times);
    const errs = routeErrors[label] || 0;
    console.log(
      `  ${label.padEnd(22)} avg=${s.avg}ms  p95=${s.p95}ms  errors=${errs}`
    );
  });

  if (results.errors.length > 0) {
    console.log(`\n${c.red}${c.bold}  ⚠ Errors Detected:${c.reset}`);
    const uniqueErrors = [...new Set(results.errors.map(e =>
      `[${e.route}] HTTP ${e.status} ${e.error || ''} (${e.duration}ms)`
    ))].slice(0, 10);
    uniqueErrors.forEach(e => console.log(`  ${c.red}•${c.reset} ${e}`));
  }

  console.log('\n' + '═'.repeat(60));
  console.log(
    testPassed
      ? `${c.green}${c.bold}  ✅ ALL TESTS PASSED — System is stable at ${CONCURRENCY} concurrent users${c.reset}`
      : `${c.red}${c.bold}  ❌ TESTS FAILED — Performance SLA breached${c.reset}`
  );
  console.log('═'.repeat(60) + '\n');

  // ── Save JSON report ──────────────────────────────────────────────────────
  const resultsDir = join(__dirname, '..', '..', 'results');
  mkdirSync(resultsDir, { recursive: true });

  const report = {
    meta: {
      timestamp:   new Date().toISOString(),
      baseUrl:     BASE_URL,
      concurrency: CONCURRENCY,
      duration:    DURATION_MS,
      totalDuration: `${((Date.now() - results.startTime) / 1000).toFixed(1)}s`,
    },
    summary: {
      totalRequests,
      totalErrors,
      errorRate:  parseFloat(errorRate),
      passRate:   parseFloat(passRate),
      passed:     testPassed,
      stats,
    },
    routeStats: Object.fromEntries(
      Object.entries(routeTimings).map(([label, times]) => [
        label,
        { ...calcStats(times), errorCount: routeErrors[label] || 0 },
      ])
    ),
    errors: results.errors.slice(0, 50),
  };

  const reportPath = join(resultsDir, 'concurrency-report.json');
  const { writeFileSync } = await import('fs');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(info(`Report saved: ${reportPath}\n`));

  process.exit(testPassed ? 0 : 1);
}

runTest().catch(err => {
  console.error(`${c.red}Fatal error:${c.reset}`, err);
  process.exit(1);
});
