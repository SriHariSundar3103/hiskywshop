/**
 * HiskyWShop — Frontend Performance Monitor
 * ==========================================
 * Injects performance monitoring into the Next.js app.
 * Tracks Web Vitals, re-renders, and runtime errors in real-time.
 *
 * Usage: Import this in your _app or layout.tsx during testing.
 * Then view collected data at:  window.__perfData
 */

'use client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PerfEntry {
  type: string;
  name?: string;
  value?: number;
  timestamp: number;
  details?: Record<string, unknown>;
}

interface PerfStore {
  webVitals:    PerfEntry[];
  renderCounts: Record<string, number>;
  errors:       PerfEntry[];
  navigations:  PerfEntry[];
  longTasks:    PerfEntry[];
  networkTimings: PerfEntry[];
  startTime:    number;
}

// ── Global perf store (accessible from DevTools) ──────────────────────────────
declare global {
  interface Window {
    __perfData: PerfStore;
    __reportPerf: () => void;
  }
}

// ── Initialize store ──────────────────────────────────────────────────────────
function initPerfStore(): PerfStore {
  return {
    webVitals:      [],
    renderCounts:   {},
    errors:         [],
    navigations:    [],
    longTasks:      [],
    networkTimings: [],
    startTime:      performance.now(),
  };
}

// ── Capture Web Vitals ────────────────────────────────────────────────────────
function observeWebVitals(store: PerfStore) {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformancePaintTiming;
      const lcp: PerfEntry = {
        type:      'LCP',
        value:     last.startTime,
        timestamp: Date.now(),
        details:   {
          element: (last as unknown as { element?: Element }).element?.tagName || 'unknown',
          url:     (last as unknown as { url?: string }).url || '',
        },
      };
      store.webVitals.push(lcp);
      if (last.startTime > 2500) {
        console.warn(`[PerfMonitor] ⚠ LCP is ${last.startTime.toFixed(0)}ms (SLA: <2500ms)`);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch {}

  // Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const ls = entry as unknown as { hadRecentInput: boolean; value: number };
        if (!ls.hadRecentInput) {
          clsValue += ls.value;
        }
      }
      store.webVitals.push({
        type:      'CLS',
        value:     clsValue,
        timestamp: Date.now(),
      });
      if (clsValue > 0.1) {
        console.warn(`[PerfMonitor] ⚠ CLS is ${clsValue.toFixed(4)} (SLA: <0.1) — check layout shifts`);
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch {}

  // First Input Delay / Interaction to Next Paint
  try {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as unknown as { processingStart: number; startTime: number; name: string };
        store.webVitals.push({
          type:      'FID',
          name:      e.name,
          value:     e.processingStart - e.startTime,
          timestamp: Date.now(),
        });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch {}

  // First Contentful Paint
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          store.webVitals.push({
            type:      'FCP',
            value:     entry.startTime,
            timestamp: Date.now(),
          });
          if (entry.startTime > 1800) {
            console.warn(`[PerfMonitor] ⚠ FCP is ${entry.startTime.toFixed(0)}ms (SLA: <1800ms)`);
          }
        }
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
  } catch {}

  // Long Tasks (blocking >50ms)
  try {
    const ltObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        store.longTasks.push({
          type:      'LongTask',
          value:     entry.duration,
          timestamp: Date.now(),
          details:   { startTime: entry.startTime },
        });
        if (entry.duration > 100) {
          console.warn(`[PerfMonitor] ⚠ Long task: ${entry.duration.toFixed(0)}ms — may cause jank`);
        }
      }
    });
    ltObserver.observe({ entryTypes: ['longtask'] });
  } catch {}

  // Navigation Timing
  try {
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const nav = entry as PerformanceNavigationTiming;
        store.navigations.push({
          type:      'Navigation',
          name:      nav.name,
          value:     nav.loadEventEnd - nav.fetchStart,
          timestamp: Date.now(),
          details:   {
            dns:        nav.domainLookupEnd - nav.domainLookupStart,
            tcp:        nav.connectEnd - nav.connectStart,
            ttfb:       nav.responseStart - nav.requestStart,
            domLoad:    nav.domContentLoadedEventEnd - nav.fetchStart,
            pageLoad:   nav.loadEventEnd - nav.fetchStart,
          },
        });
      }
    });
    navObserver.observe({ entryTypes: ['navigation'] });
  } catch {}

  // Resource Timing (images, scripts)
  try {
    const resObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const res = entry as PerformanceResourceTiming;
        if (res.duration > 1000) { // Flag slow resources (>1s)
          store.networkTimings.push({
            type:      'SlowResource',
            name:      res.name,
            value:     res.duration,
            timestamp: Date.now(),
            details:   {
              initiatorType: res.initiatorType,
              size:          res.transferSize,
            },
          });
          console.warn(`[PerfMonitor] ⚠ Slow resource: ${res.name.split('/').pop()} (${res.duration.toFixed(0)}ms)`);
        }
      }
    });
    resObserver.observe({ entryTypes: ['resource'] });
  } catch {}
}

// ── Capture Runtime Errors ────────────────────────────────────────────────────
function observeErrors(store: PerfStore) {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (e) => {
    store.errors.push({
      type:      'JS Error',
      name:      e.message,
      timestamp: Date.now(),
      details:   {
        filename: e.filename,
        lineno:   e.lineno,
        colno:    e.colno,
        stack:    e.error?.stack?.slice(0, 500),
      },
    });
    console.error(`[PerfMonitor] 🔴 Runtime error:`, e.message);
  });

  window.addEventListener('unhandledrejection', (e) => {
    store.errors.push({
      type:      'Unhandled Promise',
      name:      String(e.reason),
      timestamp: Date.now(),
      details:   { reason: String(e.reason) },
    });
    console.error(`[PerfMonitor] 🔴 Unhandled rejection:`, e.reason);
  });
}

// ── Report formatter ──────────────────────────────────────────────────────────
function reportPerf(store: PerfStore) {
  const elapsed = ((performance.now() - store.startTime) / 1000).toFixed(1);

  console.group(`%c📊 HiskyWShop Performance Report (${elapsed}s elapsed)`, 'font-weight:bold;font-size:14px;color:#3b82f6');

  // Web Vitals
  console.group('Web Vitals');
  const vitalsMap: Record<string, number[]> = {};
  store.webVitals.forEach(v => {
    vitalsMap[v.type] = vitalsMap[v.type] || [];
    if (v.value !== undefined) vitalsMap[v.type].push(v.value);
  });
  Object.entries(vitalsMap).forEach(([type, values]) => {
    const last = values[values.length - 1];
    const sla = type === 'LCP' ? 2500 : type === 'FCP' ? 1800 : type === 'CLS' ? 0.1 : 300;
    const ok  = last <= sla;
    console.log(`%c${type}: ${last?.toFixed(type === 'CLS' ? 4 : 0)}${type === 'CLS' ? '' : 'ms'} (SLA: ${sla}${type === 'CLS' ? '' : 'ms'}) — ${ok ? '✅' : '❌'}`,
      `color:${ok ? '#22c55e' : '#ef4444'}`);
  });
  console.groupEnd();

  // Errors
  if (store.errors.length > 0) {
    console.group(`%c🔴 Errors (${store.errors.length})`, 'color:#ef4444');
    store.errors.forEach(e => console.error(e.name, e.details));
    console.groupEnd();
  } else {
    console.log('%c✅ No runtime errors detected', 'color:#22c55e');
  }

  // Long Tasks
  if (store.longTasks.length > 0) {
    console.group(`%c⚠ Long Tasks (${store.longTasks.length} blocking events)`, 'color:#f59e0b');
    store.longTasks
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 5)
      .forEach(t => console.warn(`${t.value?.toFixed(0)}ms at ${t.details?.startTime}`));
    console.groupEnd();
  }

  // Slow Resources
  if (store.networkTimings.length > 0) {
    console.group(`%c🐢 Slow Resources (${store.networkTimings.length})`, 'color:#f59e0b');
    store.networkTimings.forEach(r => console.warn(`${r.value?.toFixed(0)}ms — ${r.name}`));
    console.groupEnd();
  }

  console.groupEnd();
  return store;
}

// ── Initialize & Export ───────────────────────────────────────────────────────
let _store: PerfStore | null = null;

export function initPerfMonitor() {
  if (typeof window === 'undefined') return;
  if (_store) return; // Already initialized

  _store = initPerfStore();
  observeWebVitals(_store);
  observeErrors(_store);

  // Expose to DevTools console
  window.__perfData   = _store;
  window.__reportPerf = () => reportPerf(_store!);

  console.log(
    '%c[PerfMonitor] 🚀 Initialized — type window.__reportPerf() in console to see results',
    'color:#3b82f6;font-weight:bold'
  );
}

export function getPerfData() {
  return _store;
}

export function trackRender(componentName: string) {
  if (!_store) return;
  _store.renderCounts[componentName] = (_store.renderCounts[componentName] || 0) + 1;

  // Warn on excessive renders
  if (_store.renderCounts[componentName] > 10) {
    console.warn(
      `[PerfMonitor] ⚠ ${componentName} has rendered ${_store.renderCounts[componentName]} times — possible infinite re-render loop!`
    );
  }
}
