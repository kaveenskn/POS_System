from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.product import ProductRepository
from app.schemas.product import ProductCreate, ProductListResponse, ProductResponse, ProductUpdate


class ProductService:
    def __init__(self, db: Session) -> None:
        self.repo = ProductRepository(db)

    def list_products(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> ProductListResponse:
        products, total = self.repo.get_all(skip=skip, limit=limit, search=search)
        return ProductListResponse(
            items=[ProductResponse.model_validate(p) for p in products],
            total=total,
        )

    def get_product(self, product_id: int) -> ProductResponse:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return ProductResponse.model_validate(product)

    def create_product(self, data: ProductCreate) -> ProductResponse:
        existing = self.repo.get_by_code(data.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with code '{data.code}' already exists",
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
                    detail=f"Product with code '{data.code}' already exists",
                )
        updated = self.repo.update(product, data)
        return ProductResponse.model_validate(updated)

    def delete_product(self, product_id: int) -> None:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        self.repo.delete(product)

