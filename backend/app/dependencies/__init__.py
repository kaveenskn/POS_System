from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.product import ProductService


def get_product_service(db: Session) -> ProductService:
    return ProductService(db)


__all__ = ["get_db", "get_product_service"]

