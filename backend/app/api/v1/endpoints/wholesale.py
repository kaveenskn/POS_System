import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.invoice import InvoiceListResponse, InvoiceResponse
from app.schemas.wholesale import (
    WholesaleClientCreate,
    WholesaleClientListResponse,
    WholesaleClientResponse,
    WholesaleClientUpdate,
    WholesaleOrderCreate,
    WholesaleStatsResponse,
)
from app.services.wholesale import WholesaleService

router = APIRouter()


@router.get("/stats", response_model=WholesaleStatsResponse)
def get_wholesale_stats(
    db: Session = Depends(get_db),
) -> WholesaleStatsResponse:
    """Retrieve high-level B2B wholesale performance metrics."""
    service = WholesaleService(db)
    return service.get_stats()


@router.get("/clients", response_model=WholesaleClientListResponse)
def list_wholesale_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, description="Search by name, company, phone, or address"),
    db: Session = Depends(get_db),
) -> WholesaleClientListResponse:
    """Retrieve paginated wholesale client directory with order volume metrics."""
    service = WholesaleService(db)
    return service.get_clients(search=search, skip=skip, limit=limit)


@router.post("/clients", response_model=WholesaleClientResponse, status_code=status.HTTP_201_CREATED)
def create_wholesale_client(
    data: WholesaleClientCreate,
    db: Session = Depends(get_db),
) -> WholesaleClientResponse:
    """Register a new wholesale workshop, dealer, or bulk buyer account."""
    service = WholesaleService(db)
    return service.create_client(data)


@router.get("/clients/{client_id}", response_model=WholesaleClientResponse)
def get_wholesale_client(
    client_id: int,
    db: Session = Depends(get_db),
) -> WholesaleClientResponse:
    """Retrieve a specific wholesale client profile."""
    service = WholesaleService(db)
    return service.get_client(client_id)


@router.put("/clients/{client_id}", response_model=WholesaleClientResponse)
def update_wholesale_client(
    client_id: int,
    data: WholesaleClientUpdate,
    db: Session = Depends(get_db),
) -> WholesaleClientResponse:
    """Update wholesale client details."""
    service = WholesaleService(db)
    return service.update_client(client_id, data)


@router.get("/orders", response_model=InvoiceListResponse)
def list_wholesale_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, description="Search by order/invoice # or notes"),
    date_from: datetime.date | None = Query(None),
    date_to: datetime.date | None = Query(None),
    db: Session = Depends(get_db),
) -> InvoiceListResponse:
    """Retrieve all wholesale / B2B sales and invoices with customer associations."""
    service = WholesaleService(db)
    return service.get_orders(
        search=search,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )


@router.post("/orders", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_wholesale_order(
    data: WholesaleOrderCreate,
    db: Session = Depends(get_db),
) -> InvoiceResponse:
    """
    Issue a wholesale order:
    - Atomically validates stock
    - Deducts quantities from inventory
    - Logs immutable WHOLESALE stock movement
    - Records official wholesale invoice and items
    """
    service = WholesaleService(db)
    return service.create_order(data)

