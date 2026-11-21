"""
Serviço de Mensageria via WhatsApp (Adapter).
Realiza envios assíncronos via API HTTP (Evolution API / compatível) com no-op seguro
quando desabilitado ou sem credenciais configuradas.
"""

import logging
import re
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("app.services.whatsapp_service")

_ALERT_LABELS = {
    "expiring": "Documento próximo do vencimento",
    "vencimento": "Documento próximo do vencimento",
    "a_vencer": "Documento próximo do vencimento",
    "expired": "Documento vencido",
    "vencido": "Documento vencido",
    "irregular": "Irregularidade identificada no documento",
    "irregularidade": "Irregularidade identificada no documento",
}


class WhatsAppService:
    """Adapter assíncrono para envio de notificações via WhatsApp."""

    @staticmethod
    def normalize_phone(phone: Optional[str]) -> Optional[str]:
        """
        Normaliza um número de telefone brasileiro para o padrão DDI + DDD + número.
        - Remove caracteres não numéricos.
        - Se tiver 10 ou 11 dígitos, prefixa '55'.
        - Se começar com '55' e tiver 12 ou 13 dígitos, mantém.
        - Retorna None se inválido ou vazio.
        """
        if not phone:
            return None

        digits = re.sub(r"\D", "", phone)
        if not digits:
            return None

        if len(digits) in (10, 11):
            return f"55{digits}"

        if digits.startswith("55") and len(digits) in (12, 13):
            return digits

        return None

    @staticmethod
    async def send_message(phone: str, message: str) -> bool:
        """
        Envia uma mensagem de texto via API HTTP do WhatsApp de forma assíncrona.
        Retorna False de forma segura (sem lançar exceção) se desabilitado,
        sem credenciais, com telefone inválido ou em caso de falha de comunicação.
        """
        if not settings.WHATSAPP_ENABLED:
            logger.warning("⚠️ [WHATSAPP] Serviço desabilitado (WHATSAPP_ENABLED=False). Envio ignorado.")
            return False

        if not settings.WHATSAPP_API_URL or not settings.WHATSAPP_API_TOKEN:
            logger.warning("⚠️ [WHATSAPP] Credenciais não configuradas (WHATSAPP_API_URL/WHATSAPP_API_TOKEN). Envio ignorado.")
            return False

        normalized_phone = WhatsAppService.normalize_phone(phone)
        if not normalized_phone:
            logger.warning("⚠️ [WHATSAPP] Número de telefone inválido para envio.")
            return False

        base_url = settings.WHATSAPP_API_URL.rstrip("/")
        if settings.WHATSAPP_INSTANCE:
            url = f"{base_url}/message/sendText/{settings.WHATSAPP_INSTANCE}"
        else:
            url = f"{base_url}/message/sendText"

        headers = {
            "apikey": settings.WHATSAPP_API_TOKEN,
            "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {
            "number": normalized_phone,
            "text": message,
        }

        try:
            async with httpx.AsyncClient(timeout=settings.WHATSAPP_TIMEOUT_SECONDS) as client:
                response = await client.post(url, json=payload, headers=headers)

            if response.status_code in (200, 201):
                logger.info(f"✅ [WHATSAPP] Mensagem enviada com sucesso para {normalized_phone}.")
                return True

            logger.error(
                f"❌ [WHATSAPP] Erro na API do WhatsApp ({response.status_code}): {response.text}"
            )
            return False

        except httpx.TimeoutException as exc:
            logger.error(f"❌ [WHATSAPP] Timeout ao enviar mensagem para {normalized_phone}: {exc}")
            return False
        except httpx.HTTPError as exc:
            logger.error(f"❌ [WHATSAPP] Erro HTTP ao enviar mensagem para {normalized_phone}: {exc}")
            return False
        except Exception as exc:
            logger.error(f"❌ [WHATSAPP] Erro inesperado no serviço de WhatsApp: {exc}")
            return False

    @staticmethod
    async def send_document_alert(
        phone: str,
        company_name: str,
        document_title: str,
        alert_type: str,
        expiration_date: Optional[str] = None,
    ) -> bool:
        """
        Formata e envia um alerta de vencimento ou irregularidade documental via WhatsApp.
        """
        alert_label = _ALERT_LABELS.get(alert_type.strip().lower(), f"Alerta ({alert_type})")
        lines = [
            f"LicitaDocs - {alert_label}",
            f"Empresa: {company_name}",
            f"Documento: {document_title}",
        ]
        if expiration_date:
            lines.append(f"Vencimento: {expiration_date}")
        lines.append("Acesse a plataforma LicitaDocs para verificar e regularizar.")

        message = "\n".join(lines)
        return await WhatsAppService.send_message(phone, message)
