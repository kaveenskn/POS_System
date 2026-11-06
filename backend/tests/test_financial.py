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


def test_financial_summary_profit_and_loss(client: TestClient):
    today_str = datetime.date.today().isoformat()

    # 1. Product setup: Cost = 600, Selling = 1000
    prod_resp = client.post(
        "/api/v1/products",
        json={
            "name": "Engine Oil 1L",
            "code": "OIL-1L",
            "brand": "Motul",
            "cost_price": 600.0,
            "selling_price": 1000.0,
            "quantity": 50,
        },
    )
    prod_id = prod_resp.json()["id"]

    # 2. Sale of 10 units -> Revenue = 10,000, COGS = 6,000, Gross Profit = 4,000
    client.post(
        "/api/v1/invoices",
        json={
            "items": [
                {
                    "product_id": prod_id,
                    "quantity": 10,
                    "unit_price": 1000.0,
                    "cost_price": 600.0,
                }
            ],
            "discount_amount": 0,
            "payment_method": "cash",
            "amount_paid": 10000.0,
        },
    )

    # 3. Add operating expense: Electricity = 1,000
    client.post(
        "/api/v1/expenses",
        json={
            "title": "Shop Electricity",
            "category": "electricity",
            "amount": 1000.0,
            "expense_date": today_str,
            "payment_method": "cash",
        },
    )

    # 4. Add employee and pay salary: Net salary = 1,500
    emp_resp = client.post(
        "/api/v1/employees",
        json={
            "name": "Kamal",
            "role": "Helper",
            "monthly_salary": 2000.0,
        },
    )
    emp_id = emp_resp.json()["id"]
    sal_resp = client.post(
        f"/api/v1/employees/{emp_id}/salaries",
        json={
            "month": 10,
            "year": 2026,
            "base_salary": 2000.0,
            "advance_amount": 500.0,
        },
    )
    sal_id = sal_resp.json()["id"]
    client.patch(
        f"/api/v1/employees/salaries/{sal_id}",
        json={"status": "paid", "payment_date": today_str},
    )

    # 5. Check financial summary
    # Expected:
    # Total Revenue = 10,000
    # Total COGS = 6,000
    # Gross Profit = 4,000
    # Operating Expenses = 1,000
    # Salary Expenses = 1,500
    # Total Expenses = 2,500
    # Net Profit = 4,000 - 2,500 = 1,500
    res = client.get("/api/v1/reports/summary")
    assert res.status_code == 200
    summary = res.json()

    assert summary["total_revenue"] == 10000.0
    assert summary["total_cogs"] == 6000.0
    assert summary["gross_profit"] == 4000.0
    assert summary["total_operating_expenses"] == 1000.0
    assert summary["total_salary_expenses"] == 1500.0
    assert summary["total_expenses"] == 2500.0
    assert summary["net_profit"] == 1500.0
    assert summary["today_sales"] == 10000.0
    assert summary["invoice_count_today"] == 1

