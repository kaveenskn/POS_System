import pytest
from app.db.base import Base
from app.db.session import get_db
from app.main import app
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
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_create_invoice_and_deduct_stock(client: TestClient):
    # 1. Create a product with stock = 10
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "NGK Spark Plug",
            "code": "SP-NGK-01",
            "brand": "NGK",
            "cost_price": 500.0,
            "selling_price": 850.0,
            "quantity": 10,
        },
    )
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # 2. Create invoice for 3 units
    inv_payload = {
        "items": [
            {
                "product_id": prod_id,
                "quantity": 3,
                "unit_price": 850.0,
                "cost_price": 500.0,
            }
        ],
        "discount_amount": 50.0,
        "payment_method": "cash",
        "amount_paid": 3000.0,
        "notes": "Walk-in customer sale",
    }
    inv_resp = client.post("/api/v1/invoices", json=inv_payload)
    assert inv_resp.status_code == 201
    inv_data = inv_resp.json()

    assert inv_data["subtotal"] == 2550.0
    assert inv_data["discount_amount"] == 50.0
    assert inv_data["total_amount"] == 2500.0
    assert inv_data["amount_paid"] == 3000.0
    assert inv_data["change_amount"] == 500.0
    assert inv_data["invoice_number"].startswith("INV-")

    # 3. Verify product stock was reduced from 10 to 7
    get_prod = client.get(f"/api/v1/products/{prod_id}")
    assert get_prod.status_code == 200
    assert get_prod.json()["quantity"] == 7


def test_create_invoice_insufficient_stock_rejected(client: TestClient):
    # Create product with stock = 2
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "Motul Chain Lube",
            "code": "CL-MOTUL-01",
            "brand": "Motul",
            "cost_price": 1000.0,
            "selling_price": 1600.0,
            "quantity": 2,
        },
    )
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # Try selling 5 units
    inv_payload = {
        "items": [
            {
                "product_id": prod_id,
                "quantity": 5,
                "unit_price": 1600.0,
                "cost_price": 1000.0,
            }
        ],
        "discount_amount": 0,
        "payment_method": "card",
        "amount_paid": 8000.0,
    }
    inv_resp = client.post("/api/v1/invoices", json=inv_payload)
    assert inv_resp.status_code == 422
    assert "insufficient stock" in inv_resp.json()["detail"].lower()

