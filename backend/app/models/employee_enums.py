import enum


class SalaryStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
