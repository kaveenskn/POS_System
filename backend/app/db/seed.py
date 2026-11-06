import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.employee import Employee, EmployeeSalary
from app.models.employee_enums import SalaryStatus
from app.models.expense import Expense, ExpenseCategory, ExpensePaymentMethod
from app.models.product import Brand, Category, Product


def seed_database_if_empty(session: Session) -> None:
    # 1. Seed Categories & Brands
    categories_count = session.scalar(select(Category.id).limit(1))
    if not categories_count:
        sample_categories = [
            Category(
                name="Braking System",
                subcategories="Brake Pads, Brake Shoes, Discs, Calipers",
            ),
            Category(
                name="Oils & Lubricants",
                subcategories="Engine Oil, Gear Oil, Fork Oil, Chain Lube",
            ),
            Category(
                name="Electrical & Ignition",
                subcategories="Spark Plugs, Batteries, Regulators",
            ),
            Category(
                name="Drivetrain & Transmission",
                subcategories="Chains & Sprockets, Clutch Plates",
            ),
            Category(
                name="Tyres & Wheels",
                subcategories="Tyres, Tubes, Wheel Bearings",
            ),
            Category(
                name="Scooter & Transmission",
                subcategories="CVT Belts, Variator Rollers",
            ),
        ]
        session.add_all(sample_categories)

        sample_brands = [
            Brand(name="Brembo", origin_country="Italy"),
            Brand(name="Motul", origin_country="France"),
            Brand(name="NGK", origin_country="Japan"),
            Brand(name="DID", origin_country="Japan"),
            Brand(name="Honda Genuine", origin_country="Japan"),
            Brand(name="Yamaha Genuine", origin_country="Japan"),
            Brand(name="Pirelli", origin_country="Italy"),
        ]
        session.add_all(sample_brands)
        session.commit()

    # 2. Seed Products
    products_count = session.scalar(select(Product.id).limit(1))
    if not products_count:
        sample_products = [
            Product(
                name="Brembo Sintered Front Brake Pads",
                code="BRM-BP-001",
                barcode="8020584501234",
                category="Braking System",
                brand="Brembo",
                cost_price=4200.0,
                selling_price=6500.0,
                quantity=28,
                unit="Sets",
                min_stock_level=5,
                reorder_level=10,
                status="active",
                warehouse_location="Central Store Colombo",
            ),
            Product(
                name="Motul 7100 4T 10W-40 100% Synthetic 1L",
                code="MOT-OIL-7100",
                barcode="3374650239102",
                category="Oils & Lubricants",
                brand="Motul",
                cost_price=3800.0,
                selling_price=4950.0,
                quantity=45,
                unit="Bottles",
                min_stock_level=10,
                reorder_level=20,
                status="active",
                warehouse_location="Central Store Colombo",
            ),
            Product(
                name="NGK Laser Iridium Spark Plug CR9EIA-9",
                code="NGK-SP-CR9EIA",
                barcode="087295162897",
                category="Electrical & Ignition",
                brand="NGK",
                cost_price=2100.0,
                selling_price=3200.0,
                quantity=60,
                unit="Pieces",
                min_stock_level=12,
                reorder_level=25,
                status="active",
                warehouse_location="Central Store Colombo",
            ),
            Product(
                name="DID 520 Pro-Street X-Ring Chain 120L",
                code="DID-CH-520VX3",
                barcode="4525516377256",
                category="Drivetrain & Transmission",
                brand="DID",
                cost_price=14500.0,
                selling_price=18900.0,
                quantity=12,
                unit="Sets",
                min_stock_level=3,
                reorder_level=6,
                status="active",
                warehouse_location="Central Store Colombo",
            ),
            Product(
                name="Honda Genuine Bando CVT Drive Belt",
                code="HON-CVT-BELT-01",
                barcode="200492817263",
                category="Scooter & Transmission",
                brand="Honda Genuine",
                cost_price=2200.0,
                selling_price=3150.0,
                quantity=2,
                unit="Pieces",
                min_stock_level=6,
                reorder_level=12,
                status="active",
                warehouse_location="Central Store Colombo",
            ),
            Product(
                name="Pirelli Diablo Rosso III Rear Tyre 140/70-17",
                code="PIR-TYR-14070",
                barcode="8019227263565",
                category="Tyres & Wheels",
                brand="Pirelli",
                cost_price=24500.0,
                selling_price=31000.0,
                quantity=9,
                unit="Pieces",
                min_stock_level=4,
                reorder_level=8,
                status="active",
                warehouse_location="Central Store Colombo",
            ),
        ]
        session.add_all(sample_products)
        session.commit()

    # 3. Seed Employees & Salaries
    employees_count = session.scalar(select(Employee.id).limit(1))
    if not employees_count:
        emp1 = Employee(
            name="Kasun Perera",
            phone="077 123 4567",
            role="Chief Motorcycle Mechanic",
            monthly_salary=65000.0,
            is_active=True,
        )
        emp2 = Employee(
            name="Nuwan Pradeep",
            phone="071 987 6543",
            role="Sales Assistant & Billing Cashier",
            monthly_salary=50000.0,
            is_active=True,
        )
        emp3 = Employee(
            name="Chaminda Silva",
            phone="075 334 4556",
            role="Spare Parts Store Keeper",
            monthly_salary=55000.0,
            is_active=True,
        )
        emp4 = Employee(
            name="Dinesh Kumara",
            phone="078 998 8776",
            role="Junior Technician",
            monthly_salary=42000.0,
            is_active=True,
        )
        session.add_all([emp1, emp2, emp3, emp4])
        session.commit()

        # Add payroll records
        sal1 = EmployeeSalary(
            employee_id=emp1.id,
            month=10,
            year=2026,
            base_salary=65000.0,
            advance_amount=0.0,
            net_paid=65000.0,
            payment_date=datetime.date(2026, 11, 2),
            status=SalaryStatus.paid,
            notes="Regular monthly salary credited via bank transfer",
        )
        sal2 = EmployeeSalary(
            employee_id=emp2.id,
            month=10,
            year=2026,
            base_salary=50000.0,
            advance_amount=2000.0,
            net_paid=48000.0,
            payment_date=datetime.date(2026, 11, 2),
            status=SalaryStatus.paid,
            notes="Salary payment after Rs. 2,000 advance deduction",
        )
        sal3 = EmployeeSalary(
            employee_id=emp3.id,
            month=10,
            year=2026,
            base_salary=55000.0,
            advance_amount=5000.0,
            net_paid=50000.0,
            payment_date=None,
            status=SalaryStatus.pending,
            notes="Advance of Rs. 5,000 issued mid-month",
        )
        session.add_all([sal1, sal2, sal3])
        session.commit()

    # 4. Seed Expenses
    expenses_count = session.scalar(select(Expense.id).limit(1))
    if not expenses_count:
        sample_expenses = [
            Expense(
                title="Shop Monthly Rent - Central Store Colombo",
                category=ExpenseCategory.rent,
                amount=85000.0,
                expense_date=datetime.date(2026, 11, 1),
                payment_method=ExpensePaymentMethod.bank_transfer,
                description="Monthly commercial shop space rent for Colombo outlet",
            ),
            Expense(
                title="CEB Workshop Electricity Bill - Oct 2026",
                category=ExpenseCategory.electricity,
                amount=18450.0,
                expense_date=datetime.date(2026, 11, 3),
                payment_method=ExpensePaymentMethod.bank_transfer,
                description="Power consumption for compressor, tools, and showroom lighting",
            ),
            Expense(
                title="Staff Salary - Kasun Perera (Lead Mechanic)",
                category=ExpenseCategory.salary,
                amount=65000.0,
                expense_date=datetime.date(2026, 11, 2),
                payment_method=ExpensePaymentMethod.bank_transfer,
                description="Salary payment for month of October 2026",
            ),
            Expense(
                title="Staff Salary - Nuwan Pradeep (Sales Assistant)",
                category=ExpenseCategory.salary,
                amount=48000.0,
                expense_date=datetime.date(2026, 11, 2),
                payment_method=ExpensePaymentMethod.bank_transfer,
                description="Salary payment after advance deduction",
            ),
            Expense(
                title="Motorcycle Spare Parts Transport & Freight",
                category=ExpenseCategory.transportation,
                amount=12500.0,
                expense_date=datetime.date(2026, 11, 4),
                payment_method=ExpensePaymentMethod.cash,
                description="Brembo and Motul stock transport from clearing yard",
            ),
            Expense(
                title="Dialog Business 100Mbps Fibre Broadband",
                category=ExpenseCategory.internet,
                amount=6850.0,
                expense_date=datetime.date(2026, 11, 4),
                payment_method=ExpensePaymentMethod.card,
                description="Monthly POS terminal, CCTV, and inventory internet",
            ),
            Expense(
                title="Hydraulic Bike Lift Maintenance & Service",
                category=ExpenseCategory.maintenance,
                amount=9500.0,
                expense_date=datetime.date(2026, 11, 5),
                payment_method=ExpensePaymentMethod.cash,
                description="Oil replacement and seal overhaul for servicing ramp",
            ),
            Expense(
                title="National Water Supply Utility Bill",
                category=ExpenseCategory.water,
                amount=3200.0,
                expense_date=datetime.date(2026, 11, 5),
                payment_method=ExpensePaymentMethod.cash,
                description="Workshop water utility bill for bike wash and sanitation",
            ),
        ]
        session.add_all(sample_expenses)
        session.commit()

    # 5. Seed Invoices
    from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus, PaymentMethod

    invoices_count = session.scalar(select(Invoice.id).limit(1))
    if not invoices_count:
        now = datetime.datetime.now(datetime.timezone.utc)
        inv1 = Invoice(
            invoice_number="INV-20261106-0001",
            customer_id=None,
            subtotal=11450.0,
            discount_amount=450.0,
            total_amount=11000.0,
            payment_method=PaymentMethod.cash,
            amount_paid=11000.0,
            change_amount=0.0,
            status=InvoiceStatus.completed,
            notes="Counter walk-in customer sale - Brembo pads + Motul 7100",
            created_at=now,
        )
        session.add(inv1)
        session.flush()

        item1 = InvoiceItem(
            invoice_id=inv1.id,
            product_id=1,
            product_name="Brembo Sintered Front Brake Pads",
            product_code="BRM-BP-001",
            unit_price=6500.0,
            cost_price=4200.0,
            quantity=1,
            line_total=6500.0,
        )
        item2 = InvoiceItem(
            invoice_id=inv1.id,
            product_id=2,
            product_name="Motul 7100 4T 10W-40 100% Synthetic 1L",
            product_code="MOT-OIL-7100",
            unit_price=4950.0,
            cost_price=3800.0,
            quantity=1,
            line_total=4950.0,
        )
        session.add_all([item1, item2])

        inv2 = Invoice(
            invoice_number="INV-20261106-0002",
            customer_id=None,
            subtotal=34200.0,
            discount_amount=1200.0,
            total_amount=33000.0,
            payment_method=PaymentMethod.card,
            amount_paid=33000.0,
            change_amount=0.0,
            status=InvoiceStatus.completed,
            notes="Diablo Rosso tyre + NGK Iridium spark plug",
            created_at=now,
        )
        session.add(inv2)
        session.flush()

        item3 = InvoiceItem(
            invoice_id=inv2.id,
            product_id=6,
            product_name="Pirelli Diablo Rosso III Rear Tyre 140/70-17",
            product_code="PIR-TYR-14070",
            unit_price=31000.0,
            cost_price=24500.0,
            quantity=1,
            line_total=31000.0,
        )
        item4 = InvoiceItem(
            invoice_id=inv2.id,
            product_id=3,
            product_name="NGK Laser Iridium Spark Plug CR9EIA-9",
            product_code="NGK-SP-CR9EIA",
            unit_price=3200.0,
            cost_price=2100.0,
            quantity=1,
            line_total=3200.0,
        )
        session.add_all([item3, item4])
        session.commit()

