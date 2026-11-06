import csv
import io
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.product import ProductRepository
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


class ProductService:
    def __init__(self, db: Session) -> None:
        self.repo = ProductRepository(db)

    def list_products(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
        category: str | None = None,
        brand: str | None = None,
        status_filter: str | None = None,
        stock_status: str | None = None,
        supplier: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> ProductListResponse:
        products, total = self.repo.get_all(
            skip=skip,
            limit=limit,
            search=search,
            category=category,
            brand=brand,
            status=status_filter,
            stock_status=stock_status,
            supplier=supplier,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return ProductListResponse(
            items=[ProductResponse.model_validate(p) for p in products],
            total=total,
        )

    def get_product(self, product_id: int) -> ProductResponse:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return ProductResponse.model_validate(product)

    def get_by_barcode(self, barcode: str) -> ProductResponse:
        product = self.repo.get_by_barcode(barcode)
        if not product:
            # Also check if barcode matches code
            product = self.repo.get_by_code(barcode)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found for scanned barcode")
        return ProductResponse.model_validate(product)

    def create_product(self, data: ProductCreate) -> ProductResponse:
        existing = self.repo.get_by_code(data.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{data.code}' already exists",
            )
        if data.barcode:
            existing_bc = self.repo.get_by_barcode(data.barcode)
            if existing_bc:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product with barcode '{data.barcode}' already exists",
                )
        product = self.repo.create(data)
        return ProductResponse.model_validate(product)

    def update_product(self, product_id: int, data: ProductUpdate) -> ProductResponse:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if data.code is not None:
            existing = self.repo.get_by_code(data.code)
            if existing and existing.id != product_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product with SKU '{data.code}' already exists",
                )
        if data.barcode is not None and data.barcode != "":
            existing_bc = self.repo.get_by_barcode(data.barcode)
            if existing_bc and existing_bc.id != product_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product with barcode '{data.barcode}' already exists",
                )
        updated = self.repo.update(product, data)
        return ProductResponse.model_validate(updated)

    def delete_product(self, product_id: int) -> None:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        # Check stock movements
        movements = self.repo.get_stock_movements(product_id)
        if len(movements) > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product has inventory movements and cannot be deleted. Please archive the product instead to preserve historical records.",
            )
        self.repo.delete(product)

    def adjust_stock(self, product_id: int, data: StockAdjustmentCreate) -> StockMovementResponse:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        movement = self.repo.adjust_stock(product, data)
        return StockMovementResponse.model_validate(movement)

    def get_stock_history(self, product_id: int) -> list[StockMovementResponse]:
        movements = self.repo.get_stock_movements(product_id)
        return [StockMovementResponse.model_validate(m) for m in movements]

    def get_activity_history(self, product_id: int) -> list[ProductActivityResponse]:
        activities = self.repo.get_activity_logs(product_id)
        return [ProductActivityResponse.model_validate(a) for a in activities]

    def get_statistics(self) -> ProductStatisticsResponse:
        return self.repo.get_statistics()

    def bulk_action(self, request: BulkActionRequest) -> dict[str, Any]:
        count = self.repo.bulk_action(request.product_ids, request.action, request.parameters)
        return {"action": request.action, "affected_count": count}

    # Categories & Brands
    def list_categories(self) -> list[CategoryResponse]:
        cats = self.repo.list_categories()
        return [CategoryResponse.model_validate(c) for c in cats]

    def create_category(self, data: CategoryCreate) -> CategoryResponse:
        cat = self.repo.create_category(data)
        return CategoryResponse.model_validate(cat)

    def list_brands(self) -> list[BrandResponse]:
        brands = self.repo.list_brands()
        return [BrandResponse.model_validate(b) for b in brands]

    def create_brand(self, data: BrandCreate) -> BrandResponse:
        b = self.repo.create_brand(data)
        return BrandResponse.model_validate(b)

    def export_csv(self) -> str:
        products, _ = self.repo.get_all(skip=0, limit=10000)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID", "Name", "SKU", "Barcode", "Category", "Subcategory", "Brand",
            "Cost Price", "Selling Price", "Quantity", "Unit", "Status", "Compatible Models"
        ])
        for p in products:
            writer.writerow([
                p.id, p.name, p.code, p.barcode or "", p.category, p.subcategory or "",
                p.brand, float(p.cost_price), float(p.selling_price), p.quantity,
                p.unit, p.status, p.compatible_models or ""
            ])
        return output.getvalue()
