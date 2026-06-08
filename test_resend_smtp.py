import os
import smtplib
import socket  # Importado para capturar a exceção de timeout de rede
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

def testar_envio_smtp():
    """
    Testa a conexão SMTP com o Resend, impondo um limite de tempo (timeout) de 30 segundos.
    
    Args:
        Nenhum. Busca credenciais diretamente do ambiente (.env).
    Returns:
        bool: True se enviado com sucesso, False caso contrário.
    """
    print("🚀 Iniciando teste de integração com o Resend via SMTP (com Timeout de 30s)...")

    # Coleta e validação das variáveis de ambiente (Zero Guessing Policy)
    smtp_server = os.getenv("SMTP_SERVER") or ""
    smtp_port = os.getenv("SMTP_PORT") or ""
    smtp_user = os.getenv("SMTP_USER") or ""
    smtp_password = os.getenv("SMTP_PASSWORD") or ""
    from_email = os.getenv("EMAILS_FROM_EMAIL") or ""
    from_name = os.getenv("EMAILS_FROM_NAME") or "LicitaDocs"
    to_email = os.getenv("ADMIN_EMAIL_NOTIFICATIONS") or ""

    # Validação rápida de segurança para garantir que as variáveis existem
    if not all([smtp_server, smtp_port, smtp_user, smtp_password, from_email, to_email]):
        print("❌ Erro: Algumas variáveis obrigatórias estão ausentes no seu arquivo .env!")
        print(f"Verifique: SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAILS_FROM_EMAIL, ADMIN_EMAIL_NOTIFICATIONS")
        return False

    # Configuração da Mensagem
    msg = MIMEMultipart()
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email
    msg["Subject"] = "🧪 Teste de Conexão com Timeout - LicitaDocs"

    corpo_email = """
    <html>
        <body>
            <h2>Conexão com o Resend realizada com sucesso! 🎉</h2>
            <p>Este teste confirmou que a conexão e o disparo ocorrem de forma segura dentro do limite de tempo estipulado.</p>
        </body>
    </html>
    """
    msg.attach(MIMEText(corpo_email, "html"))

    # Definimos o limite máximo de 30 segundos para estabelecer a conexão e responder
    LIMITE_TEMPO_SEGUNDOS = 30

    try:
        print(f"🔌 Conectando ao servidor {smtp_server}:{smtp_port} (Timeout: {LIMITE_TEMPO_SEGUNDOS}s)...")
        
        # O parâmetro timeout é passado diretamente aqui
        if smtp_port == "465":
            server = smtplib.SMTP_SSL(smtp_server, int(smtp_port), timeout=LIMITE_TEMPO_SEGUNDOS)
        else:
            server = smtplib.SMTP(smtp_server, int(smtp_port), timeout=LIMITE_TEMPO_SEGUNDOS)
            server.starttls()  # Ativa a criptografia TLS indispensável para o Resend
        
        print("🔐 Autenticando com as credenciais fornecidas...")
        server.login(smtp_user, smtp_password)
        
        print(f"📧 Enviando e-mail de teste para: {to_email}...")
        server.sendmail(from_email, to_email, msg.as_string())
        
        print("✅ Sucesso! O e-mail foi aceito pelo servidor do Resend e está na fila de disparo.")
        server.quit()
        return True

    except socket.timeout:
        print(f"❌ Erro de Limite de Tempo: A conexão com o servidor excedeu os {LIMITE_TEMPO_SEGUNDOS} segundos e foi abortada.")
    except smtplib.SMTPAuthenticationError:
        print("❌ Erro de Autenticação: O usuário ou a senha (API Key) do Resend estão incorretos.")
    except smtplib.SMTPConnectError:
        print("❌ Erro de Conexão: Não foi possível conectar ao servidor SMTP. Verifique o endereço e a porta.")
    except Exception as e:
        print(f"❌ Erro inesperado durante o envio: {str(e)}")
        
    return False

if __name__ == "__main__":
    testar_envio_smtp()