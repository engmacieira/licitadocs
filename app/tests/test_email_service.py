import pytest
from unittest.mock import MagicMock, patch
from app.services.email_service import EmailService
from app.core.config import settings

def test_send_email_no_smtp(monkeypatch, capsys):
    monkeypatch.setattr(settings, "SMTP_SERVER", "")
    result = EmailService.send_email("test@test.com", "Test", "<p>Test</p>")
    assert result is False

def test_send_email_success(monkeypatch, capsys):
    monkeypatch.setattr(settings, "SMTP_SERVER", "smtp.test.com")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USER", "user")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "pass")

    mock_server_instance = MagicMock()
    mock_smtp_class = MagicMock(return_value=MagicMock(__enter__=MagicMock(return_value=mock_server_instance), __exit__=MagicMock()))
    monkeypatch.setattr("smtplib.SMTP", mock_smtp_class)

    result = EmailService.send_email("test@test.com", "Test", "<p>Test</p>")
    assert result is True

def test_send_email_exception(monkeypatch, capsys):
    monkeypatch.setattr(settings, "SMTP_SERVER", "smtp.test.com")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    def mock_smtp(*args, **kwargs):
        raise Exception("Connection Error")
    monkeypatch.setattr("smtplib.SMTP", mock_smtp)
    result = EmailService.send_email("test@test.com", "Test", "<p>Test</p>")
    assert result is False

def test_send_password_reset_email(monkeypatch):
    with patch("app.services.email_service.EmailService.send_email") as mock_send:
        EmailService.send_password_reset_email("test@test.com", "123")

def test_send_verification_email(monkeypatch):
    with patch("app.services.email_service.EmailService.send_email") as mock_send:
        EmailService.send_verification_email("test@test.com", "456")

def test_send_email_recovery_email(monkeypatch):
    with patch("app.services.email_service.EmailService.send_email") as mock_send:
        EmailService.send_email_recovery_email("test@test.com")

def test_send_new_company_alert(monkeypatch):
    with patch("app.services.email_service.EmailService.send_email") as mock_send:
        data = {"razao_social": "Company SA", "cnpj": "123", "responsavel": "John", "email": "comp@comp.com"}
        EmailService.send_new_company_alert("admin@admin.com", data)
