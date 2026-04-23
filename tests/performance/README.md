# 🚀 HiskyWShop — Performance Testing Suite

> **Role:** Senior Performance Testing Engineer  
> **Goal:** Validate stability under 100 concurrent users — Load, Stress, Spike, Firestore, Lighthouse

---

## 📁 Structure

```
tests/performance/
├── run-all.mjs                    # Master orchestrator — run all tests
├── results/                       # Auto-generated reports go here
│
├── node/
│   └── concurrency-test.mjs       # ✅ Pure Node.js — No setup required
│
├── k6/
│   ├── load-test.js               # 100 concurrent users (5–10 min)
│   ├── stress-test.js             # Push to 200 users (find breaking point)
│   └── spike-test.js              # Flash-sale spike simulation
│
├── locust/
│   └── locustfile.py              # Python-based, 3 user scenarios
│
├── lighthouse/
│   └── lighthouse-audit.mjs       # Web Vitals across all pages
│
├── firestore/
│   └── firestore-perf-test.mjs    # 100 concurrent Firestore reads/writes
│
└── frontend/
    └── perf-monitor.ts            # Inject into app for real-time monitoring
```

---

## ⚡ Quick Start

### Step 1 — Start the dev server (Terminal 1)
```powershell
npm run dev
```

### Step 2 — Run all tests (Terminal 2)
```powershell
# Run everything (recommended)
npm run perf

# Target your Vercel deployment instead
npm run perf -- --url=https://hiskywshop.vercel.app
```

---

## 🧪 Individual Tests

### ✅ Node.js Concurrency Test (No install needed)
```powershell
npm run perf:concurrency

# Custom options
node tests/performance/node/concurrency-test.mjs --url=http://localhost:9002 --users=100 --duration=60000
```
**What it does:** Ramps from 1→100 users, sustains for 30s, validates every route.

---

### 📊 k6 Load Test (Install k6 first)

**Install k6 on Windows:**
```powershell
winget install k6 --source winget
# OR download from: https://k6.io/docs/get-started/installation/
```

```powershell
# Load Test (100 users, 5-10 minutes)
npm run perf:k6

# Stress Test (push to 200 users)
npm run perf:k6:stress

# Spike Test (flash sale simulation)
npm run perf:k6:spike

# With custom URL
k6 run --env BASE_URL=https://hiskywshop.vercel.app tests/performance/k6/load-test.js

# With HTML output report
k6 run --out json=tests/performance/results/k6-results.json tests/performance/k6/load-test.js
```

---

### 🐍 Locust Load Test (Python)

```powershell
pip install locust

# Open Locust Web UI (http://localhost:8089)
locust -f tests/performance/locust/locustfile.py --host=http://localhost:9002

# Headless mode — 100 users, ramp 10/s, run 5 minutes
locust -f tests/performance/locust/locustfile.py `
  --host=http://localhost:9002 `
  --headless -u 100 -r 10 -t 5m `
  --html=tests/performance/results/locust-report.html
```

**User Scenarios:**
| Scenario | Weight | Behavior |
|----------|--------|----------|
| Anonymous Shopper | 80% | Browse homepage, categories, search, product detail |
| Power Shopper | 15% | Rapid navigation (no delay) |
| Admin User | 5% | Dashboard, product management pages |

---

### 🔍 Lighthouse Audit

```powershell
npm install -g lighthouse

npm run perf:lighthouse

# With custom URL
node tests/performance/lighthouse/lighthouse-audit.mjs --url=https://hiskywshop.vercel.app
```

**SLA Thresholds:**
| Metric | Target |
|--------|--------|
| Performance Score | ≥ 85 |
| Accessibility | ≥ 90 |
| SEO | ≥ 90 |
| LCP | < 2,500ms |
| CLS | < 0.1 |
| TBT | < 200ms |

---

### 🔥 Firestore Concurrency Test

```powershell
npm install firebase-admin

# Set service account (download from Firebase Console → Project Settings → Service Accounts)
$env:SERVICE_ACCOUNT = "./service-account.json"

npm run perf:firestore
```

**Tests:**
- 100 concurrent reads from `products` collection
- 10 concurrent writes (race condition simulation)
- 55 mixed read+write (contention test)

---

### 🖥️ Frontend Real-Time Monitor

Add to `src/app/layout.tsx` for in-browser monitoring during testing:

```typescript
import { initPerfMonitor } from '@/tests/performance/frontend/perf-monitor';

// In your layout component:
useEffect(() => { initPerfMonitor(); }, []);
```

Then open Chrome DevTools Console and run:
```javascript
window.__reportPerf()
```

**Tracks:**
- LCP, CLS, FCP, TBT (Web Vitals)
- Component render counts (infinite re-render detection)
- Runtime JS errors
- Long tasks (>50ms — jank indicators)
- Slow network resources (>1s)

---

## 📈 Performance SLA Targets

| Metric | SLA | Severity if Breached |
|--------|-----|---------------------|
| Page load (p95) | < 3,000ms | 🔴 Critical |
| Firestore read (p95) | < 2,000ms | 🔴 Critical |
| Error rate | < 1% | 🔴 Critical |
| HTTP 5xx rate | 0% | 🔴 Critical |
| Lighthouse Performance | ≥ 85 | 🟡 High |
| LCP | < 2,500ms | 🟡 High |
| CLS | < 0.1 | 🟡 High |
| TBT | < 200ms | 🟡 High |
| Admin dashboard load | < 4,000ms | 🟢 Medium |

---

## 🧪 Critical Test Scenarios

### Edge Case 1 — Multiple users editing the same product
```powershell
# Enable ConcurrentEditorUser in locustfile.py (set weight: 10)
locust -f tests/performance/locust/locustfile.py --host=http://localhost:9002 --headless -u 20 -r 5 -t 2m
```

### Edge Case 2 — Network throttle simulation (Chrome DevTools)
1. Open Chrome DevTools → Network tab
2. Select "Slow 3G" throttle preset
3. Navigate through the site
4. Observe LCP, CLS, image loading

### Edge Case 3 — Rapid page navigation
Already covered in `PowerShopper` Locust scenario (0.1–0.5s think time).

### Edge Case 4 — Flash sale spike
```powershell
npm run perf:k6:spike
```

---

## 📋 Failure Report Template

When a test fails, document it as:

| Field | Details |
|-------|---------|
| **Error Type** | e.g. HTTP 500, TIMEOUT, CLS violation |
| **Affected Feature** | e.g. Product listing, Admin dashboard |
| **Steps to Reproduce** | URL, user count, duration |
| **Severity** | Critical / High / Medium / Low |
| **Metric at Failure** | e.g. p95 = 5,200ms (SLA: 3,000ms) |
| **Suggested Fix** | e.g. Add Firestore index, cache product list |

---

## 📊 Report Files Generated

After running tests, find reports in `tests/performance/results/`:

| File | Description |
|------|-------------|
| `perf-report.html` | **Unified HTML dashboard** |
| `k6-report.html` | k6 load test report |
| `k6-summary.json` | k6 raw metrics (JSON) |
| `stress-report.html` | k6 stress test report |
| `spike-report.html` | k6 spike test report |
| `concurrency-report.json` | Node concurrency test JSON |
| `lighthouse/` | Per-page Lighthouse reports |

---

## ✅ Expected Success Criteria

- [ ] No crashes under 100 concurrent users
- [ ] No HTTP 5xx errors
- [ ] No infinite re-render loops  
- [ ] No UI flickering or blinking
- [ ] Firestore responds < 2,000ms at p95
- [ ] Page loads < 3,000ms at p95
- [ ] Admin dashboard stable under auth load
- [ ] Google Auth session persists
- [ ] Real-time product updates working
- [ ] Images load correctly
- [ ] Lighthouse score ≥ 85
