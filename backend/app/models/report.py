import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    invoice_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    sale_date: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False, default="Cash")
    cashier_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Admin")
    customer_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sale_id: Mapped[int] = mapped_column(Integer, ForeignKey("sales.id"), nullable=False, index=True)
    product_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_code: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    cost_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    sale = relationship("Sale", back_populates="items")


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    purchase_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    supplier_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    purchase_date: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    paid_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    outstanding_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    payment_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Paid")  # Paid, Partial, Pending
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")
    payments = relationship("SupplierPayment", back_populates="purchase", cascade="all, delete-orphan")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    purchase_id: Mapped[int] = mapped_column(Integer, ForeignKey("purchases.id"), nullable=False, index=True)
    product_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_code: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    purchase = relationship("Purchase", back_populates="items")


class SupplierPayment(Base):
    __tablename__ = "supplier_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    supplier_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    purchase_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("purchases.id"), nullable=True, index=True)
    payment_date: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False, default="Bank Transfer")
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    purchase = relationship("Purchase", back_populates="payments")

