from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, product_id: int) -> Product | None:
        return self.db.get(Product, product_id)

    def get_by_code(self, code: str) -> Product | None:
        stmt = select(Product).where(Product.code == code)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> tuple[list[Product], int]:
        stmt = select(Product)
        count_stmt = select(func.count()).select_from(Product)

        if search:
            pattern = f"%{search}%"
            search_filter = (
                Product.name.ilike(pattern)
                | Product.code.ilike(pattern)
                | Product.brand.ilike(pattern)
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        total: int = self.db.execute(count_stmt).scalar_one()
        products = list(
            self.db.execute(stmt.order_by(Product.created_at.desc()).offset(skip).limit(limit))
            .scalars()
            .all()
        )
        return products, total

    def create(self, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product, data: ProductUpdate) -> Product:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.commit()

