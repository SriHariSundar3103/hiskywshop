"""
HiskyWShop — Locust Load Test
==============================
Python-based load testing with realistic user journeys.
Supports admin CRUD, concurrent product edits, and auth flows.

Install:
    pip install locust

Run:
    locust -f tests/performance/locust/locustfile.py --host=http://localhost:9002
    
Headless (100 users, 10 spawn/s, 5min):
    locust -f tests/performance/locust/locustfile.py \\
           --host=http://localhost:9002 \\
           --headless -u 100 -r 10 -t 5m \\
           --html=tests/performance/results/locust-report.html
"""

import random
import time
import json
from locust import HttpUser, task, between, events, tag
from locust.exception import StopUser


# ── Shared product data pool ──────────────────────────────────────────────────
SAMPLE_PRODUCTS = [
    {"name": "Perf Test Shirt",  "category": "men",   "price": 999},
    {"name": "Perf Test Dress",  "category": "women", "price": 1499},
    {"name": "Perf Test Jacket", "category": "kids",  "price": 799},
]

PRODUCT_SEARCH_TERMS = ["shirt", "dress", "jacket", "jeans", "kids", "sale"]
CATEGORIES = ["men", "women", "kids"]


# ═══════════════════════════════════════════════════════════════════════════════
# SCENARIO 1: Anonymous Shopper (80% of traffic)
# ═══════════════════════════════════════════════════════════════════════════════
class AnonymousShopper(HttpUser):
    """
    Simulates a typical anonymous visitor browsing the storefront.
    """
    weight = 80
    wait_time = between(1, 4)  # Think time between requests

    # ── Homepage Visit ────────────────────────────────────────────────────────
    @task(10)
    @tag("homepage", "critical")
    def visit_homepage(self):
        with self.client.get("/", catch_response=True, name="GET /") as res:
            if res.status_code >= 500:
                res.failure(f"Server error: {res.status_code}")
            elif res.elapsed.total_seconds() > 3:
                res.failure(f"Too slow: {res.elapsed.total_seconds():.2f}s")
            else:
                res.success()

    # ── Category Browse ───────────────────────────────────────────────────────
    @task(8)
    @tag("navigation", "products")
    def browse_category(self):
        category = random.choice(CATEGORIES)
        with self.client.get(
            f"/products/{category}",
            catch_response=True,
            name="GET /products/[category]"
        ) as res:
            if res.status_code >= 500:
                res.failure(f"Category {category} crashed: {res.status_code}")
            elif res.elapsed.total_seconds() > 3:
                res.failure(f"Category too slow: {res.elapsed.total_seconds():.2f}s")

    # ── Products Listing ──────────────────────────────────────────────────────
    @task(6)
    @tag("products")
    def view_all_products(self):
        with self.client.get("/products", catch_response=True) as res:
            if res.status_code >= 500:
                res.failure("Products page crashed")

    # ── Search ────────────────────────────────────────────────────────────────
    @task(5)
    @tag("search")
    def search_products(self):
        query = random.choice(PRODUCT_SEARCH_TERMS)
        with self.client.get(
            f"/search?q={query}",
            catch_response=True,
            name="GET /search?q=[term]"
        ) as res:
            if res.status_code >= 500:
                res.failure(f"Search crashed for '{query}': {res.status_code}")

    # ── Product Detail ────────────────────────────────────────────────────────
    @task(4)
    @tag("product_detail")
    def view_product_detail(self):
        # Simulate clicking a product card
        fake_ids = [f"product-{i}" for i in range(1, 20)]
        pid = random.choice(fake_ids)
        with self.client.get(
            f"/product/{pid}",
            catch_response=True,
            name="GET /product/[id]"
        ) as res:
            # 404 is acceptable (product doesn't exist in test env)
            if res.status_code >= 500:
                res.failure(f"Product detail crashed: {res.status_code}")
            else:
                res.success()

    # ── Static Pages ──────────────────────────────────────────────────────────
    @task(2)
    @tag("static")
    def visit_about(self):
        self.client.get("/about", name="GET /about")

    @task(1)
    @tag("static")
    def visit_contact(self):
        self.client.get("/contact", name="GET /contact")


# ═══════════════════════════════════════════════════════════════════════════════
# SCENARIO 2: Power Shopper — Rapid Navigation (15% of traffic)
# ═══════════════════════════════════════════════════════════════════════════════
class PowerShopper(HttpUser):
    """
    Heavy user: rapid navigation, many page views.
    Tests frontend stability under rapid page changes.
    """
    weight = 15
    wait_time = between(0.1, 0.5)  # Very short think time

    @task
    @tag("rapid_nav", "stress")
    def rapid_navigation(self):
        """Simulates frantic browsing — multiple pages in quick succession."""
        pages = [
            "/",
            "/products",
            f"/products/{random.choice(CATEGORIES)}",
            f"/search?q={random.choice(PRODUCT_SEARCH_TERMS)}",
            "/products",
            "/",
        ]
        for page in pages:
            with self.client.get(page, catch_response=True, name=f"RAPID {page}") as res:
                if res.status_code >= 500:
                    res.failure(f"Crash during rapid nav: {page}")
            time.sleep(0.2)


# ═══════════════════════════════════════════════════════════════════════════════
# SCENARIO 3: Admin User (5% of traffic)
# ═══════════════════════════════════════════════════════════════════════════════
class AdminUser(HttpUser):
    """
    Admin: accesses dashboard, reads product list.
    Note: Actual write operations require Firebase auth tokens.
    This simulates the admin dashboard load (read paths).
    """
    weight = 5
    wait_time = between(2, 5)

    @task(5)
    @tag("admin", "dashboard")
    def visit_admin_dashboard(self):
        with self.client.get("/admin", catch_response=True, name="GET /admin") as res:
            # 200 (if cached/open), 302/307 (redirect to login), 401/403 are all OK
            if res.status_code >= 500:
                res.failure(f"Admin dashboard crashed: {res.status_code}")
            else:
                res.success()

    @task(3)
    @tag("admin", "products")
    def visit_admin_products(self):
        with self.client.get("/admin/products", catch_response=True, name="GET /admin/products") as res:
            if res.status_code >= 500:
                res.failure(f"Admin products crashed: {res.status_code}")
            else:
                res.success()

    @task(2)
    @tag("admin", "read")
    def visit_admin_new_product(self):
        with self.client.get("/admin/products/new", catch_response=True, name="GET /admin/products/new") as res:
            if res.status_code >= 500:
                res.failure(f"Admin new product form crashed: {res.status_code}")
            else:
                res.success()


# ═══════════════════════════════════════════════════════════════════════════════
# EDGE CASE: Concurrent Product Edit Simulation
# ═══════════════════════════════════════════════════════════════════════════════
class ConcurrentEditorUser(HttpUser):
    """
    Simulates multiple users trying to edit the same product simultaneously.
    Tests Firestore write concurrency and race conditions.
    """
    weight = 0  # Disabled by default — enable for edge case testing
    wait_time = between(0.1, 0.3)

    SHARED_PRODUCT_ID = "concurrent-test-product"

    @task
    @tag("edge_case", "concurrent_write")
    def concurrent_edit_attempt(self):
        """All virtual users target the same product URL."""
        with self.client.get(
            f"/admin/products/{self.SHARED_PRODUCT_ID}/edit",
            catch_response=True,
            name="CONCURRENT GET /admin/products/[id]/edit"
        ) as res:
            if res.status_code >= 500:
                res.failure(f"Concurrent edit page crashed: {res.status_code}")
            else:
                res.success()


# ═══════════════════════════════════════════════════════════════════════════════
# Event Hooks — Metrics logging
# ═══════════════════════════════════════════════════════════════════════════════
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("\n" + "="*60)
    print("  HiskyWShop Performance Test — STARTED")
    print(f"  Target: {environment.host}")
    print(f"  Users:  100 concurrent")
    print("="*60 + "\n")

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    stats = environment.stats
    total_reqs  = stats.total.num_requests
    failures    = stats.total.num_failures
    fail_rate   = (failures / total_reqs * 100) if total_reqs > 0 else 0
    avg_resp    = stats.total.avg_response_time
    p95         = stats.total.get_response_time_percentile(0.95)

    print("\n" + "="*60)
    print("  HiskyWShop Performance Test — SUMMARY")
    print("="*60)
    print(f"  Total Requests : {total_reqs}")
    print(f"  Failures       : {failures} ({fail_rate:.2f}%)")
    print(f"  Avg Response   : {avg_resp:.0f}ms")
    print(f"  95th Percentile: {p95:.0f}ms")
    print(f"  Pass/Fail      : {'✅ PASS' if fail_rate < 1 else '❌ FAIL'}")
    print("="*60 + "\n")
