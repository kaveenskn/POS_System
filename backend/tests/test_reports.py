import pytest
from datetime import datetime, timezone
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.product import Product
from app.models.report import Purchase, PurchaseItem, Sale, SaleItem, SupplierPayment
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db: Session = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Seed test data for reports
    with TestingSessionLocal() as db:
        p1 = Product(
            name="Test Brake Pads",
            code="T-BP-001",
            brand="Brembo",
            category="Braking System",
            cost_price=1500.0,
            selling_price=2200.0,
            quantity=10,
            min_stock_level=5,
        )
        p2 = Product(
            name="Test Spark Plug",
            code="T-SP-001",
            brand="NGK",
            category="Electrical & Lighting",
            cost_price=500.0,
            selling_price=800.0,
            quantity=2,
            min_stock_level=5,
        )
        p3 = Product(
            name="Test Oil Filter",
            code="T-OF-001",
            brand="Yamaha Genuine",
            category="Oils & Lubricants",
            cost_price=600.0,
            selling_price=950.0,
            quantity=0,
            min_stock_level=3,
        )
        db.add_all([p1, p2, p3])
        db.commit()

        now = datetime.now(timezone.utc)
        sale = Sale(
            invoice_number="INV-TEST-001",
            sale_date=now,
            subtotal=3000.0,
            discount_amount=200.0,
            tax_amount=0.0,
            total_amount=2800.0,
            payment_method="Cash",
            cashier_name="Admin",
            customer_name="Test Customer",
            items=[
                SaleItem(
                    product_name="Test Brake Pads",
                    product_code="T-BP-001",
                    quantity=1,
                    unit_price=2200.0,
                    cost_price=1500.0,
                    subtotal=2200.0,
                ),
                SaleItem(
                    product_name="Test Spark Plug",
                    product_code="T-SP-001",
                    quantity=1,
                    unit_price=800.0,
                    cost_price=500.0,
                    subtotal=800.0,
                ),
            ],
        )
        db.add(sale)

        purchase = Purchase(
            purchase_number="PO-TEST-001",
            supplier_name="Brembo Lanka",
            purchase_date=now,
            total_amount=15000.0,
            paid_amount=10000.0,
            outstanding_amount=5000.0,
            payment_status="Partial",
            items=[
                PurchaseItem(
                    product_name="Test Brake Pads",
                    product_code="T-BP-001",
                    quantity=10,
                    unit_cost=1500.0,
                    subtotal=15000.0,
                )
            ],
            payments=[
                SupplierPayment(
                    supplier_name="Brembo Lanka",
                    payment_date=now,
                    amount=10000.0,
                    payment_method="Bank Transfer",
                    reference_number="REF-001",
                )
            ],
        )
        db.add(purchase)
        db.commit()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_sales_report_api(client: TestClient):
    res = client.get("/api/v1/reports/sales?period=today")
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["number_of_transactions"] == 1
    assert data["summary"]["total_sales_amount"] == 2800.0
    assert data["summary"]["products_sold_count"] == 2
    assert len(data["sales"]) == 1
    assert data["sales"][0]["invoice_number"] == "INV-TEST-001"


def test_inventory_reports_api(client: TestClient):
    # 1. Current stock
    cs_res = client.get("/api/v1/reports/inventory/current-stock")
    assert cs_res.status_code == 200
    cs_data = cs_res.json()
    assert cs_data["total_items_count"] == 12  # 10 + 2 + 0

    # 2. Low stock (quantity <= min_stock_level and quantity > 0)
    ls_res = client.get("/api/v1/reports/inventory/low-stock")
    assert ls_res.status_code == 200
    ls_data = ls_res.json()
    assert ls_data["low_stock_count"] == 1
    assert ls_data["items"][0]["sku"] == "T-SP-001"

    # 3. Out of stock (quantity <= 0)
    os_res = client.get("/api/v1/reports/inventory/out-of-stock")
    assert os_res.status_code == 200
    os_data = os_res.json()
    assert os_data["out_of_stock_count"] == 1
    assert os_data["items"][0]["sku"] == "T-OF-001"


def test_purchase_reports_api(client: TestClient):
    # 1. By supplier
    sup_res = client.get("/api/v1/reports/purchases/by-supplier")
    assert sup_res.status_code == 200
    sup_data = sup_res.json()
    assert len(sup_data["suppliers"]) == 1
    assert sup_data["suppliers"][0]["supplier_name"] == "Brembo Lanka"
    assert sup_data["suppliers"][0]["outstanding_amount"] == 5000.0

    # 2. By product
    prod_res = client.get("/api/v1/reports/purchases/by-product")
    assert prod_res.status_code == 200
    prod_data = prod_res.json()
    assert len(prod_data["products"]) == 1
    assert prod_data["products"][0]["sku"] == "T-BP-001"
    assert prod_data["products"][0]["quantity_purchased"] == 10

    # 3. Purchase history
    hist_res = client.get("/api/v1/reports/purchases/history")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert len(hist_data["purchases"]) == 1
    assert hist_data["purchases"][0]["purchase_number"] == "PO-TEST-001"

    # 4. Supplier payments
    pmt_res = client.get("/api/v1/reports/purchases/supplier-payments")
    assert pmt_res.status_code == 200
    pmt_data = pmt_res.json()
    assert pmt_data["total_paid"] == 10000.0

