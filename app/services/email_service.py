"""
Serviço de Mensageria e E-mail genérico (Adapter).
Isola a aplicação da dependência direta de um provedor específico (SendGrid/SES).
"""

import smtplib
import logging
import socket
from email.message import EmailMessage
from typing import Optional
from app.core.config import settings

# Configuração de Logging para melhor visibilidade no FastAPI
logger = logging.getLogger("app.services.email_service")

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str) -> bool:
        """
        Dispara um e-mail HTML usando as credenciais SMTP globais configuradas no .env.
        """
        # Validação de infraestrutura
        if not settings.SMTP_SERVER or not settings.SMTP_PORT:
            logger.warning("⚠️ [EMAIL] SMTP não configurado. E-mail não enviado.")
            # Num ambiente de teste, podemos apenas imprimir no console
            print(f"--- MOCK EMAIL PARA {to_email} ---\n{html_content}\n-----------------------")
            return False

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email
        
        # Define o conteúdo como HTML
        msg.add_alternative(html_content, subtype='html')

        # Limite máximo de tempo para conexão (alinhado com test_resend_smtp.py)
        TIMEOUT_SECONDS = 30

        try:
            logger.info(f"🔌 [EMAIL] Conectando ao servidor SMTP {settings.SMTP_SERVER}:{settings.SMTP_PORT}...")

            # De acordo com o teste bem-sucedido, se a porta for 465 usamos SSL direto
            if settings.SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=TIMEOUT_SECONDS)
            else:
                server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=TIMEOUT_SECONDS)
                server.starttls()

            with server:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    logger.info("🔐 [EMAIL] Autenticando...")
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

                logger.info(f"📧 [EMAIL] Enviando mensagem para {to_email}...")
                server.send_message(msg)

            logger.info(f"✅ [EMAIL] E-mail enviado com sucesso para {to_email}")
            return True
        except socket.timeout:
            logger.error(f"❌ [EMAIL] Timeout ao conectar com {settings.SMTP_SERVER}:{settings.SMTP_PORT}")
        except smtplib.SMTPAuthenticationError:
            logger.error("❌ [EMAIL] Erro de Autenticação SMTP. Verifique usuário e senha.")
        except Exception as e:
            logger.error(f"🚨 [EMAIL] Falha ao enviar e-mail para {to_email}. Erro: {str(e)}")

        return False

    @staticmethod
    def send_password_reset_email(to_email: str, reset_token: str) -> None:
        """
        Monta e dispara o template de e-mail de recuperação de senha.
        """
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        html_content = f"""
        <html>
            <body>
                <h2>Recuperação de Acesso - LicitaDoc</h2>
                <p>Recebemos um pedido para redefinir a sua senha.</p>
                <p>Clique no botão abaixo para cadastrar uma nova senha. <strong>Este link é válido por {settings.RESET_TOKEN_EXPIRE_MINUTES} minutos.</strong></p>
                <a href="{reset_link}" style="display:inline-block; padding:10px 20px; background-color:#0056b3; color:white; text-decoration:none; border-radius:5px;">Redefinir Minha Senha</a>
                <p>Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
            </body>
        </html>
        """
        EmailService.send_email(to_email, "Redefinição de Senha - LicitaDoc", html_content)

    @staticmethod
    def send_verification_email(to_email: str, token: str) -> None:
        """
        Envia o link para validação de conta após o registo.
        """
        verify_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        html_content = f"""
        <html>
            <body>
                <h2>Bem-vindo ao LicitaDoc!</h2>
                <p>Falta apenas um passo para ativar a sua conta.</p>
                <p>Clique no botão abaixo para confirmar o seu e-mail:</p>
                <a href="{verify_link}" style="display:inline-block; padding:10px 20px; background-color:#28a745; color:white; text-decoration:none; border-radius:5px;">Confirmar E-mail</a>
                <p>Este link expira em 24 horas.</p>
            </body>
        </html>
        """
        EmailService.send_verification_email_html(to_email, html_content)

    @staticmethod
    def send_verification_email_html(to_email: str, html_content: str) -> None:
        """Auxiliar para enviar e-mail de verificação (pode ser usado para reenvio)."""
        EmailService.send_email(to_email, "Confirme o seu e-mail - LicitaDoc", html_content)

    @staticmethod
    def send_email_recovery_email(to_email: str) -> None:
        """
        Envia um lembrete informando ao usuário qual é o seu e-mail de acesso.
        """
        html_content = f"""
        <html>
            <body>
                <h2>Recuperação de Acesso - LicitaDoc</h2>
                <p>Recebemos um pedido para lembrar o e-mail de acesso vinculado ao seu documento.</p>
                <p>Este é o seu e-mail oficial cadastrado em nossa plataforma: <strong>{to_email}</strong></p>
                <p>Se você também esqueceu a sua senha, <a href="{settings.FRONTEND_URL}/forgot-password" style="color: #0056b3;">clique aqui para redefini-la</a>.</p>
                <p>Se você não solicitou este lembrete, fique tranquilo, sua conta está segura.</p>
            </body>
        </html>
        """
        EmailService.send_email(to_email, "Lembrete do seu E-mail de Acesso - LicitaDoc", html_content)

    @staticmethod
    def send_new_company_alert(admin_email: str, company_data: dict) -> None:
        """
        Envia um alerta para a equipa administrativa sobre o registo de uma nova empresa.
        """
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #0056b3;">🚨 Novo Registo de Empresa</h2>
                <p>Uma nova empresa concluiu a fase inicial de onboarding na plataforma LicitaDoc:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                    <ul style="list-style-type: none; padding: 0;">
                        <li style="margin-bottom: 8px;"><strong>🏢 Razão Social:</strong> {company_data.get('razao_social')}</li>
                        <li style="margin-bottom: 8px;"><strong>📄 CNPJ:</strong> {company_data.get('cnpj')}</li>
                        <li style="margin-bottom: 8px;"><strong>👤 Responsável:</strong> {company_data.get('responsavel')}</li>
                        <li style="margin-bottom: 8px;"><strong>✉️ E-mail:</strong> {company_data.get('email')}</li>
                    </ul>
                </div>
                
                <p style="margin-top: 20px;">Aceda ao painel de administração para verificar os documentos e validar o acesso desta empresa.</p>
            </body>
        </html>
        """
        EmailService.send_email(admin_email, f"Novo Registo: {company_data.get('razao_social')}", html_content)
