from decimal import Decimal

from app.routers.catalog import price_from_margin
from app.security import hash_password, verify_password


def test_margin_calculation_uses_gross_margin():
    assert price_from_margin(Decimal(70), Decimal(30)) == Decimal("100.00")


def test_password_hash_is_not_plain_text():
    encoded = hash_password("UmaSenhaMuitoForte123!")
    assert encoded != "UmaSenhaMuitoForte123!"
    assert verify_password("UmaSenhaMuitoForte123!", encoded)
    assert not verify_password("senha-errada", encoded)
