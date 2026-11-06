from typing import Any

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import (
    BrandCreate,
    BrandResponse,
    BulkActionRequest,
    CategoryCreate,
    CategoryResponse,
    ProductActivityResponse,
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductStatisticsResponse,
    ProductUpdate,
    StockAdjustmentCreate,
    StockMovementResponse,
)
from app.services.product import ProductService

router = APIRouter()


@router.get("", response_model=ProductListResponse)
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    category: str | None = Query(None),
    brand: str | None = Query(None),
    status: str | None = Query(None),
    stock_status: str | None = Query(None),
    supplier: str | None = Query(None),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),  # noqa: B008
) -> ProductListResponse:
    service = ProductService(db)
    return service.list_products(
        skip=skip,
        limit=limit,
        search=search,
        category=category,
        brand=brand,
        status_filter=status,
        stock_status=stock_status,
        supplier=supplier,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/statistics", response_model=ProductStatisticsResponse)
def get_product_statistics(
    db: Session = Depends(get_db),  # noqa: B008
) -> ProductStatisticsResponse:
    service = ProductService(db)
    return service.get_statistics()


@router.get("/barcode/{barcode}", response_model=ProductResponse)
def get_product_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),  # noqa: B008
) -> ProductResponse:
    service = ProductService(db)
    return service.get_by_barcode(barcode)


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),  # noqa: B008
) -> list[CategoryResponse]:
    service = ProductService(db)
    return service.list_categories()


@router.post("/categories", response_model=CategoryResponse, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> CategoryResponse:
    service = ProductService(db)
    return service.create_category(data)


@router.get("/brands", response_model=list[BrandResponse])
def list_brands(
    db: Session = Depends(get_db),  # noqa: B008
) -> list[BrandResponse]:
    service = ProductService(db)
    return service.list_brands()


@router.post("/brands", response_model=BrandResponse, status_code=201)
def create_brand(
    data: BrandCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> BrandResponse:
    service = ProductService(db)
    return service.create_brand(data)


@router.get("/export/csv")
def export_products_csv(
    db: Session = Depends(get_db),  # noqa: B008
) -> Response:
    service = ProductService(db)
    csv_data = service.export_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=torqueline_products.csv"},
    )


@router.post("/bulk-action")
def bulk_action(
    request: BulkActionRequest,
    db: Session = Depends(get_db),  # noqa: B008
) -> dict[str, Any]:
    service = ProductService(db)
    return service.bulk_action(request)


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


@router.post("/{product_id}/adjust-stock", response_model=StockMovementResponse)
def adjust_stock(
    product_id: int,
    data: StockAdjustmentCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> StockMovementResponse:
    service = ProductService(db)
    return service.adjust_stock(product_id, data)


@router.get("/{product_id}/stock-history", response_model=list[StockMovementResponse])
def get_stock_history(
    product_id: int,
    db: Session = Depends(get_db),  # noqa: B008
) -> list[StockMovementResponse]:
    service = ProductService(db)
    return service.get_stock_history(product_id)


@router.get("/{product_id}/activity-history", response_model=list[ProductActivityResponse])
def get_activity_history(
    product_id: int,
    db: Session = Depends(get_db),  # noqa: B008
) -> list[ProductActivityResponse]:
    service = ProductService(db)
    return service.get_activity_history(product_id)
