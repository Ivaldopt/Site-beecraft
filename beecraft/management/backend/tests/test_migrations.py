"""Garante que as migrações correm do zero numa base PostgreSQL nova.

Só corre quando TEST_DATABASE_URL aponta para uma base vazia de teste, por exemplo:
    TEST_DATABASE_URL=postgresql://user@localhost:5432/gestao_teste pytest
"""
import os

import pytest
from alembic import command
from alembic.config import Config

URL = os.environ.get("TEST_DATABASE_URL")


@pytest.mark.skipif(not URL, reason="defina TEST_DATABASE_URL para testar as migrações")
def test_migracoes_correm_numa_base_nova(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", URL)
    from app.config import get_settings

    get_settings.cache_clear()
    config = Config("alembic.ini")
    command.upgrade(config, "head")
    command.upgrade(config, "head")  # repetir não pode falhar
    get_settings.cache_clear()
