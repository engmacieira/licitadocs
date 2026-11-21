from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.services.whatsapp_service import WhatsAppService


def _make_settings(
    enabled: bool = True,
    api_url: str | None = "https://api.whatsapp.test",
    api_token: str | None = "token-123",
    instance: str | None = None,
    timeout: int = 15,
) -> SimpleNamespace:
    return SimpleNamespace(
        WHATSAPP_ENABLED=enabled,
        WHATSAPP_API_URL=api_url,
        WHATSAPP_API_TOKEN=api_token,
        WHATSAPP_INSTANCE=instance,
        WHATSAPP_TIMEOUT_SECONDS=timeout,
    )


def _mock_async_client(post_mock: AsyncMock) -> MagicMock:
    client_instance = MagicMock()
    client_instance.post = post_mock
    client_cm = MagicMock()
    client_cm.__aenter__ = AsyncMock(return_value=client_instance)
    client_cm.__aexit__ = AsyncMock(return_value=None)
    return client_cm


@pytest.mark.parametrize(
    ("raw_phone", "expected"),
    [
        ("1133334444", "551133334444"),
        ("11999998888", "5511999998888"),
        ("551133334444", "551133334444"),
        ("5511999998888", "5511999998888"),
        ("(11) 99999-8888", "5511999998888"),
        ("+55 (11) 3333-4444", "551133334444"),
        (None, None),
        ("", None),
        ("   ", None),
        ("abc-def", None),
        ("12345", None),
        ("4411999998888", None),
        ("551199999888899", None),
    ],
)
def test_normalize_phone(raw_phone, expected):
    assert WhatsAppService.normalize_phone(raw_phone) == expected


async def test_send_message_disabled_noop():
    cfg = _make_settings(enabled=False)
    with (
        patch("app.services.whatsapp_service.settings", cfg),
        patch("app.services.whatsapp_service.httpx.AsyncClient") as mock_client_cls,
    ):
        result = await WhatsAppService.send_message("11999998888", "Teste")

    assert result is False
    mock_client_cls.assert_not_called()


@pytest.mark.parametrize(
    ("api_url", "api_token"),
    [
        (None, "token-123"),
        ("", "token-123"),
        ("https://api.whatsapp.test", None),
        ("https://api.whatsapp.test", ""),
    ],
)
async def test_send_message_missing_credentials_noop(api_url, api_token):
    cfg = _make_settings(enabled=True, api_url=api_url, api_token=api_token)
    with (
        patch("app.services.whatsapp_service.settings", cfg),
        patch("app.services.whatsapp_service.httpx.AsyncClient") as mock_client_cls,
    ):
        result = await WhatsAppService.send_message("11999998888", "Teste")

    assert result is False
    mock_client_cls.assert_not_called()


async def test_send_message_invalid_phone_noop():
    cfg = _make_settings(enabled=True)
    with (
        patch("app.services.whatsapp_service.settings", cfg),
        patch("app.services.whatsapp_service.httpx.AsyncClient") as mock_client_cls,
    ):
        result = await WhatsAppService.send_message("123", "Teste")

    assert result is False
    mock_client_cls.assert_not_called()


@pytest.mark.parametrize(
    ("status_code", "instance", "expected_url"),
    [
        (200, "licita-instancia", "https://api.whatsapp.test/message/sendText/licita-instancia"),
        (201, None, "https://api.whatsapp.test/message/sendText"),
    ],
)
async def test_send_message_success(status_code, instance, expected_url):
    cfg = _make_settings(
        enabled=True,
        api_url="https://api.whatsapp.test/",
        api_token="secret-token",
        instance=instance,
        timeout=20,
    )
    mock_response = MagicMock(status_code=status_code, text="OK")
    post_mock = AsyncMock(return_value=mock_response)
    client_cm = _mock_async_client(post_mock)

    with (
        patch("app.services.whatsapp_service.settings", cfg),
        patch("app.services.whatsapp_service.httpx.AsyncClient", return_value=client_cm) as mock_client_cls,
    ):
        result = await WhatsAppService.send_message("(11) 99999-8888", "Olá LicitaDocs")

    assert result is True
    mock_client_cls.assert_called_once_with(timeout=20)
    post_mock.assert_awaited_once_with(
        expected_url,
        json={"number": "5511999998888", "text": "Olá LicitaDocs"},
        headers={
            "apikey": "secret-token",
            "Authorization": "Bearer secret-token",
            "Content-Type": "application/json",
        },
    )


async def test_send_message_http_status_500_returns_false():
    cfg = _make_settings(enabled=True)
    mock_response = MagicMock(status_code=500, text="Internal Server Error")
    post_mock = AsyncMock(return_value=mock_response)
    client_cm = _mock_async_client(post_mock)

    with (
        patch("app.services.whatsapp_service.settings", cfg),
        patch("app.services.whatsapp_service.httpx.AsyncClient", return_value=client_cm),
    ):
        result = await WhatsAppService.send_message("11999998888", "Teste")

    assert result is False
    post_mock.assert_awaited_once()


async def test_send_message_timeout_returns_false():
    cfg = _make_settings(enabled=True)
    post_mock = AsyncMock(side_effect=httpx.TimeoutException("Request timed out"))
    client_cm = _mock_async_client(post_mock)

    with (
        patch("app.services.whatsapp_service.settings", cfg),
        patch("app.services.whatsapp_service.httpx.AsyncClient", return_value=client_cm),
    ):
        result = await WhatsAppService.send_message("11999998888", "Teste")

    assert result is False
    post_mock.assert_awaited_once()


@pytest.mark.parametrize(
    ("alert_type", "expiration_date", "expected_label"),
    [
        ("expiring", "2026-12-31", "Documento próximo do vencimento"),
        ("irregular", None, "Irregularidade identificada no documento"),
        ("custom", "2026-11-30", "Alerta (custom)"),
    ],
)
async def test_send_document_alert_formats_and_delegates(alert_type, expiration_date, expected_label):
    with patch.object(
        WhatsAppService,
        "send_message",
        new=AsyncMock(return_value=True),
    ) as mock_send:
        result = await WhatsAppService.send_document_alert(
            phone="11999998888",
            company_name="Empresa Alpha",
            document_title="CND Federal",
            alert_type=alert_type,
            expiration_date=expiration_date,
        )

    assert result is True
    mock_send.assert_awaited_once()
    sent_phone, sent_message = mock_send.await_args.args
    assert sent_phone == "11999998888"
    assert f"LicitaDocs - {expected_label}" in sent_message
    assert "Empresa: Empresa Alpha" in sent_message
    assert "Documento: CND Federal" in sent_message
    assert "Acesse a plataforma LicitaDocs para verificar e regularizar." in sent_message
    if expiration_date:
        assert f"Vencimento: {expiration_date}" in sent_message
    else:
        assert "Vencimento:" not in sent_message
