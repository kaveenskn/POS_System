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


def test_employee_salary_flow_and_auto_expense(client: TestClient):
    # 1. Create employee
    emp_resp = client.post(
        "/api/v1/employees",
        json={
            "name": "Sunil Shantha",
            "phone": "0712345678",
            "role": "Chief Mechanic",
            "monthly_salary": 75000.0,
        },
    )
    assert emp_resp.status_code == 201
    emp_id = emp_resp.json()["id"]

    # 2. Record monthly salary with advance
    sal_resp = client.post(
        f"/api/v1/employees/{emp_id}/salaries",
        json={
            "month": 10,
            "year": 2026,
            "base_salary": 75000.0,
            "advance_amount": 10000.0,
            "notes": "Festival advance deducted",
        },
    )
    assert sal_resp.status_code == 201
    sal_data = sal_resp.json()
    assert sal_data["base_salary"] == 75000.0
    assert sal_data["advance_amount"] == 10000.0
    assert sal_data["net_paid"] == 65000.0
    assert sal_data["status"] == "pending"
    sal_id = sal_data["id"]

    # At this point, expenses should NOT contain this salary yet (it's pending)
    exp_before = client.get("/api/v1/expenses")
    assert exp_before.json()["total"] == 0

    # 3. Mark salary as paid
    today_str = datetime.date.today().isoformat()
    pay_resp = client.patch(
        f"/api/v1/employees/salaries/{sal_id}",
        json={"status": "paid", "payment_date": today_str},
    )
    assert pay_resp.status_code == 200
    assert pay_resp.json()["status"] == "paid"

    # 4. Verify that an expense record was automatically created with category='salary'
    exp_after = client.get("/api/v1/expenses")
    assert exp_after.status_code == 200
    expenses = exp_after.json()["items"]
    assert len(expenses) == 1
    assert expenses[0]["category"] == "salary"
    assert expenses[0]["amount"] == 65000.0
    assert "Sunil Shantha" in expenses[0]["title"]

