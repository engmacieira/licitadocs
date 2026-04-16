import os
import requests
from datetime import datetime

def rodar_teste_de_loop():
    print("🧪 [LABORATÓRIO] Iniciando Teste Rápido de Loop CI/CD...")
    
    api_key = os.environ.get("JULES_API_KEY")
    if not api_key:
        print("❌ Erro: JULES_API_KEY não encontrada no ambiente.")
        return

    url = "https://jules.googleapis.com/v1alpha/sessions"
    
    # Geramos um timestamp para garantir que o commit seja sempre único
    agora = datetime.now().strftime('%H:%M:%S')
    
    prompt = f"""
    VOCÊ ESTÁ EM MODO DE TESTE DE INFRAESTRUTURA.
    NÃO ALTERE NENHUM CÓDIGO FONTE.
    
    Sua missão:
    1. Crie ou atualize um arquivo chamado `docs/jules_ping.md`.
    2. Escreva dentro dele a seguinte frase: "# Conexão Aceita às {agora}".
    3. Faça o commit dessa alteração no repositório.
    
    MENSAGEM DE COMMIT OBRIGATÓRIA: 
    🤖 AI (Jules): Teste de Fluxo CI/CD
    """

    payload = {
        "prompt": prompt,
        "sourceContext": {
            "source": "sources/github/engmacieira/licitadocs",
            "githubRepoContext": {"startingBranch": "main"}
        }
    }

    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
    
    try:
        print("📡 Enviando missão de teste para a Google...")
        res = requests.post(url, headers=headers, json=payload)
        
        if res.status_code == 200:
            print(f"✅ SUCESSO! Jules assumiu a missão. Sessão: {res.json().get('name')}")
            print("⏳ Aguarde o Jules processar e fazer o commit no GitHub para ver se o Deploy aciona.")
        else:
            print(f"❌ Falha ao despachar missão: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"⚠️ Exceção de rede: {e}")

if __name__ == "__main__":
    rodar_teste_de_loop()