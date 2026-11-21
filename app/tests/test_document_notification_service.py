"""
Testes automatizados para US-2806:
- DocumentNotificationService.notify_expiring_and_irregular_documents
- Endpoint POST /admin/notifications/documents/dispatch
"""

from datetime import date, datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status

from app.core.config import settings
from app.models.certificate_model import Certificate
from app.models.company_model import Company
from app.models.document_model import Document
from app.models.message_model import Message
from app.services.document_notification_service import DocumentNotificationService
from app.tests.conftest import generate_valid_cnpj


@pytest.fixture(autouse=True)
def isolate_notification_documents(db_session):
    """
    Garante isolamento dos documentos e alertas do sistema para que contagens
    como notifications_sent=1 e total_expiring=1 sejam determinísticas.
    """
    now = datetime.now(timezone.utc)
    db_session.query(Document).filter(Document.deleted_at.is_(None)).update(
        {"deleted_at": now}, synchronize_session=False
    )
    db_session.query(Certificate).filter(Certificate.deleted_at.is_(None)).update(
        {"deleted_at": now}, synchronize_session=False
    )
    db_session.query(Message).filter(
        Message.deleted_at.is_(None),
        Message.message_type == "system",
    ).update({"deleted_at": now}, synchronize_session=False)
    db_session.commit()

    yield

    cleanup_now = datetime.now(timezone.utc)
    db_session.query(Document).filter(Document.deleted_at.is_(None)).update(
        {"deleted_at": cleanup_now}, synchronize_session=False
    )
    db_session.query(Certificate).filter(Certificate.deleted_at.is_(None)).update(
        {"deleted_at": cleanup_now}, synchronize_session=False
    )
    db_session.query(Message).filter(
        Message.deleted_at.is_(None),
        Message.message_type == "system",
    ).update({"deleted_at": cleanup_now}, synchronize_session=False)
    db_session.commit()


def _create_company(
    db_session,
    *,
    razao_social: str = "Empresa Notificacao LTDA",
    whatsapp: str | None = "11999998888",
    telefone: str | None = None,
    email_corporativo: str | None = "contato@empresa.com",
    is_active: bool = True,
) -> Company:
    company = Company(
        cnpj=generate_valid_cnpj(),
        razao_social=razao_social,
        whatsapp=whatsapp,
        telefone=telefone,
        email_corporativo=email_corporativo,
        owner_id=None,
        is_active=is_active,
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company


def _create_document(
    db_session,
    company_id: str,
    *,
    title: str = "Certidão Negativa Federal",
    filename: str = "cnd_federal.pdf",
    expiration_date: date | None = None,
    status_value: str = "warning",
) -> Document:
    doc = Document(
        title=title,
        filename=filename,
        file_path=f"/tmp/{filename}",
        company_id=company_id,
        expiration_date=expiration_date,
        status=status_value,
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    return doc


async def test_notify_expiring_document_sends_whatsapp_email_and_saves_message(
    db_session,
):
    company = _create_company(db_session)
    exp_date = date.today() + timedelta(
        days=max(1, settings.DOCUMENT_EXPIRATION_ALERT_DAYS - 1)
    )
    doc = _create_document(
        db_session,
        company.id,
        title="CND Estadual",
        filename="cnd_estadual.pdf",
        expiration_date=exp_date,
        status_value="warning",
    )

    with (
        patch(
            "app.services.document_notification_service.WhatsAppService.send_document_alert",
            new=AsyncMock(return_value=True),
        ) as mock_wa,
        patch(
            "app.services.document_notification_service.EmailService.send_email",
            new=AsyncMock(return_value=True),
        ) as mock_email,
    ):
        result = await DocumentNotificationService.notify_expiring_and_irregular_documents(
            db_session
        )

    assert result["total_expiring"] == 1
    assert result["total_irregular"] == 0
    assert result["notifications_sent"] == 1
    assert result["whatsapp_sent"] == 1
    assert result["email_sent"] == 1
    assert result["skipped_duplicates"] == 0
    assert result["skipped_no_contact"] == 0
    assert result["dry_run"] is False

    mock_wa.assert_awaited_once_with(
        phone="11999998888",
        company_name=company.razao_social,
        document_title="CND Estadual",
        alert_type="expiring",
        expiration_date=exp_date.strftime("%d/%m/%Y"),
    )
    mock_email.assert_awaited_once()
    email_kwargs = mock_email.await_args.kwargs
    assert email_kwargs["to_email"] == "contato@empresa.com"
    assert email_kwargs["subject"].startswith("[Alerta Vencimento]")
    assert "CND Estadual" in email_kwargs["subject"]

    saved_msg = (
        db_session.query(Message)
        .filter(
            Message.related_document_id == doc.id,
            Message.deleted_at.is_(None),
        )
        .first()
    )
    assert saved_msg is not None
    assert saved_msg.company_id == company.id
    assert saved_msg.message_type == "system"
    assert saved_msg.sender_id is None
    assert saved_msg.subject.startswith("[Alerta Vencimento]")


@pytest.mark.parametrize("irregular_status", ["irregular", "error"])
async def test_notify_irregular_document_sends_irregularity_alert(
    db_session, irregular_status
):
    company = _create_company(db_session)
    doc = _create_document(
        db_session,
        company.id,
        title="FGTS Regularidade",
        filename="fgts.pdf",
        expiration_date=None,
        status_value=irregular_status,
    )

    with (
        patch(
            "app.services.document_notification_service.WhatsAppService.send_document_alert",
            new=AsyncMock(return_value=True),
        ) as mock_wa,
        patch(
            "app.services.document_notification_service.EmailService.send_email",
            new=AsyncMock(return_value=True),
        ) as mock_email,
    ):
        result = await DocumentNotificationService.notify_expiring_and_irregular_documents(
            db_session
        )

    assert result["total_expiring"] == 0
    assert result["total_irregular"] == 1
    assert result["notifications_sent"] == 1
    assert result["whatsapp_sent"] == 1
    assert result["email_sent"] == 1

    mock_wa.assert_awaited_once_with(
        phone="11999998888",
        company_name=company.razao_social,
        document_title="FGTS Regularidade",
        alert_type="irregular",
        expiration_date=None,
    )
    mock_email.assert_awaited_once()
    assert mock_email.await_args.kwargs["subject"].startswith("[Alerta Irregularidade]")

    saved_msg = (
        db_session.query(Message)
        .filter(
            Message.related_document_id == doc.id,
            Message.deleted_at.is_(None),
        )
        .first()
    )
    assert saved_msg is not None
    assert saved_msg.message_type == "system"
    assert saved_msg.sender_id is None
    assert saved_msg.subject.startswith("[Alerta Irregularidade]")


async def test_notify_deduplication_skips_second_execution_in_same_window(db_session):
    company = _create_company(db_session)
    exp_date = date.today() + timedelta(days=3)
    doc = _create_document(
        db_session,
        company.id,
        title="CND Trabalhista",
        filename="cndt.pdf",
        expiration_date=exp_date,
        status_value="warning",
    )

    with (
        patch(
            "app.services.document_notification_service.WhatsAppService.send_document_alert",
            new=AsyncMock(return_value=True),
        ) as mock_wa,
        patch(
            "app.services.document_notification_service.EmailService.send_email",
            new=AsyncMock(return_value=True),
        ) as mock_email,
    ):
        first_result = (
            await DocumentNotificationService.notify_expiring_and_irregular_documents(
                db_session
            )
        )
        assert first_result["notifications_sent"] == 1

        mock_wa.reset_mock()
        mock_email.reset_mock()

        second_result = (
            await DocumentNotificationService.notify_expiring_and_irregular_documents(
                db_session
            )
        )

    assert second_result["notifications_sent"] == 0
    assert second_result["skipped_duplicates"] >= 1
    mock_wa.assert_not_called()
    mock_email.assert_not_called()

    messages_count = (
        db_session.query(Message)
        .filter(
            Message.related_document_id == doc.id,
            Message.deleted_at.is_(None),
        )
        .count()
    )
    assert messages_count == 1


async def test_notify_dry_run_counts_without_sending_or_saving_message(db_session):
    company = _create_company(db_session)
    exp_date = date.today() + timedelta(days=5)
    doc_expiring = _create_document(
        db_session,
        company.id,
        title="Alvará Municipal",
        filename="alvara.pdf",
        expiration_date=exp_date,
        status_value="warning",
    )
    doc_irregular = _create_document(
        db_session,
        company.id,
        title="Balanço Patrimonial",
        filename="balanco.pdf",
        expiration_date=None,
        status_value="irregular",
    )

    with (
        patch(
            "app.services.document_notification_service.WhatsAppService.send_document_alert",
            new=AsyncMock(return_value=True),
        ) as mock_wa,
        patch(
            "app.services.document_notification_service.EmailService.send_email",
            new=AsyncMock(return_value=True),
        ) as mock_email,
    ):
        result = await DocumentNotificationService.notify_expiring_and_irregular_documents(
            db_session, dry_run=True
        )

    assert result["dry_run"] is True
    assert result["total_expiring"] == 1
    assert result["total_irregular"] == 1
    assert result["notifications_sent"] == 0
    assert result["whatsapp_sent"] == 0
    assert result["email_sent"] == 0
    mock_wa.assert_not_called()
    mock_email.assert_not_called()

    saved_messages = (
        db_session.query(Message)
        .filter(
            Message.related_document_id.in_([doc_expiring.id, doc_irregular.id]),
            Message.deleted_at.is_(None),
        )
        .count()
    )
    assert saved_messages == 0


async def test_notify_company_without_contact_counts_skipped_no_contact(db_session):
    company = _create_company(
        db_session,
        razao_social="Empresa Sem Contato LTDA",
        whatsapp=None,
        telefone=None,
        email_corporativo=None,
    )
    exp_date = date.today() + timedelta(days=4)
    doc = _create_document(
        db_session,
        company.id,
        title="Contrato Social",
        filename="contrato.pdf",
        expiration_date=exp_date,
        status_value="warning",
    )

    with (
        patch(
            "app.services.document_notification_service.WhatsAppService.send_document_alert",
            new=AsyncMock(return_value=True),
        ) as mock_wa,
        patch(
            "app.services.document_notification_service.EmailService.send_email",
            new=AsyncMock(return_value=True),
        ) as mock_email,
    ):
        result = await DocumentNotificationService.notify_expiring_and_irregular_documents(
            db_session
        )

    assert result["total_expiring"] == 1
    assert result["skipped_no_contact"] == 1
    assert result["notifications_sent"] == 0
    mock_wa.assert_not_called()
    mock_email.assert_not_called()

    saved_msg = (
        db_session.query(Message)
        .filter(
            Message.related_document_id == doc.id,
            Message.deleted_at.is_(None),
        )
        .first()
    )
    assert saved_msg is None


def test_dispatch_document_notifications_endpoint_forbidden_for_client(
    client, auth_headers
):
    response = client.post(
        "/admin/notifications/documents/dispatch",
        headers=auth_headers,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_dispatch_document_notifications_endpoint_success_for_admin(
    client, db_session, admin_headers
):
    company = _create_company(db_session)
    exp_date = date.today() + timedelta(days=5)
    _create_document(
        db_session,
        company.id,
        title="CND Municipal",
        filename="cnd_municipal.pdf",
        expiration_date=exp_date,
        status_value="warning",
    )

    with (
        patch(
            "app.services.document_notification_service.WhatsAppService.send_document_alert",
            new=AsyncMock(return_value=True),
        ),
        patch(
            "app.services.document_notification_service.EmailService.send_email",
            new=AsyncMock(return_value=True),
        ),
    ):
        response = client.post(
            "/admin/notifications/documents/dispatch?days=10&dry_run=false",
            headers=admin_headers,
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data == {
        "days_threshold": 10,
        "total_expiring": 1,
        "total_irregular": 0,
        "notifications_sent": 1,
        "whatsapp_sent": 1,
        "email_sent": 1,
        "skipped_duplicates": 0,
        "skipped_no_contact": 0,
        "dry_run": False,
    }
