import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    barcode: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True, index=True)
    barcode_type: Mapped[str] = mapped_column(String(20), nullable=False, default="CODE128")
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="Motorcycle Spare Parts", index=True)
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)
    brand: Mapped[str] = mapped_column(String(255), nullable=False, default="TorqueLine", index=True)
    product_type: Mapped[str] = mapped_column(String(50), nullable=False, default="standard")  # standard, variants, service
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active", index=True)  # active, inactive, archived
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Pricing
    cost_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    selling_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    wholesale_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    min_selling_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    default_discount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    tax_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Inventory
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    opening_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="Pieces")
    min_stock_level: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    reorder_level: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    max_stock_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    warehouse_location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    rack_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    shelf_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    stock_tracking_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Supplier Info
    supplier_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    supplier_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    supplier_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    preferred_supplier: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    estimated_delivery_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Motorcycle Fitment & Specifications
    compatible_models: Mapped[str | None] = mapped_column(Text, nullable=True)  # e.g. "Honda Dio, Yamaha R15, KTM Duke 390"
    compatible_years: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g. "2018-2024"
    warranty_period: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dimensions: Mapped[str | None] = mapped_column(String(100), nullable=True)
    weight: Mapped[str | None] = mapped_column(String(50), nullable=True)
    specifications: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    variations_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON-encoded array of variations

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    stock_movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")
    activity_logs = relationship("ProductActivity", back_populates="product", cascade="all, delete-orphan")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    movement_type: Mapped[str] = mapped_column(String(50), nullable=False)  # opening_stock, increase, decrease, damaged, lost, sale, correction
    previous_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    adjustment_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    new_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Admin")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    product = relationship("Product", back_populates="stock_movements")


class ProductActivity(Base):
    __tablename__ = "product_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # CREATED, UPDATED, PRICE_CHANGED, BARCODE_CHANGED, STOCK_ADJUSTED, ARCHIVED
    details: Mapped[str] = mapped_column(Text, nullable=False)
    user_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Admin")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    product = relationship("Product", back_populates="activity_logs")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    subcategories: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON or comma-separated
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    origin_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
