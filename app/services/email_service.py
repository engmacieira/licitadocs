"""
Serviço de Mensageria e E-mail (Adapter).
Utilizando a API HTTP oficial do Resend para contornar restrições de rede (Render/Firewalls).
Todas as funções são assíncronas para serem utilizadas com BackgroundTasks.
"""

import logging
import httpx
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from app.core.config import settings

# Configuração de Logging para melhor visibilidade no FastAPI
logger = logging.getLogger("app.services.email_service")

# ⚙️ Configuração do Jinja2 apontando para app/templates/
BASE_DIR = Path(__file__).resolve().parent.parent
template_env = Environment(loader=FileSystemLoader(str(BASE_DIR / "templates")))

class EmailService:
    
    @staticmethod
    async def send_email(to_email: str, subject: str, html_content: str) -> bool:
        """
        Método Base: Dispara um e-mail HTML de forma assíncrona via API HTTP do Resend.
        """
        api_key = settings.SMTP_PASSWORD
        from_email = settings.EMAILS_FROM_EMAIL
        from_name = settings.EMAILS_FROM_NAME

        if not all([api_key, from_email]):
            logger.warning(f"⚠️ [EMAIL] Credenciais não configuradas. Mock gerado para {to_email}.")
            print(f"--- MOCK EMAIL ---\nPara: {to_email}\nAssunto: {subject}\n{html_content}\n-------------------")
            return False

        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "from": f"{from_name} <{from_email}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }

        LIMITE_TEMPO = 30

        try:
            async with httpx.AsyncClient(timeout=LIMITE_TEMPO) as client:
                response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code in [200, 201]:
                logger.info(f"✅ [EMAIL] Enviado com sucesso para {to_email}.")
                return True
            else:
                logger.error(f"❌ [EMAIL] Erro na API do Resend ({response.status_code}): {response.text}")
                return False

        except Exception as e:
            logger.error(f"❌ [EMAIL] Erro inesperado no serviço de e-mail: {str(e)}")
            
        return False

    @staticmethod
    async def send_password_reset_email(to_email: str, reset_link: str) -> bool:
        """Envia e-mail com instruções e link para redefinição de senha."""
        subject = "🔄 Recuperação de Senha - LicitaDocs"
        template = template_env.get_template("reset_password.html")
        html_content = template.render(reset_link=reset_link)
        return await EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    async def send_verification_email(to_email: str, verify_link: str) -> bool:
        """Envia e-mail em formato HTML rico para verificação de conta (Onboarding e Reenvio)."""
        subject = "🚀 Bem-vindo ao LicitaDocs! Só falta um clique..."
        template = template_env.get_template("welcome_email.html")
        html_content = template.render(verify_link=verify_link)
        return await EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    async def send_verification_email_html(to_email: str, verify_link: str) -> bool:
        """
        Mantida para retrocompatibilidade caso haja chamadas perdidas em outras partes do código.
        Redireciona diretamente para a função principal send_verification_email.
        """
        return await EmailService.send_verification_email(to_email, verify_link)

    @staticmethod
    async def send_email_recovery_email(to_email: str, recovery_link: str) -> bool:
        """Envia alerta de segurança caso tenha ocorrido tentativa de recuperação pelo CPF/CNPJ."""
        subject = "⚠️ Alerta de Segurança e Acesso - LicitaDocs"
        template = template_env.get_template("recover_email.html")
        html_content = template.render(recovery_link=recovery_link)
        return await EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    async def send_new_company_alert(admin_email: str, company_name: str) -> bool:
        """Envia um alerta visual de dashboard para os administradores sobre um novo onboarding."""
        subject = f"🏢 Nova Empresa Cadastrada: {company_name}"
        template = template_env.get_template("send_new_company_alert.html")
        html_content = template.render(company_name=company_name)
        return await EmailService.send_email(admin_email, subject, html_content)