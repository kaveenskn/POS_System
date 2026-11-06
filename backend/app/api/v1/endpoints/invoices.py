import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.invoice import InvoiceCreate, InvoiceListResponse, InvoiceResponse
from app.services.invoice import InvoiceService

router = APIRouter()


@router.post("", response_model=InvoiceResponse, status_code=201)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> InvoiceResponse:
    service = InvoiceService(db)
    return service.create_invoice(data)


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    skip: int = Query(0, ge=0),  # noqa: B008
    limit: int = Query(50, ge=1, le=100),  # noqa: B008
    search: str | None = Query(None, max_length=200),  # noqa: B008
    date_from: datetime.date | None = Query(None),  # noqa: B008
    date_to: datetime.date | None = Query(None),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> InvoiceListResponse:
    service = InvoiceService(db)
    return service.list_invoices(
        skip=skip, limit=limit, search=search, date_from=date_from, date_to=date_to
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),  # noqa: B008
) -> InvoiceResponse:
    service = InvoiceService(db)
    return service.get_invoice(invoice_id)
