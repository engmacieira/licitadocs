import os
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from fastapi import status

from app.core.security import create_access_token
from app.models.pncp_lead_model import PncpLead
from app.models.user_model import User, UserRole
from app.repositories.pncp_lead_repository import PncpLeadRepository
from app.schemas.pncp_lead_schemas import PncpLeadSyncResponse, PncpLeadUpsert
from app.tests.conftest import generate_valid_cnpj


def _create_admin_headers(db_session):
    admin_email = f"admin_pncp_{os.urandom(4).hex()}@example.com"
    admin = User(
        email=admin_email,
        password_hash="hash",
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    token = create_access_token(data={"sub": admin_email, "role": UserRole.ADMIN.value})
    return {"Authorization": f"Bearer {token}"}


def test_upsert_from_pncp_preserves_contact_history(db_session):
    """Upsert deve atualizar dados cadastrais sem perder histórico e controle anti-SPAM."""
    cnpj = generate_valid_cnpj()
    lead, created = PncpLeadRepository.upsert_from_pncp(
        db_session,
        PncpLeadUpsert(
            cnpj=cnpj,
            razao_social="Fornecedor Alfa LTDA",
            nome_fantasia="Alfa",
            email="contato@alfa.com.br",
            uf="SP",
            municipio="São Paulo",
            origem_pncp="PNCP-001",
        ),
    )
    assert created is True
    assert lead.contact_count == 0

    contacted_at = datetime.now(timezone.utc) - timedelta(days=2)
    lead.last_contacted_at = contacted_at
    lead.contact_count = 3
    lead.last_contact_channel = "whatsapp"
    lead.last_contact_notes = "Aguardando retorno do diretor"
    lead.spam_cooldown_days = 10
    db_session.add(lead)
    db_session.commit()
    db_session.refresh(lead)

    updated_lead, created_again = PncpLeadRepository.upsert_from_pncp(
        db_session,
        PncpLeadUpsert(
            cnpj=cnpj,
            razao_social="Fornecedor Alfa S.A.",
            nome_fantasia="Alfa Licitações",
            email="novo@alfa.com.br",
            uf="RJ",
            municipio="Rio de Janeiro",
            origem_pncp="PNCP-002",
        ),
    )
    assert created_again is False
    assert updated_lead.id == lead.id
    assert updated_lead.razao_social == "Fornecedor Alfa S.A."
    assert updated_lead.uf == "RJ"
    assert updated_lead.last_contacted_at == contacted_at
    assert updated_lead.contact_count == 3
    assert updated_lead.last_contact_channel == "whatsapp"
    assert updated_lead.last_contact_notes == "Aguardando retorno do diretor"
    assert updated_lead.spam_cooldown_days == 10


def test_list_leads_filters_and_anti_spam_stats(client, db_session):
    """Valida filtros anti-SPAM (ready, cooldown, never_contacted), busca textual e UF."""
    headers = _create_admin_headers(db_session)
    now_utc = datetime.now(timezone.utc)

    never_lead = PncpLead(
        cnpj=generate_valid_cnpj(),
        razao_social="Beta Engenharia LTDA",
        nome_fantasia="Beta",
        email="beta@example.com",
        uf="SP",
        last_contacted_at=None,
        contact_count=0,
        spam_cooldown_days=7,
    )
    cooldown_lead = PncpLead(
        cnpj=generate_valid_cnpj(),
        razao_social="Gama Serviços LTDA",
        nome_fantasia="Gama",
        email="gama@example.com",
        uf="SP",
        last_contacted_at=now_utc - timedelta(days=1),
        contact_count=1,
        last_contact_channel="email",
        spam_cooldown_days=7,
    )
    expired_cooldown_lead = PncpLead(
        cnpj=generate_valid_cnpj(),
        razao_social="Delta Tecnologia LTDA",
        nome_fantasia="Delta",
        email="delta@example.com",
        uf="MG",
        last_contacted_at=now_utc - timedelta(days=15),
        contact_count=2,
        last_contact_channel="telefone",
        spam_cooldown_days=7,
    )
    db_session.add_all([never_lead, cooldown_lead, expired_cooldown_lead])
    db_session.commit()

    resp_ready = client.get("/admin/leads?contact_status=ready", headers=headers)
    assert resp_ready.status_code == status.HTTP_200_OK
    ready_ids = {item["id"] for item in resp_ready.json()["items"]}
    assert never_lead.id in ready_ids
    assert expired_cooldown_lead.id in ready_ids
    assert cooldown_lead.id not in ready_ids

    resp_cooldown = client.get("/admin/leads?contact_status=cooldown", headers=headers)
    assert resp_cooldown.status_code == status.HTTP_200_OK
    cooldown_ids = {item["id"] for item in resp_cooldown.json()["items"]}
    assert cooldown_lead.id in cooldown_ids
    assert never_lead.id not in cooldown_ids

    resp_never = client.get("/admin/leads?contact_status=never_contacted", headers=headers)
    assert resp_never.status_code == status.HTTP_200_OK
    never_ids = {item["id"] for item in resp_never.json()["items"]}
    assert never_lead.id in never_ids
    assert cooldown_lead.id not in never_ids
    assert expired_cooldown_lead.id not in never_ids

    resp_uf = client.get("/admin/leads?uf=mg", headers=headers)
    assert resp_uf.status_code == status.HTTP_200_OK
    uf_ids = {item["id"] for item in resp_uf.json()["items"]}
    assert expired_cooldown_lead.id in uf_ids
    assert never_lead.id not in uf_ids

    resp_search = client.get("/admin/leads?search=Gama", headers=headers)
    assert resp_search.status_code == status.HTTP_200_OK
    search_items = resp_search.json()["items"]
    assert any(item["id"] == cooldown_lead.id for item in search_items)
    assert resp_search.json()["stats"]["in_cooldown"] >= 1


def test_register_contact_and_cooldown_warning(client, db_session):
    """Valida registro de contato, incremento de contact_count e aviso anti-SPAM."""
    headers = _create_admin_headers(db_session)
    lead = PncpLead(
        cnpj=generate_valid_cnpj(),
        razao_social="Omega Suprimentos LTDA",
        uf="PR",
        spam_cooldown_days=7,
    )
    db_session.add(lead)
    db_session.commit()
    db_session.refresh(lead)

    first_resp = client.post(
        f"/admin/leads/{lead.id}/contact",
        json={"channel": "whatsapp", "notes": "Primeiro contato comercial"},
        headers=headers,
    )
    assert first_resp.status_code == status.HTTP_200_OK
    first_data = first_resp.json()
    assert first_data["was_in_cooldown"] is False
    assert first_data["warning_message"] is None
    assert first_data["lead"]["contact_count"] == 1
    assert first_data["lead"]["last_contacted_at"] is not None
    assert first_data["lead"]["is_in_cooldown"] is True

    second_resp = client.post(
        f"/admin/leads/{lead.id}/contact",
        json={"channel": "email", "notes": "Follow-up imediato"},
        headers=headers,
    )
    assert second_resp.status_code == status.HTTP_200_OK
    second_data = second_resp.json()
    assert second_data["was_in_cooldown"] is True
    assert second_data["warning_message"] is not None
    assert "anti-SPAM" in second_data["warning_message"]
    assert second_data["lead"]["contact_count"] == 2
    assert second_data["lead"]["last_contact_channel"] == "email"

    detail_resp = client.get(f"/admin/leads/{lead.id}", headers=headers)
    assert detail_resp.status_code == status.HTTP_200_OK
    assert detail_resp.json()["id"] == lead.id

    not_found_resp = client.post(
        "/admin/leads/non-existent-id/contact",
        json={"channel": "whatsapp"},
        headers=headers,
    )
    assert not_found_resp.status_code == status.HTTP_404_NOT_FOUND


def test_pncp_leads_admin_route_protection(client, db_session, auth_headers):
    """Valida RBAC: 401 sem token, 403 para CLIENT e 200 para ADMIN."""
    no_auth_resp = client.get("/admin/leads")
    assert no_auth_resp.status_code == status.HTTP_401_UNAUTHORIZED

    client_resp = client.get("/admin/leads", headers=auth_headers)
    assert client_resp.status_code == status.HTTP_403_FORBIDDEN

    admin_headers = _create_admin_headers(db_session)
    admin_resp = client.get("/admin/leads", headers=admin_headers)
    assert admin_resp.status_code == status.HTTP_200_OK


def test_sync_pncp_leads_endpoint_mocked(client, db_session):
    """Valida endpoint POST /admin/leads/sync com mock de PncpService.sync_leads."""
    admin_headers = _create_admin_headers(db_session)
    mock_summary = PncpLeadSyncResponse(
        fetched=5,
        created=3,
        updated=1,
        skipped=1,
        errors=[],
    )

    with patch(
        "app.routers.pncp_lead_router.PncpService.sync_leads",
        new_callable=AsyncMock,
        return_value=mock_summary,
    ) as mock_sync:
        response = client.post(
            "/admin/leads/sync",
            json={
                "uf": "sp",
                "dias_retroativos": 5,
                "codigo_modalidade": 6,
                "max_paginas": 1,
                "tamanho_pagina": 20,
            },
            headers=admin_headers,
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "fetched": 5,
        "created": 3,
        "updated": 1,
        "skipped": 1,
        "errors": [],
    }
    mock_sync.assert_awaited_once()
