import datetime

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


def test_expense_crud_and_summary(client: TestClient):
    today_str = datetime.date.today().isoformat()

    # 1. Create expenses
    resp1 = client.post(
        "/api/v1/expenses",
        json={
            "title": "Shop Electricity Bill",
            "category": "electricity",
            "amount": 7500.0,
            "expense_date": today_str,
            "payment_method": "bank_transfer",
            "description": "August electricity bill for workshop",
        },
    )
    assert resp1.status_code == 201
    exp_id = resp1.json()["id"]

    resp2 = client.post(
        "/api/v1/expenses",
        json={
            "title": "Shop Rent",
            "category": "rent",
            "amount": 45000.0,
            "expense_date": today_str,
            "payment_method": "bank_transfer",
        },
    )
    assert resp2.status_code == 201

    # 2. List expenses
    list_resp = client.get("/api/v1/expenses")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 2

    # Filter by category
    filter_resp = client.get("/api/v1/expenses", params={"category": "electricity"})
    assert filter_resp.status_code == 200
    assert filter_resp.json()["total"] == 1
    assert filter_resp.json()["items"][0]["title"] == "Shop Electricity Bill"

    # 3. Update expense
    update_resp = client.patch(
        f"/api/v1/expenses/{exp_id}",
        json={"amount": 8000.0, "title": "Shop Electricity Bill - Revised"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["amount"] == 8000.0

    # 4. Summary check
    summary_resp = client.get("/api/v1/expenses/summary")
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["total_operating"] == 53000.0  # 8000 + 45000
    assert summary["total_all"] == 53000.0

    # 5. Delete expense
    del_resp = client.delete(f"/api/v1/expenses/{exp_id}")
    assert del_resp.status_code == 204

    list_after = client.get("/api/v1/expenses")
    assert list_after.json()["total"] == 1

