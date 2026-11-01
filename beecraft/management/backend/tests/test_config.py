import pytest

from app.config import Settings


@pytest.mark.parametrize(
    "entrada",
    [
        "postgresql://u:p@host:5432/db",
        "postgres://u:p@host:5432/db",
        "postgresql+psycopg://u:p@host:5432/db",
    ],
)
def test_database_url_usa_sempre_o_driver_psycopg(entrada):
    assert Settings(database_url=entrada).database_url == "postgresql+psycopg://u:p@host:5432/db"
