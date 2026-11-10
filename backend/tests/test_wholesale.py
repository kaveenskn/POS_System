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


def test_wholesale_clients_and_order_flow(client: TestClient):
    # 1. Create a wholesale client
    client_res = client.post(
        "/api/v1/wholesale/clients",
        json={
            "name": "Sunil Jayawardena",
            "company_name": "Sunil Motors Workshop",
            "phone": "0771234567",
            "email": "sunil@motors.lk",
            "address": "Kadawatha",
        },
    )
    assert client_res.status_code == 201
    client_data = client_res.json()
    assert client_data["name"] == "Sunil Jayawardena"
    assert client_data["company_name"] == "Sunil Motors Workshop"
    client_id = client_data["id"]

    # 2. Create a catalog product with stock = 50 and wholesale_price = 2200
    prod_res = client.post(
        "/api/v1/products",
        json={
            "name": "Motul 7100 4T 10W-40 1L",
            "code": "OIL-MOT-7100",
            "category": "Oils & Lubricants",
            "brand": "Motul",
            "cost_price": 1800.0,
            "selling_price": 2800.0,
            "wholesale_price": 2200.0,
            "quantity": 50,
        },
    )
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # 3. Create a wholesale order for 20 units with custom wholesale price 2150.0
    order_res = client.post(
        "/api/v1/wholesale/orders",
        json={
            "customer_id": client_id,
            "items": [
                {
                    "product_id": prod_id,
                    "quantity": 20,
                    "unit_price": 2150.0,
                }
            ],
            "discount_amount": 1000.0,
            "payment_method": "bank_transfer",
            "amount_paid": 42000.0,
            "notes": "Bulk supply 20 bottles to Sunil Motors",
        },
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    assert order_data["customer_id"] == client_id
    assert order_data["customer_name"] == "Sunil Jayawardena"
    assert order_data["total_amount"] == (20 * 2150.0) - 1000.0  # 42,000.0
    assert order_data["invoice_number"].startswith("WHL-")

    # 4. Verify product stock is decremented from 50 to 30
    get_prod = client.get(f"/api/v1/products/{prod_id}")
    assert get_prod.status_code == 200
    assert get_prod.json()["quantity"] == 30

    # 5. Verify wholesale orders list
    orders_list = client.get("/api/v1/wholesale/orders")
    assert orders_list.status_code == 200
    assert orders_list.json()["total"] == 1
    assert orders_list.json()["items"][0]["invoice_number"] == order_data["invoice_number"]

    # 6. Verify wholesale stats
    stats_res = client.get("/api/v1/wholesale/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["client_count"] >= 1
    assert stats["total_orders"] == 1
    assert stats["total_revenue"] == 42000.0

