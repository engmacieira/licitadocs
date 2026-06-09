"""
Serviço de Mensageria e E-mail (Adapter).
Utilizando a API HTTP oficial do Resend para contornar restrições de rede (Render/Firewalls).
Todas as funções são assíncronas para serem utilizadas com BackgroundTasks.
"""

import logging
import httpx
from app.core.config import settings

# Configuração de Logging para melhor visibilidade no FastAPI
logger = logging.getLogger("app.services.email_service")

class EmailService:
    
    @staticmethod
    async def send_email(to_email: str, subject: str, html_content: str) -> bool:
        """
        Método Base: Dispara um e-mail HTML de forma assíncrona via API HTTP do Resend.
        
        Args:
            to_email (str): E-mail do destinatário.
            subject (str): Assunto do e-mail.
            html_content (str): Conteúdo formatado em HTML.
            
        Returns:
            bool: True se aceito pela API do Resend, False caso contrário.
        """
        api_key = settings.SMTP_PASSWORD  # Reaproveitando a variável para o Token da API
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
                logger.info(f"✅ [EMAIL] Enviado com sucesso para {to_email}. ID: {response.json().get('id')}")
                return True
            else:
                logger.error(f"❌ [EMAIL] Erro na API do Resend ({response.status_code}): {response.text}")
                return False

        except httpx.TimeoutException:
            logger.error(f"❌ [EMAIL] Timeout de {LIMITE_TEMPO}s esgotado ao conectar na API do Resend.")
        except httpx.RequestError as exc:
            logger.error(f"❌ [EMAIL] Erro de rede ao conectar na API do Resend: {exc}")
        except Exception as e:
            logger.error(f"❌ [EMAIL] Erro inesperado no serviço de e-mail: {str(e)}")
            
        return False

    @staticmethod
    async def send_password_reset_email(to_email: str, reset_link: str) -> bool:
        """Envia e-mail com instruções e link para redefinição de senha."""
        subject = "🔄 Recuperação de Senha - LicitaDocs"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Recuperação de Senha</h2>
                <p>Olá,</p>
                <p>Você solicitou a alteração da sua senha no <strong>LicitaDocs</strong>. Clique no botão abaixo para criar uma nova senha:</p>
                <p>
                    <a href="{reset_link}" style="background-color: #0056b3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Redefinir Minha Senha
                    </a>
                </p>
                <p><small>Se o botão não funcionar, copie e cole este link no seu navegador: <br>{reset_link}</small></p>
                <p><small>Este link expira em 15 minutos. Se você não solicitou esta alteração, ignore este e-mail.</small></p>
            </body>
        </html>
        """
        return await EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    async def send_verification_email(to_email: str, verify_link: str) -> bool:
        """Envia e-mail simples para verificação de titularidade da conta."""
        subject = "✅ Verifique sua conta - LicitaDocs"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Confirmação de Conta</h2>
                <p>Por favor, confirme seu endereço de e-mail clicando no link abaixo:</p>
                <p><a href="{verify_link}">{verify_link}</a></p>
            </body>
        </html>
        """
        return await EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    async def send_verification_email_html(to_email: str, verify_link: str) -> bool:
        """Envia e-mail em formato HTML rico para verificação de conta (Onboarding)."""
        subject = "🚀 Bem-vindo ao LicitaDocs! Verifique seu E-mail"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2 style="color: #0056b3;">Bem-vindo ao LicitaDocs!</h2>
                <p>Olá!</p>
                <p>Estamos muito felizes em ter você conosco. Para começar a automatizar sua gestão de licitações, precisamos apenas que você verifique seu e-mail.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{verify_link}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Verificar Meu E-mail Agora
                    </a>
                </p>
                <p><small>Caso tenha problemas, acesse: {verify_link}</small></p>
                <p>Um abraço,<br><strong>Equipe LicitaDocs</strong></p>
            </body>
        </html>
        """
        return await EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    async def send_email_recovery_email(to_email: str, recovery_link: str) -> bool:
        """Envia alerta de segurança caso o e-mail da conta tenha sido alterado."""
        subject = "⚠️ Alerta de Segurança: Alteração de E-mail - LicitaDocs"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #dc3545;">Aviso de Segurança</h2>
                <p>Notamos que o endereço de e-mail associado à sua conta do LicitaDocs foi alterado recentemente.</p>
                <p>Se foi você quem fez essa alteração, nenhuma ação é necessária.</p>
                <p><strong>Não foi você?</strong> Clique imediatamente no link abaixo para recuperar o acesso à sua conta:</p>
                <p>
                    <a href="{recovery_link}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Proteger Minha Conta
                    </a>
                </p>
            </body>
        </html>
        """
        return await EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    async def send_new_company_alert(admin_email: str, company_name: str) -> bool:
        """Envia um alerta para os administradores do sistema sobre o cadastro de uma nova empresa."""
        subject = f"🏢 Nova Empresa Cadastrada: {company_name}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Novo Cadastro na Plataforma</h2>
                <p>Uma nova empresa acaba de realizar o cadastro (onboarding) no LicitaDocs.</p>
                <ul>
                    <li><strong>Nome da Empresa:</strong> {company_name}</li>
                </ul>
                <p>Acesse o painel administrativo para mais detalhes.</p>
            </body>
        </html>
        """
        return await EmailService.send_email(admin_email, subject, html_content)