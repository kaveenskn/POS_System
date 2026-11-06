from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import ProductCreate, ProductListResponse, ProductResponse, ProductUpdate
from app.services.product import ProductService

router = APIRouter()


@router.get("", response_model=ProductListResponse)
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    db: Session = Depends(get_db),  # noqa: B008
) -> ProductListResponse:
    service = ProductService(db)
    return service.list_products(skip=skip, limit=limit, search=search)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),  # noqa: B008
) -> ProductResponse:
    service = ProductService(db)
    return service.get_product(product_id)


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> ProductResponse:
    service = ProductService(db)
    return service.create_product(data)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),  # noqa: B008
) -> ProductResponse:
    service = ProductService(db)
    return service.update_product(product_id, data)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),  # noqa: B008
) -> None:
    service = ProductService(db)
    service.delete_product(product_id)
