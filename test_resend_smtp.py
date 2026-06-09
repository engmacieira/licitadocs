import os
import smtplib
import socket  # Importado para capturar a exceção de timeout de rede
import httpx
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

def testar_envio_http():
    """
    Testa o envio de e-mail utilizando a API HTTP oficial do Resend.
    Elimina dependências de portas SMTP e firewalls de infraestrutura.
    """
    print("🚀 Iniciando teste de integração com o Resend via API HTTP...")

    # Coleta de variáveis conforme o padrão de segurança do projeto (Zero Guessing)
    # Nota: No Resend, a API Key é o próprio SMTP_PASSWORD que você já usa.
    api_key = os.getenv("SMTP_PASSWORD") 
    from_email = os.getenv("EMAILS_FROM_EMAIL")
    from_name = os.getenv("EMAILS_FROM_NAME", "LicitaDocs")
    to_email = os.getenv("ADMIN_EMAIL_NOTIFICATIONS")

    if not all([api_key, from_email, to_email]):
        print("❌ Erro: Variáveis SMTP_PASSWORD, EMAILS_FROM_EMAIL ou ADMIN_EMAIL_NOTIFICATIONS ausentes no .env!")
        return False

    # Configuração do Endpoint e Headers oficiais do Resend
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Payload da requisição
    payload = {
        "from": f"{from_name} <{from_email}>",
        "to": [to_email],
        "subject": "🧪 Teste de Conexão HTTP - LicitaDocs",
        "html": """
        <html>
            <body>
                <h2>Conexão via API HTTP Realizada! 🎉</h2>
                <p>Este teste valida o envio usando requisições POST, contornando bloqueios de infraestrutura do Render.</p>
            </body>
        </html>
        """
    }

    # Execução com Timeout explícito de 30 segundos
    LIMITE_TEMPO = 30
    print(f"📡 Disparando POST para {url} (Timeout: {LIMITE_TEMPO}s)...")

    try:
        with httpx.Client(timeout=LIMITE_TEMPO) as client:
            response = client.post(url, json=payload, headers=headers)
            
        # Verifica se o status code é da família de sucesso (2xx)
        if response.status_code in [200, 201]:
            print("✅ Sucesso Absoluto! O e-mail foi enviado via HTTP.")
            print(f"Resposta do Resend: {response.json()}")
            return True
        else:
            print(f"❌ Falha na API do Resend (Status Code: {response.status_code})")
            print(f"Detalhes do Erro: {response.text}")
            return False

    except httpx.TimeoutException:
        print(f"❌ Erro de Limite de Tempo: A requisição HTTP estourou o limite de {LIMITE_TEMPO}s.")
    except httpx.RequestError as exc:
        print(f"❌ Erro de Rede ao tentar conectar na API: {exc}")
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")

    return False

if __name__ == "__main__":
    testar_envio_http()