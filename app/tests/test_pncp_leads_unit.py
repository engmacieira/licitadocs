from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import status
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.core.rate_limit import limiter
from app.dependencies import get_current_active_user
from app.main import app
from app.models.pncp_lead_model import PncpLead
from app.models.user_model import UserRole
from app.repositories.pncp_lead_repository import PncpLeadRepository
from app.schemas.pncp_lead_schemas import (
    PncpLeadStats,
    PncpLeadSyncResponse,
    PncpLeadUpsert,
)
from app.services.pncp_service import PncpService


def _valid_cnpj_1() -> str:
    return "11222333000181"


def _make_lead(
    lead_id: str = "lead-1",
    cnpj: str = "11222333000181",
    razao_social: str = "Empresa Teste LTDA",
    uf: str = "SP",
    last_contacted_at=None,
    contact_count: int = 0,
    last_contact_channel=None,
    last_contact_notes=None,
    spam_cooldown_days: int = 7,
) -> PncpLead:
    now = datetime.now(timezone.utc)
    return PncpLead(
        id=lead_id,
        cnpj=cnpj,
        razao_social=razao_social,
        nome_fantasia="Teste",
        email="contato@teste.com.br",
        telefone="11999999999",
        uf=uf,
        municipio="São Paulo",
        porte="ME",
        origem_pncp="PNCP-1",
        last_contacted_at=last_contacted_at,
        contact_count=contact_count,
        last_contact_channel=last_contact_channel,
        last_contact_notes=last_contact_notes,
        spam_cooldown_days=spam_cooldown_days,
        created_at=now,
        updated_at=now,
    )


def _get_unit_client(mock_db, current_user=None):
    limiter.enabled = False
    app.dependency_overrides[get_db] = lambda: mock_db
    if current_user is not None:
        app.dependency_overrides[get_current_active_user] = lambda: current_user
    return TestClient(app)


def test_unit_upsert_from_pncp_preserves_contact_history():
    mock_db = MagicMock()
    contacted_at = datetime.now(timezone.utc) - timedelta(days=2)
    existing = _make_lead(
        last_contacted_at=contacted_at,
        contact_count=4,
        last_contact_channel="whatsapp",
        last_contact_notes="Proposta enviada",
        spam_cooldown_days=14,
    )

    with patch.object(PncpLeadRepository, "get_by_cnpj", return_value=existing):
        lead, created = PncpLeadRepository.upsert_from_pncp(
            mock_db,
            PncpLeadUpsert(
                cnpj=_valid_cnpj_1(),
                razao_social="Empresa Teste Atualizada S.A.",
                uf="RJ",
                origem_pncp="PNCP-99",
            ),
        )

    assert created is False
    assert lead.razao_social == "Empresa Teste Atualizada S.A."
    assert lead.uf == "RJ"
    assert lead.last_contacted_at == contacted_at
    assert lead.contact_count == 4
    assert lead.last_contact_channel == "whatsapp"
    assert lead.last_contact_notes == "Proposta enviada"
    assert lead.spam_cooldown_days == 14
    mock_db.commit.assert_called_once()


def test_unit_list_leads_admin_route_and_rbac():
    mock_db = MagicMock()
    try:
        # 401 sem token
        client_no_auth = _get_unit_client(mock_db, current_user=None)
        resp_401 = client_no_auth.get("/admin/leads")
        assert resp_401.status_code == status.HTTP_401_UNAUTHORIZED

        # 403 para CLIENT
        client_user = SimpleNamespace(id="u-client", role=UserRole.CLIENT.value, is_active=True)
        client_forbidden = _get_unit_client(mock_db, current_user=client_user)
        resp_403 = client_forbidden.get("/admin/leads")
        assert resp_403.status_code == status.HTTP_403_FORBIDDEN

        # 200 para ADMIN
        admin_user = SimpleNamespace(id="u-admin", role=UserRole.ADMIN.value, is_active=True)
        client_admin = _get_unit_client(mock_db, current_user=admin_user)
        lead = _make_lead()
        stats = PncpLeadStats(total=1, ready_for_contact=1, in_cooldown=0)

        with patch.object(
            PncpLeadRepository,
            "list_filtered",
            return_value=([lead], 1, stats),
        ) as mock_list:
            resp_200 = client_admin.get(
                "/admin/leads?search=Teste&uf=SP&contact_status=ready&cooldown_days=7&skip=0&limit=50"
            )

        assert resp_200.status_code == status.HTTP_200_OK
        body = resp_200.json()
        assert body["total"] == 1
        assert body["stats"]["ready_for_contact"] == 1
        assert body["items"][0]["id"] == "lead-1"
        assert body["items"][0]["is_in_cooldown"] is False
        mock_list.assert_called_once_with(
            db=mock_db,
            search="Teste",
            uf="SP",
            contact_status="ready",
            default_cooldown_days=7,
            skip=0,
            limit=50,
        )
    finally:
        app.dependency_overrides.clear()


def test_unit_register_contact_and_cooldown_warning():
    mock_db = MagicMock()
    admin_user = SimpleNamespace(id="u-admin", role=UserRole.ADMIN.value, is_active=True)
    try:
        client = _get_unit_client(mock_db, current_user=admin_user)
        updated_lead = _make_lead(
            last_contacted_at=datetime.now(timezone.utc),
            contact_count=2,
            last_contact_channel="email",
            last_contact_notes="Segundo contato",
        )

        with patch.object(
            PncpLeadRepository,
            "register_contact",
            return_value=(updated_lead, True),
        ):
            resp = client.post(
                "/admin/leads/lead-1/contact",
                json={"channel": "email", "notes": "Segundo contato"},
            )

        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["was_in_cooldown"] is True
        assert "anti-SPAM" in data["warning_message"]
        assert data["lead"]["contact_count"] == 2
        assert data["lead"]["is_in_cooldown"] is True

        with patch.object(PncpLeadRepository, "register_contact", return_value=(None, False)):
            resp_404 = client.post(
                "/admin/leads/unknown/contact",
                json={"channel": "whatsapp"},
            )
        assert resp_404.status_code == status.HTTP_404_NOT_FOUND

        with patch.object(PncpLeadRepository, "get_by_id", return_value=None):
            resp_get_404 = client.get("/admin/leads/unknown")
        assert resp_get_404.status_code == status.HTTP_404_NOT_FOUND

        with patch.object(PncpLeadRepository, "get_by_id", return_value=updated_lead):
            resp_get_200 = client.get("/admin/leads/lead-1")
        assert resp_get_200.status_code == status.HTTP_200_OK
        assert resp_get_200.json()["id"] == "lead-1"
    finally:
        app.dependency_overrides.clear()


def test_unit_sync_pncp_leads_with_mocked_service():
    mock_db = MagicMock()
    admin_user = SimpleNamespace(id="u-admin", role=UserRole.ADMIN.value, is_active=True)
    try:
        client = _get_unit_client(mock_db, current_user=admin_user)
        summary = PncpLeadSyncResponse(fetched=4, created=2, updated=1, skipped=1, errors=[])

        with patch.object(
            PncpService,
            "sync_leads",
            new_callable=AsyncMock,
            return_value=summary,
        ) as mock_sync:
            resp = client.post(
                "/admin/leads/sync",
                json={"uf": "sp", "dias_retroativos": 3, "max_paginas": 1},
            )

        assert resp.status_code == status.HTTP_200_OK
        assert resp.json() == {
            "fetched": 4,
            "created": 2,
            "updated": 1,
            "skipped": 1,
            "errors": [],
        }
        mock_sync.assert_awaited_once()
    finally:
        app.dependency_overrides.clear()
