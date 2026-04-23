/**
 * HiskyWShop — k6 Spike Test
 * ==========================
 * Simulates sudden traffic spikes (flash sale scenario).
 * Tests recovery and resilience under sudden load bursts.
 *
 * Run:
 *   k6 run tests/performance/k6/spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9002';

const errorRate   = new Rate('spike_error_rate');
const errorCount  = new Counter('spike_errors');
const latency     = new Trend('spike_latency_ms', true);

export const options = {
  stages: [
    { duration: '10s', target: 5   },  // Baseline
    { duration: '5s',  target: 100 },  // SPIKE! Jump to 100 instantly
    { duration: '1m',  target: 100 },  // Hold spike
    { duration: '5s',  target: 5   },  // Rapid drop
    { duration: '1m',  target: 5   },  // Recovery observation
    { duration: '5s',  target: 100 },  // Second spike
    { duration: '30s', target: 100 },  // Hold
    { duration: '10s', target: 0   },  // End
  ],
  thresholds: {
    spike_error_rate: ['rate<0.10'],    // Allow up to 10% during spikes
    http_req_duration: ['p(95)<8000'],  // 8s allowed during spikes
    http_req_failed:   ['rate<0.10'],
  },
};

const headers = { 'User-Agent': 'k6-spike-test/1.0' };

export default function () {
  const routes = [
    '/',
    '/products',
    '/products/men',
    '/products/women',
    '/products/kids',
  ];

  const route = routes[__VU % routes.length];
  const res = http.get(`${BASE_URL}${route}`, { headers });

  latency.add(res.timings.duration);

  const ok = check(res, {
    'spike: status < 500':      (r) => r.status < 500,
    'spike: response received': (r) => r.status !== 0,
    'spike: no timeout':        (r) => r.timings.duration < 10000,
  });

  if (!ok) {
    errorCount.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/performance/results/spike-report.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
