import datetime
import logging
from sqlalchemy import text
import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import _build_engine, _build_session_factory
from app.models.customer import Customer  # noqa: F401
from app.models.employee import Employee, EmployeeSalary  # noqa: F401
from app.models.expense import Expense  # noqa: F401
from app.models.invoice import Invoice, InvoiceItem  # noqa: F401
from app.models.product import Brand, Category, Product, ProductActivity, StockMovement
from app.models.report import Purchase, PurchaseItem, Sale, SaleItem, SupplierPayment

logger = logging.getLogger(__name__)


def check_database_connection() -> bool:
    try:
        engine = _build_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning(f"Database connection check warning: {e}")
        return False


def init_database() -> None:
    """Creates database tables and populates initial categories, brands, and catalog items if empty."""
    engine = _build_engine()
    Base.metadata.create_all(bind=engine)

    session_factory = _build_session_factory()
    with session_factory() as db:
        # 1. Seed Categories if empty
        if not db.query(Category).first():
            initial_categories = [
                Category(name="Braking System", description="Brake pads, discs, shoes, calipers, and master cylinders"),
                Category(name="Oils & Lubricants", description="Engine oil, fork oil, chain lube, brake fluid, coolants"),
                Category(name="Engine Parts", description="Pistons, rings, valves, gaskets, spark plugs, cam chains"),
                Category(name="Electrical & Lighting", description="Headlamps, indicators, wiring harnesses, batteries, CDI, rectifiers"),
                Category(name="Transmission & Clutch", description="Drive chains, sprockets, clutch plates, CVT drive belts"),
                Category(name="Suspension & Steering", description="Front forks, rear shock absorbers, cone sets, fork oil seals"),
                Category(name="Tyres & Wheels", description="Tubeless tyres, tube tyres, alloy wheels, spokes, wheel bearings"),
                Category(name="Intake & Fuel System", description="Carburetors, fuel injectors, air filters, fuel pumps, throttle cables"),
                Category(name="Body & Frame", description="Fairings, mudguards, mirrors, footpegs, crash guards, handlebar grips"),
                Category(name="Exhaust System", description="Exhaust pipes, mufflers, exhaust gaskets, heat shields"),
            ]
            db.add_all(initial_categories)
            db.commit()
            logger.info("Database initialized: Default categories seeded.")

        # 2. Seed Brands if empty
        if not db.query(Brand).first():
            initial_brands = [
                Brand(name="Brembo", origin_country="Italy", description="High-performance braking systems"),
                Brand(name="Motul", origin_country="France", description="Premium motor lubricants & fluids"),
                Brand(name="NGK", origin_country="Japan", description="World leading spark plugs & ignition technology"),
                Brand(name="DID", origin_country="Japan", description="Motorcycle drive chains & sprocket sets"),
                Brand(name="Honda Genuine", origin_country="Japan", description="OEM Honda factory replacement parts"),
                Brand(name="Yamaha Genuine", origin_country="Japan", description="OEM Yamaha factory parts & accessories"),
                Brand(name="Pirelli", origin_country="Italy", description="Performance motorcycle tyres"),
                Brand(name="K&N", origin_country="USA", description="High-flow washable air & oil filters"),
                Brand(name="Rolon", origin_country="India", description="Heavy duty chain and sprocket kits"),
                Brand(name="TorqueLine", origin_country="Sri Lanka", description="In-house tested motorcycle components"),
            ]
            db.add_all(initial_brands)
            db.commit()
            logger.info("Database initialized: Default brands seeded.")

        # 3. Seed Products if empty
        if not db.query(Product).first():
            sample_products = [
                Product(
                    name="Brembo Sintered Front Brake Pads",
                    code="BRM-BP-001",
                    barcode="200109283741",
                    barcode_type="CODE128",
                    category="Braking System",
                    subcategory="Brake Pads",
                    brand="Brembo",
                    product_type="standard",
                    status="active",
                    description="High performance sintered road and track front brake pads with superior thermal stability.",
                    cost_price=1850.0,
                    selling_price=2650.0,
                    wholesale_price=2300.0,
                    min_selling_price=2100.0,
                    quantity=18,
                    opening_stock=25,
                    unit="Pairs",
                    min_stock_level=5,
                    reorder_level=10,
                    max_stock_level=50,
                    warehouse_location="Central Store Colombo",
                    rack_number="R-04",
                    shelf_number="S-02",
                    stock_tracking_enabled=True,
                    supplier_name="Brembo Auto & Moto Dist",
                    supplier_code="SUP-BRM-88",
                    supplier_price=1850.0,
                    preferred_supplier=True,
                    estimated_delivery_days=3,
                    compatible_models="Yamaha R15, Yamaha MT-15, KTM Duke 200, KTM Duke 390, Honda CBR 250R",
                    compatible_years="2016-2024",
                    warranty_period="6 Months",
                    specifications="Sintered friction compound, anti-vibration backing plate",
                    is_featured=True,
                ),
                Product(
                    name="Motul 7100 4T 10W-40 100% Synthetic 1L",
                    code="MOT-OIL-7100",
                    barcode="3374650247656",
                    barcode_type="CODE128",
                    category="Oils & Lubricants",
                    subcategory="Engine Oil",
                    brand="Motul",
                    product_type="standard",
                    status="active",
                    description="100% synthetic 4-Stroke motorcycle engine lubricant with Ester technology. Meets JASO MA2.",
                    cost_price=3800.0,
                    selling_price=4950.0,
                    wholesale_price=4400.0,
                    min_selling_price=4200.0,
                    quantity=4,
                    opening_stock=40,
                    unit="Bottles",
                    min_stock_level=8,
                    reorder_level=15,
                    max_stock_level=80,
                    warehouse_location="Central Store Colombo",
                    rack_number="Lube Bay",
                    shelf_number="L-01",
                    stock_tracking_enabled=True,
                    supplier_name="Motul Lubricants Ceylon",
                    supplier_code="SUP-MOT-01",
                    supplier_price=3800.0,
                    preferred_supplier=True,
                    estimated_delivery_days=2,
                    compatible_models="Universal for all 4-stroke motorcycles requiring 10W-40 JASO MA2",
                    specifications="API SN, JASO MA2, 100% Synthetic Ester",
                    is_featured=True,
                ),
                Product(
                    name="NGK Laser Iridium Spark Plug CR9EIX",
                    code="NGK-SP-CR9E",
                    barcode="087295164488",
                    barcode_type="CODE128",
                    category="Electrical & Lighting",
                    subcategory="Spark Plugs",
                    brand="NGK",
                    product_type="standard",
                    status="active",
                    description="Laser-welded iridium center electrode tip ensures high durability and a consistently stable spark.",
                    cost_price=1600.0,
                    selling_price=2400.0,
                    wholesale_price=2050.0,
                    min_selling_price=1900.0,
                    quantity=32,
                    opening_stock=50,
                    unit="Pieces",
                    min_stock_level=10,
                    reorder_level=20,
                    max_stock_level=100,
                    warehouse_location="Central Store Colombo",
                    rack_number="R-01",
                    shelf_number="S-05",
                    stock_tracking_enabled=True,
                    supplier_name="NGK Spark Plug Co. Lanka",
                    supplier_code="SUP-NGK-23",
                    supplier_price=1600.0,
                    preferred_supplier=True,
                    estimated_delivery_days=4,
                    compatible_models="Kawasaki Ninja 300, Yamaha R15 V3, Suzuki Gixxer SF, KTM RC 200",
                    specifications="Thread Size: 10mm, Reach: 19mm, Hex Size: 16mm",
                    is_featured=False,
                ),
                Product(
                    name="DID 520VX3 Gold X-Ring Drive Chain 120L",
                    code="DID-CH-520VX",
                    barcode="4525516317252",
                    barcode_type="CODE128",
                    category="Transmission & Clutch",
                    subcategory="Drive Chains",
                    brand="DID",
                    product_type="standard",
                    status="active",
                    description="High performance heavy duty sealed drive chain with patented X-Ring technology for extended service life.",
                    cost_price=14500.0,
                    selling_price=19800.0,
                    wholesale_price=17500.0,
                    min_selling_price=16800.0,
                    quantity=0,
                    opening_stock=12,
                    unit="Pieces",
                    min_stock_level=3,
                    reorder_level=6,
                    max_stock_level=20,
                    warehouse_location="Central Store Colombo",
                    rack_number="R-05",
                    shelf_number="S-01",
                    stock_tracking_enabled=True,
                    supplier_name="DID Moto Chains Asia",
                    supplier_code="SUP-DID-44",
                    supplier_price=14500.0,
                    preferred_supplier=true,
                    estimated_delivery_days=7,
                    compatible_models="KTM Duke 250/390, Kawasaki Ninja 400, Yamaha MT-03, Honda CB500X",
                    specifications="Pitch: 520, Links: 120, Pin Length: 18.7mm",
                    is_featured=true,
                ),
                Product(
                    name="Honda Dio / Activa CVT Drive Belt",
                    code="HON-BLT-DIO",
                    barcode="200184920194",
                    barcode_type="CODE128",
                    category="Transmission & Clutch",
                    subcategory="Drive Belts",
                    brand="Honda Genuine",
                    product_type="standard",
                    status="active",
                    description="OEM Genuine Honda high-torque transmission CVT drive belt for 110cc and 125cc automatic scooters.",
                    cost_price=2200.0,
                    selling_price=3100.0,
                    wholesale_price=2750.0,
                    min_selling_price=2500.0,
                    quantity=14,
                    opening_stock=25,
                    unit="Pieces",
                    min_stock_level=5,
                    reorder_level=12,
                    max_stock_level=40,
                    warehouse_location="Central Store Colombo",
                    rack_number="R-03",
                    shelf_number="S-02",
                    stock_tracking_enabled=True,
                    supplier_name="Stafford Motor Spares",
                    supplier_code="SUP-HON-55",
                    supplier_price=2200.0,
                    preferred_supplier=True,
                    estimated_delivery_days=2,
                    compatible_models="Honda Dio 110, Honda Activa 110, Honda Grazia 125, Honda Navi",
                    specifications="Kevlar reinforced aramid cord composite",
                    is_featured=True,
                ),
            ]
            db.add_all(sample_products)
            db.commit()

            # Record initial stock movements & activity logs for each product
            for p in sample_products:
                if p.quantity > 0:
                    movement = StockMovement(
                        product_id=p.id,
                        movement_type="opening_stock",
                        previous_quantity=0,
                        adjustment_quantity=p.quantity,
                        new_quantity=p.quantity,
                        reason="Initial Opening Stock setup",
                        user_name="Admin",
                    )
                    db.add(movement)
                activity = ProductActivity(
                    product_id=p.id,
                    action="CREATED",
                    details=f"Product registered in database with SKU {p.code}",
                    user_name="Admin",
                )
                db.add(activity)

            db.commit()
            logger.info("Database initialized: Sample motorcycle spare parts registered.")

        # 4. Seed Sales if empty
        if not db.query(Sale).first():
            now = datetime.datetime.now(datetime.timezone.utc)
            sample_sales = [
                Sale(
                    invoice_number="INV-2026-1042",
                    sale_date=now - datetime.timedelta(hours=2),
                    subtotal=5300.0,
                    discount_amount=0.0,
                    tax_amount=0.0,
                    total_amount=5300.0,
                    payment_method="Cash",
                    cashier_name="Admin",
                    customer_name="Kamal Perera (WP-CAD-8812)",
                    items=[
                        SaleItem(
                            product_name="Brembo Sintered Front Brake Pads",
                            product_code="BRM-BP-001",
                            quantity=2,
                            unit_price=2650.0,
                            cost_price=1850.0,
                            subtotal=5300.0,
                        )
                    ],
                ),
                Sale(
                    invoice_number="INV-2026-1039",
                    sale_date=now - datetime.timedelta(days=1, hours=3),
                    subtotal=4950.0,
                    discount_amount=0.0,
                    tax_amount=0.0,
                    total_amount=4950.0,
                    payment_method="Card",
                    cashier_name="Admin",
                    customer_name="Sunil Jayawardena",
                    items=[
                        SaleItem(
                            product_name="Motul 7100 4T 10W-40 100% Synthetic 1L",
                            product_code="MOT-OIL-7100",
                            quantity=1,
                            unit_price=4950.0,
                            cost_price=3800.0,
                            subtotal=4950.0,
                        )
                    ],
                ),
                Sale(
                    invoice_number="INV-2026-1025",
                    sale_date=now - datetime.timedelta(days=3, hours=5),
                    subtotal=9600.0,
                    discount_amount=400.0,
                    tax_amount=0.0,
                    total_amount=9200.0,
                    payment_method="Card",
                    cashier_name="Cashier #2",
                    customer_name="Nihal Motors Workshop",
                    items=[
                        SaleItem(
                            product_name="NGK Laser Iridium Spark Plug CR9EIX",
                            product_code="NGK-SP-CR9E",
                            quantity=4,
                            unit_price=2400.0,
                            cost_price=1600.0,
                            subtotal=9600.0,
                        )
                    ],
                ),
                Sale(
                    invoice_number="INV-2026-0988",
                    sale_date=now - datetime.timedelta(days=12),
                    subtotal=19800.0,
                    discount_amount=0.0,
                    tax_amount=0.0,
                    total_amount=19800.0,
                    payment_method="Bank Transfer",
                    cashier_name="Admin",
                    customer_name="Rider Club Colombo",
                    items=[
                        SaleItem(
                            product_name="DID 520VX3 Gold X-Ring Drive Chain 120L",
                            product_code="DID-CH-520VX",
                            quantity=1,
                            unit_price=19800.0,
                            cost_price=14500.0,
                            subtotal=19800.0,
                        )
                    ],
                ),
                Sale(
                    invoice_number="INV-2026-0912",
                    sale_date=now - datetime.timedelta(days=25),
                    subtotal=3100.0,
                    discount_amount=0.0,
                    tax_amount=0.0,
                    total_amount=3100.0,
                    payment_method="Cash",
                    cashier_name="Cashier #1",
                    customer_name="Dinesh Fernando",
                    items=[
                        SaleItem(
                            product_name="Honda Dio / Activa CVT Drive Belt",
                            product_code="HON-BLT-DIO",
                            quantity=1,
                            unit_price=3100.0,
                            cost_price=2200.0,
                            subtotal=3100.0,
                        )
                    ],
                ),
            ]
            db.add_all(sample_sales)
            db.commit()
            logger.info("Database initialized: Sample sales transactions seeded.")

        # 5. Seed Purchases if empty
        if not db.query(Purchase).first():
            now = datetime.datetime.now(datetime.timezone.utc)
            sample_purchases = [
                Purchase(
                    purchase_number="PO-2026-081",
                    supplier_name="Brembo Auto & Moto Dist",
                    purchase_date=now - datetime.timedelta(days=35),
                    total_amount=46250.0,
                    paid_amount=46250.0,
                    outstanding_amount=0.0,
                    payment_status="Paid",
                    items=[
                        PurchaseItem(
                            product_name="Brembo Sintered Front Brake Pads",
                            product_code="BRM-BP-001",
                            quantity=25,
                            unit_cost=1850.0,
                            subtotal=46250.0,
                        )
                    ],
                    payments=[
                        SupplierPayment(
                            supplier_name="Brembo Auto & Moto Dist",
                            payment_date=now - datetime.timedelta(days=30),
                            amount=46250.0,
                            payment_method="Bank Transfer",
                            reference_number="TXN-BRM-8891",
                        )
                    ],
                ),
                Purchase(
                    purchase_number="PO-2026-085",
                    supplier_name="Motul Lubricants Ceylon",
                    purchase_date=now - datetime.timedelta(days=20),
                    total_amount=152000.0,
                    paid_amount=120000.0,
                    outstanding_amount=32000.0,
                    payment_status="Partial",
                    items=[
                        PurchaseItem(
                            product_name="Motul 7100 4T 10W-40 100% Synthetic 1L",
                            product_code="MOT-OIL-7100",
                            quantity=40,
                            unit_cost=3800.0,
                            subtotal=152000.0,
                        )
                    ],
                    payments=[
                        SupplierPayment(
                            supplier_name="Motul Lubricants Ceylon",
                            payment_date=now - datetime.timedelta(days=15),
                            amount=120000.0,
                            payment_method="Bank Transfer",
                            reference_number="TXN-MOT-7712",
                        )
                    ],
                ),
                Purchase(
                    purchase_number="PO-2026-088",
                    supplier_name="DID Moto Chains Asia",
                    purchase_date=now - datetime.timedelta(days=15),
                    total_amount=174000.0,
                    paid_amount=174000.0,
                    outstanding_amount=0.0,
                    payment_status="Paid",
                    items=[
                        PurchaseItem(
                            product_name="DID 520VX3 Gold X-Ring Drive Chain 120L",
                            product_code="DID-CH-520VX",
                            quantity=12,
                            unit_cost=14500.0,
                            subtotal=174000.0,
                        )
                    ],
                    payments=[
                        SupplierPayment(
                            supplier_name="DID Moto Chains Asia",
                            payment_date=now - datetime.timedelta(days=14),
                            amount=174000.0,
                            payment_method="Bank Transfer",
                            reference_number="TXN-DID-9012",
                        )
                    ],
                ),
                Purchase(
                    purchase_number="PO-2026-092",
                    supplier_name="Stafford Motor Spares",
                    purchase_date=now - datetime.timedelta(days=8),
                    total_amount=55000.0,
                    paid_amount=40000.0,
                    outstanding_amount=15000.0,
                    payment_status="Partial",
                    items=[
                        PurchaseItem(
                            product_name="Honda Dio / Activa CVT Drive Belt",
                            product_code="HON-BLT-DIO",
                            quantity=25,
                            unit_cost=2200.0,
                            subtotal=55000.0,
                        )
                    ],
                    payments=[
                        SupplierPayment(
                            supplier_name="Stafford Motor Spares",
                            payment_date=now - datetime.timedelta(days=5),
                            amount=40000.0,
                            payment_method="Cheque",
                            reference_number="CHQ-778812",
                        )
                    ],
                ),
            ]
            db.add_all(sample_purchases)
            db.commit()
            logger.info("Database initialized: Sample purchases and supplier payments seeded.")
