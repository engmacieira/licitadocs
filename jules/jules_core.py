import os
import sys
import requests
from pathlib import Path

# --- CONFIGURAÇÕES DE CAMINHO ---
ROOT_DIR = Path(__file__).parent.parent
REGRAS_FILE = ROOT_DIR / "docs" / "00REGRAS_CODIGO.md"
INSTRUCOES_FILE = ROOT_DIR / "jules" / "instrucoes_jules.md" 

# --- CREDENCIAIS E API OFICIAL ---
JULES_API_KEY = os.environ.get("JULES_API_KEY")
BASE_URL = "https://jules.googleapis.com/v1alpha"

REPO_OWNER = "engmacieira"
REPO_NAME = "licitadocs"

def _ler_arquivo_contexto(caminho: Path, nome_amigavel: str) -> str:
    """Lê arquivos de diretrizes para garantir a 'personalidade' do Jules."""
    if not caminho.exists():
        print(f"🚨 AVISO (Core): {nome_amigavel} não encontrado em {caminho}")
        return ""
    try:
        return caminho.read_text(encoding="utf-8")
    except Exception as e:
        print(f"🚨 ERRO ao ler {nome_amigavel}: {e}")
        return ""

def iniciar_sessao_jules(missao_especifica: str, branch: str = "main"):
    """
    Cria uma sessão autônoma fundindo as Regras, Instruções e a Missão.
    """
    if not JULES_API_KEY:
        print("❌ ERRO: JULES_API_KEY não encontrada nos Secrets do GitHub.")
        return None

    headers = {
        "x-goog-api-key": JULES_API_KEY,
        "Content-Type": "application/json"
    }

    # Coletamos todo o cérebro do projeto
    regras = _ler_arquivo_contexto(REGRAS_FILE, "00REGRAS_CODIGO.md")
    instrucoes = _ler_arquivo_contexto(INSTRUCOES_FILE, "instrucoes_jules.md")
    
    # O prompt final é a fusão de toda a inteligência local
    prompt_final = f"""
    VOCÊ É UM ENGENHEIRO SÊNIOR DO PROJETO LICITADOCS.
    
    === DIRETRIZES DE CÓDIGO (00REGRAS_CODIGO.md) ===
    {regras}
    
    === INSTRUÇÕES DE PROCESSO (instrucoes_jules.md) ===
    {instrucoes}
    
    === SUA TAREFA IMEDIATA ===
    {missao_especifica}
    """
    # O formato que você validou com sucesso:
    source_identificador = f"sources/github/{REPO_OWNER}/{REPO_NAME}"

    payload = {
        "prompt": prompt_final,
        "sourceContext": {
            "source": source_identificador,
            "githubRepoContext": {
                "startingBranch": branch
            }
        }
    }

    try:
        print(f"🔌 Acionando Agente Jules no repositório {REPO_NAME}...")
        response = requests.post(f"{BASE_URL}/sessions", headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            dados = response.json()
            print(f"✅ Sessão criada: {dados.get('name')}")
            return dados
        else:
            print(f"🚨 Erro na API Jules ({response.status_code}): {response.text}")
            return None
            
    except Exception as e:
        print(f"⚠️ Falha de comunicação: {e}")
        return None