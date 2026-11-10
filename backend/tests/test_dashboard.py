import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app

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
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_dashboard_metrics_empty_db(client: TestClient):
    resp = client.get("/api/v1/dashboard/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data
    assert data["summary"]["today_sales"] == 0.0
    assert data["summary"]["total_products"] == 0
    assert len(data["sales_trend_days"]) == 7
    assert len(data["monthly_trend"]) == 6
    assert isinstance(data["top_selling_products"], list)
    assert isinstance(data["recent_invoices"], list)
    assert isinstance(data["low_stock_alerts"], list)
    assert isinstance(data["category_distribution"], list)


def test_dashboard_metrics_with_data(client: TestClient):
    # 1. Create product
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "Brembo Sintered Front Brake Pads",
            "code": "BRM-BP-001",
            "brand": "Brembo",
            "category": "Braking System",
            "cost_price": 4200.0,
            "selling_price": 6500.0,
            "quantity": 3,  # Below min_stock_level of 5
            "min_stock_level": 5,
        },
    )
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # 2. Create invoice
    inv_resp = client.post(
        "/api/v1/invoices",
        json={
            "payment_method": "cash",
            "amount_paid": 6500.0,
            "discount_amount": 0.0,
            "notes": "Counter sale",
            "items": [
                {
                    "product_id": prod_id,
                    "quantity": 1,
                }
            ],
        },
    )
    assert inv_resp.status_code == 201

    # 3. Query dashboard metrics
    dash_resp = client.get("/api/v1/dashboard/metrics")
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()

    summary = dash_data["summary"]
    assert summary["today_sales"] == 6500.0
    assert summary["today_invoices_count"] == 1
    assert summary["total_revenue"] == 6500.0
    assert summary["total_products"] == 1
    assert summary["total_stock_units"] == 2  # 3 initial - 1 sold
    assert summary["low_stock_count"] == 1

    # Check top selling products
    assert len(dash_data["top_selling_products"]) == 1
    top = dash_data["top_selling_products"][0]
    assert top["product_code"] == "BRM-BP-001"
    assert top["units_sold"] == 1
    assert top["total_revenue"] == 6500.0

    # Check recent invoices
    assert len(dash_data["recent_invoices"]) == 1
    assert dash_data["recent_invoices"][0]["total_amount"] == 6500.0

    # Check low stock alerts
    assert len(dash_data["low_stock_alerts"]) == 1
    alert = dash_data["low_stock_alerts"][0]
    assert alert["code"] == "BRM-BP-001"
    assert alert["quantity"] == 2

