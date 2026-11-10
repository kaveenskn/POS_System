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


def test_create_and_get_product(client: TestClient):
    payload = {
        "name": "Brembo Front Brake Pads",
        "code": "BP-BR-001",
        "brand": "Brembo",
        "cost_price": 1200.50,
        "selling_price": 1850.00,
        "description": "High performance sintered brake pads",
        "quantity": 15,
    }
    response = client.post("/api/v1/products", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["code"] == payload["code"]
    assert data["brand"] == payload["brand"]
    assert data["cost_price"] == payload["cost_price"]
    assert data["selling_price"] == payload["selling_price"]
    assert data["description"] == payload["description"]
    assert data["quantity"] == payload["quantity"]
    assert "id" in data
    assert data.get("barcode") is not None
    assert len(data["barcode"]) >= 12

    prod_id = data["id"]
    get_res = client.get(f"/api/v1/products/{prod_id}")
    assert get_res.status_code == 200
    assert get_res.json()["code"] == "BP-BR-001"


def test_create_product_duplicate_code_conflict(client: TestClient):
    payload = {
        "name": "Engine Oil 10W-40",
        "code": "OIL-10W40",
        "brand": "Motul",
        "cost_price": 500,
        "selling_price": 750,
    }
    res1 = client.post("/api/v1/products", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/products", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


def test_list_products_and_search(client: TestClient):
    client.post(
        "/api/v1/products",
        json={
            "name": "Spark Plug CR9E",
            "code": "SP-CR9E",
            "brand": "NGK",
            "cost_price": 150,
            "selling_price": 280,
            "quantity": 50,
        },
    )
    client.post(
        "/api/v1/products",
        json={
            "name": "Chain Sprocket Kit",
            "code": "CS-KTM-390",
            "brand": "Rolon",
            "cost_price": 2100,
            "selling_price": 3100,
            "quantity": 10,
        },
    )

    list_res = client.get("/api/v1/products")
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 2

    search_res = client.get("/api/v1/products?search=NGK")
    assert search_res.status_code == 200
    assert search_res.json()["total"] == 1
    assert search_res.json()["items"][0]["brand"] == "NGK"


def test_get_product_by_barcode_scan(client: TestClient):
    create_res = client.post(
        "/api/v1/products",
        json={
            "name": "Brembo Dot 4 Brake Fluid",
            "code": "BRM-BF-500",
            "brand": "Brembo",
            "cost_price": 1200.0,
            "selling_price": 1850.0,
            "barcode": "2008492019485",
            "quantity": 25,
        },
    )
    assert create_res.status_code == 201
    bc = create_res.json()["barcode"]

    # Scan by barcode
    scan_res = client.get(f"/api/v1/products/barcode/{bc}")
    assert scan_res.status_code == 200
    assert scan_res.json()["code"] == "BRM-BF-500"
    assert scan_res.json()["name"] == "Brembo Dot 4 Brake Fluid"
