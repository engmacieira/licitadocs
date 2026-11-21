"""
Configurações Centrais do Sistema (Settings).
Utiliza pydantic-settings para carregar e validar variáveis do .env.
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # ==========================================
    # 🌍 AMBIENTE E INFRAESTRUTURA
    # ==========================================
    ENV: str
    FRONTEND_URL: str
    CORS_ORIGINS: str
    STORAGE_PATH: Optional[str] = None
    ALLOWED_EXTENSIONS: list[str] = [".pdf"]
    
    # ==========================================
    # 🗄️ BANCO DE DADOS E SUPABASE
    # ==========================================
    DATABASE_URL: str
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None
    BANCO_AWS: Optional[str] = None
    SENHA_AWS: Optional[str] = None
    
    # ==========================================
    # 🔐 SEGURANÇA GERAL
    # ==========================================
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    RESET_TOKEN_EXPIRE_MINUTES: int
    
    # ==========================================
    # 🚀 INTEGRAÇÕES ATUAIS (Terceiros)
    # ==========================================
    GOOGLE_API_KEY: Optional[str] = None
    GITHUB: Optional[str] = None
    TELEGRAM_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None

    # ==========================================
    # 👁️ OBSERVABILIDADE (Sentry)
    # ==========================================
    SENTRY_DSN: Optional[str] = None

    # ==========================================
    # 📦 SPRINT 28: INTEGRAÇÕES E COMUNICAÇÃO
    # ==========================================
    
    # --- 1. Mensageria e E-mail ---
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: str
    ADMIN_EMAIL_NOTIFICATIONS: Optional[str] = None

    # --- 2. WhatsApp ---
    WHATSAPP_API_URL: Optional[str] = None
    WHATSAPP_API_TOKEN: Optional[str] = None
    WHATSAPP_INSTANCE: Optional[str] = None
    WHATSAPP_ENABLED: bool = False
    WHATSAPP_TIMEOUT_SECONDS: int = 15
    DOCUMENT_EXPIRATION_ALERT_DAYS: int = 15

    # --- 3. Pagamentos Infinite Pay ---
    INFINITEPAY_API_KEY: Optional[str] = None
    INFINITEPAY_WEBHOOK_SECRET: Optional[str] = None
    INFINITEPAY_HANDLE: Optional[str] = None
    INFINITEPAY_API_URL: str = "https://api.infinitepay.io"
    INFINITEPAY_WEBHOOK_URL: Optional[str] = None
    INFINITEPAY_REDIRECT_URL: Optional[str] = None
    INFINITEPAY_CANCEL_URL: Optional[str] = None
    INFINITEPAY_ENABLED: bool = False
    INFINITEPAY_TIMEOUT_SECONDS: int = 15

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

# Instância global das configurações
settings = Settings()
