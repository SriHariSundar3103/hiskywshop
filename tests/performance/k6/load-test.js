/**
 * HiskyWShop — k6 Load & Stress Test
 * ====================================
 * Simulates 100 concurrent users hitting all major routes.
 *
 * Run:
 *   k6 run tests/performance/k6/load-test.js
 *   k6 run --out json=results/k6-results.json tests/performance/k6/load-test.js
 *
 * Install k6:  https://k6.io/docs/get-started/installation/
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// ── Custom Metrics ────────────────────────────────────────────────────────────
const errorCount      = new Counter('errors');
const errorRate       = new Rate('error_rate');
const homepageTrend   = new Trend('homepage_load_ms', true);
const productsTrend   = new Trend('products_load_ms', true);
const productDetailTrend = new Trend('product_detail_load_ms', true);
const adminTrend      = new Trend('admin_dashboard_load_ms', true);
const firestoreTrend  = new Trend('firestore_api_ms', true);

// ── Target URL ────────────────────────────────────────────────────────────────
// Change this to your Vercel deployment URL or localhost
const BASE_URL = __ENV.BASE_URL || 'http://localhost:9002';

// ── Test Configuration ────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '1m',  target: 10  },   // Warm-up: ramp to 10 users
    { duration: '2m',  target: 50  },   // Ramp to 50 users
    { duration: '2m',  target: 100 },   // Ramp to 100 concurrent users
    { duration: '3m',  target: 100 },   // Sustain peak load
    { duration: '1m',  target: 50  },   // Scale down
    { duration: '1m',  target: 0   },   // Cool down
  ],
  thresholds: {
    // SLA definitions
    http_req_duration:              ['p(95)<3000'],  // 95% of requests < 3s
    http_req_duration:              ['p(99)<5000'],  // 99% < 5s
    error_rate:                     ['rate<0.01'],   // < 1% error rate
    homepage_load_ms:               ['p(95)<3000'],
    products_load_ms:               ['p(95)<3000'],
    product_detail_load_ms:         ['p(95)<3000'],
    admin_dashboard_load_ms:        ['p(95)<4000'],
    firestoreTrend:                 ['p(95)<2000'],
    http_req_failed:                ['rate<0.01'],
  },
};

// ── Shared Headers ────────────────────────────────────────────────────────────
const headers = {
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection':      'keep-alive',
  'User-Agent':      'k6-perf-test/1.0 HiskyWShop-LoadTest',
};

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Accept':       'application/json',
};

// ── Helper: assert response ───────────────────────────────────────────────────
function assertResponse(res, tag, trend) {
  const ok = check(res, {
    [`${tag}: status 200`]:    (r) => r.status === 200,
    [`${tag}: no server error`]: (r) => r.status < 500,
    [`${tag}: body not empty`]:  (r) => r.body && r.body.length > 0,
  });

  if (!ok) {
    errorCount.add(1);
    errorRate.add(1);
    console.error(`[FAIL] ${tag} | status=${res.status} | url=${res.url}`);
  } else {
    errorRate.add(0);
  }

  if (trend) trend.add(res.timings.duration);
  return ok;
}

// ── Virtual User Scenario ────────────────────────────────────────────────────
export default function () {
  const userId = __VU;   // Virtual User ID
  const iter   = __ITER; // Iteration number

  // ── 1. Homepage ──────────────────────────────────────────────────────────
  group('Homepage', function () {
    const res = http.get(`${BASE_URL}/`, { headers });
    assertResponse(res, 'Homepage', homepageTrend);

    // Check critical UI elements exist in HTML
    check(res, {
      'Homepage: has nav':       (r) => r.body.includes('nav') || r.body.includes('header'),
      'Homepage: no JS error':   (r) => !r.body.includes('Error: '),
    });

    sleep(randomBetween(1, 2));
  });

  // ── 2. Category Navigation ───────────────────────────────────────────────
  const categories = ['men', 'women', 'kids'];
  const category = categories[userId % categories.length];

  group(`Category: ${category}`, function () {
    const res = http.get(`${BASE_URL}/products/${category}`, { headers });
    assertResponse(res, `Category/${category}`, productsTrend);
    sleep(randomBetween(1, 3));
  });

  // ── 3. Product Listing Page ───────────────────────────────────────────────
  group('Products Listing', function () {
    const res = http.get(`${BASE_URL}/products`, { headers });
    assertResponse(res, 'Products', productsTrend);
    sleep(randomBetween(0.5, 1.5));
  });

  // ── 4. Product Detail Pages ───────────────────────────────────────────────
  // Simulate clicking on a product — use sample product IDs
  const sampleProductIds = [
    'product-1', 'product-2', 'product-3', 'product-4', 'product-5',
  ];
  const pid = sampleProductIds[userId % sampleProductIds.length];

  group('Product Detail', function () {
    const res = http.get(`${BASE_URL}/product/${pid}`, { headers });
    // 200 or 404 is acceptable (product may not exist); 500 is a failure
    check(res, {
      'Product Detail: no server error': (r) => r.status < 500,
    });
    if (res.status !== 200 && res.status !== 404) {
      errorCount.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
    productDetailTrend.add(res.timings.duration);
    sleep(randomBetween(1, 2));
  });

  // ── 5. Search Page ───────────────────────────────────────────────────────
  group('Search', function () {
    const queries = ['shirt', 'kids', 'dress', 'jacket', 'jeans'];
    const q = queries[userId % queries.length];
    const res = http.get(`${BASE_URL}/search?q=${q}`, { headers });
    assertResponse(res, `Search/${q}`, productsTrend);
    sleep(randomBetween(0.5, 1));
  });

  // ── 6. Static/Info Pages ─────────────────────────────────────────────────
  group('Static Pages', function () {
    const pages = ['/about', '/contact'];
    pages.forEach((page) => {
      const res = http.get(`${BASE_URL}${page}`, { headers });
      check(res, {
        [`${page}: no crash`]: (r) => r.status < 500,
      });
    });
    sleep(randomBetween(0.5, 1));
  });

  // ── 7. Admin Dashboard (read-only check — no auth) ───────────────────────
  group('Admin Dashboard Gate', function () {
    const res = http.get(`${BASE_URL}/admin`, { headers });
    // Admin should redirect (302/307) or return 200/403/401 — never 500
    check(res, {
      'Admin: no server crash': (r) => r.status < 500,
      'Admin: redirects or shows page': (r) => [200, 301, 302, 307, 308, 401, 403].includes(r.status),
    });
    adminTrend.add(res.timings.duration);
    sleep(randomBetween(0.5, 1));
  });

  // ── 8. API / Next.js Route Handlers ─────────────────────────────────────
  group('API Routes', function () {
    // Health check / API if available
    const apiRes = http.get(`${BASE_URL}/api/health`, { headers: jsonHeaders });
    if (apiRes.status !== 404) {
      check(apiRes, {
        'API /health: 200': (r) => r.status === 200,
      });
      firestoreTrend.add(apiRes.timings.duration);
    }
    sleep(randomBetween(0.3, 0.8));
  });

  // Think time between full user journeys
  sleep(randomBetween(2, 5));
}

// ── Utility ───────────────────────────────────────────────────────────────────
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// ── HTML Report Generation ────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'tests/performance/results/k6-report.html': htmlReport(data),
    'tests/performance/results/k6-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
