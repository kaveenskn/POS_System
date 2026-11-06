from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.report import ReportRepository
from app.schemas.report import (
    CurrentStockReportResponse,
    LowStockReportResponse,
    OutOfStockReportResponse,
    PurchaseByProductResponse,
    PurchaseBySupplierResponse,
    PurchaseHistoryResponse,
    SalesReportResponse,
    SupplierPaymentResponse,
    ReportOverviewResponse,
)

router = APIRouter()


def _parse_date_range(
    period: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)

    if start_date and end_date:
        try:
            s = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            e = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            return s, e
        except Exception:
            pass

    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == "yesterday":
        yesterday = now - timedelta(days=1)
        start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == "weekly" or period == "this_week":
        start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "monthly" or period == "this_month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "yearly" or period == "this_year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    else:  # default daily
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    return start, end


# =============================================================================
# 0. DASHBOARD OVERVIEW METRICS
# =============================================================================
@router.get("/overview", response_model=ReportOverviewResponse)
def get_report_overview(
    period: str = Query("this_month", description="daily, weekly, monthly, yearly, custom, today, yesterday"),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
) -> ReportOverviewResponse:
    s_date, e_date = _parse_date_range(period, start_date, end_date)
    repo = ReportRepository(db)
    return repo.get_overview(s_date, e_date)


# =============================================================================
# 1. SALES REPORTS
# =============================================================================
@router.get("/sales", response_model=SalesReportResponse)
def get_sales_report(
    period: str = Query("daily", description="daily, weekly, monthly, yearly, custom, today, yesterday"),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
) -> SalesReportResponse:
    s_date, e_date = _parse_date_range(period, start_date, end_date)
    repo = ReportRepository(db)
    return repo.get_sales_report(s_date, e_date, period=period)


# =============================================================================
# 2. INVENTORY REPORTS
# =============================================================================
@router.get("/inventory/current-stock", response_model=CurrentStockReportResponse)
def get_current_stock_report(
    category: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
) -> CurrentStockReportResponse:
    repo = ReportRepository(db)
    return repo.get_current_stock_report(category=category, search=search)


@router.get("/inventory/low-stock", response_model=LowStockReportResponse)
def get_low_stock_report(
    category: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
) -> LowStockReportResponse:
    repo = ReportRepository(db)
    return repo.get_low_stock_report(category=category, search=search)


@router.get("/inventory/out-of-stock", response_model=OutOfStockReportResponse)
def get_out_of_stock_report(
    category: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
) -> OutOfStockReportResponse:
    repo = ReportRepository(db)
    return repo.get_out_of_stock_report(category=category, search=search)


# =============================================================================
# 3. PURCHASE REPORTS
# =============================================================================
@router.get("/purchases/by-supplier", response_model=PurchaseBySupplierResponse)
def get_purchases_by_supplier(
    period: str = Query("this_year"),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
) -> PurchaseBySupplierResponse:
    s_date, e_date = _parse_date_range(period, start_date, end_date)
    repo = ReportRepository(db)
    return repo.get_purchases_by_supplier(s_date, e_date)


@router.get("/purchases/by-product", response_model=PurchaseByProductResponse)
def get_purchases_by_product(
    period: str = Query("this_year"),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
) -> PurchaseByProductResponse:
    s_date, e_date = _parse_date_range(period, start_date, end_date)
    repo = ReportRepository(db)
    return repo.get_purchases_by_product(s_date, e_date)


@router.get("/purchases/history", response_model=PurchaseHistoryResponse)
def get_purchase_history(
    period: str = Query("this_year"),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
) -> PurchaseHistoryResponse:
    s_date, e_date = _parse_date_range(period, start_date, end_date)
    repo = ReportRepository(db)
    return repo.get_purchase_history(s_date, e_date)


@router.get("/purchases/supplier-payments", response_model=SupplierPaymentResponse)
def get_supplier_payment_report(
    db: Session = Depends(get_db),
) -> SupplierPaymentResponse:
    repo = ReportRepository(db)
    return repo.get_supplier_payment_report()

