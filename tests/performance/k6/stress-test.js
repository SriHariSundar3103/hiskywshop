/**
 * HiskyWShop — k6 Stress Test
 * ============================
 * Push beyond 100 users to find the breaking point.
 * Identifies system degradation, memory leaks, and Firestore limits.
 *
 * Run:
 *   k6 run tests/performance/k6/stress-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9002';

// Custom metrics
const errorRate      = new Rate('error_rate');
const errorCount     = new Counter('total_errors');
const activeUsers    = new Gauge('active_virtual_users');
const responseTrend  = new Trend('response_time_ms', true);

export const options = {
  // Stress test: push to breaking point then recover
  stages: [
    { duration: '30s', target: 20  },
    { duration: '1m',  target: 50  },
    { duration: '1m',  target: 100 },
    { duration: '1m',  target: 150 },  // Beyond target — stress zone
    { duration: '1m',  target: 200 },  // High stress
    { duration: '30s', target: 100 },  // Begin recovery
    { duration: '30s', target: 50  },
    { duration: '30s', target: 0   },  // Full cool down
  ],
  thresholds: {
    // Stress thresholds — more relaxed than SLA
    http_req_duration:  ['p(95)<6000'],   // Allow slower under extreme load
    error_rate:         ['rate<0.05'],    // Allow up to 5% errors under stress
    http_req_failed:    ['rate<0.05'],
  },
};

const headers = {
  'Accept': 'text/html,application/xhtml+xml',
  'User-Agent': 'k6-stress-test/1.0 HiskyWShop',
};

export default function () {
  activeUsers.add(1);

  // ── High-frequency homepage hammering ────────────────────────────────────
  group('Stress: Homepage', function () {
    const res = http.get(`${BASE_URL}/`, { headers });
    responseTrend.add(res.timings.duration);

    const ok = check(res, {
      'status < 500':       (r) => r.status < 500,
      'no OOM error':       (r) => !r.body.includes('ENOMEM'),
      'no connection reset':(r) => r.status !== 0,
    });

    if (!ok) {
      errorCount.add(1);
      errorRate.add(1);
      console.warn(`[STRESS FAIL] VU=${__VU} status=${res.status} duration=${res.timings.duration}ms`);
    } else {
      errorRate.add(0);
    }
  });

  // ── Concurrent product fetches (Firestore stress) ─────────────────────────
  group('Stress: Concurrent Products', function () {
    const reqs = [
      ['GET', `${BASE_URL}/products`],
      ['GET', `${BASE_URL}/products/men`],
      ['GET', `${BASE_URL}/products/women`],
    ];

    const responses = http.batch(reqs.map(([method, url]) => ({
      method,
      url,
      params: { headers },
    })));

    responses.forEach((res, idx) => {
      responseTrend.add(res.timings.duration);
      check(res, {
        [`batch[${idx}]: no crash`]: (r) => r.status < 500,
      });
    });
  });

  // ── Rapid navigation simulation ───────────────────────────────────────────
  group('Stress: Rapid Navigation', function () {
    const routes = ['/', '/products', '/about', '/contact'];
    routes.forEach(route => {
      const res = http.get(`${BASE_URL}${route}`, { headers });
      check(res, {
        [`${route}: accessible`]: (r) => r.status < 500,
      });
      sleep(0.1); // No delay between nav — simulate rapid clicking
    });
  });

  // ── Admin endpoint under stress ───────────────────────────────────────────
  group('Stress: Admin Endpoint', function () {
    const res = http.get(`${BASE_URL}/admin`, { headers });
    check(res, {
      'Admin: server alive': (r) => r.status !== 0 && r.status < 500,
    });
  });

  activeUsers.add(-1);
  sleep(0.5); // Minimal think time to maximize stress
}

// ── Lifecycle: Setup & Teardown ───────────────────────────────────────────────
export function setup() {
  console.log(`🔥 Stress Test started against: ${BASE_URL}`);
  console.log('📊 Target: Find breaking point beyond 100 concurrent users');
}

export function teardown(data) {
  console.log('✅ Stress Test completed. Check results/stress-report.html');
}

export function handleSummary(data) {
  return {
    'tests/performance/results/stress-report.html': htmlReport(data),
    'tests/performance/results/stress-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
