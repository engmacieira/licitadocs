import re
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# Importamos a ponte de comunicação oficial
from jules_core import iniciar_sessao_jules

# --- CONFIGURAÇÕES DE CAMINHO ---
ROOT_DIR = Path(__file__).parent.parent
MAIN_API_FILE = "app/main.py"

def obter_versao_atual():
    """Lê a versão atual diretamente do código fonte para cálculo local."""
    path = ROOT_DIR / MAIN_API_FILE
    if not path.exists():
        return "0.1.0"
    content = path.read_text(encoding="utf-8")
    match = re.search(r'API_VERSION\s*=\s*["\']([^"\']+)["\']', content)
    return match.group(1) if match else "0.1.0"

def main():
    print("\n🚀 [Jules 03] Gestão de Release e Versionamento Autónomo")
    
    current_version = obter_versao_atual()
    
    try:
        # Extrai as mensagens de commit desde a última tag/release
        commits = subprocess.check_output(
            ["git", "log", "HEAD~1..HEAD", "--oneline"], 
            text=True
        ).strip()
    except subprocess.CalledProcessError:
        commits = "Melhorias gerais de sistema."
    
    print(f"   📍 Versão Atual: {current_version}")

    # Lógica de decisão de incremento (Semântica)
    increment = "patch" 
    if "feat:" in commits.lower(): increment = "minor"
    if "BREAKING CHANGE" in commits: increment = "major"

    # Cálculo da nova versão
    v_parts = list(map(int, current_version.split('.')))
    if increment == "major": 
        v_parts[0] += 1; v_parts[1] = 0; v_parts[2] = 0
    elif increment == "minor": 
        v_parts[1] += 1; v_parts[2] = 0
    else: 
        v_parts[2] += 1
    
    new_version = ".".join(map(str, v_parts))
    print(f"   🆙 Alvo de Versão: {new_version} ({increment})")

    # Briefing da Missão para o Agente Autónomo
    missao = f"""
    Foco de Ação: Gestão de Release e Documentação de Versão

    Missão:
    1. Atualiza a constante `API_VERSION` no ficheiro `{MAIN_API_FILE}` para a nova versão: `{new_version}`.
    2. Cria um novo ficheiro de Release Notes em `docs/release-notes/v{new_version}.md`.
    
    Instruções Técnicas para o Ficheiro de Release Notes:
    - Data: {datetime.now().strftime('%d/%m/%Y')}
    - Utiliza o log de commits abaixo para redigir um resumo executivo profissional:
      --- COMMITS DA VERSÃO ---
      {commits}
      ---
    - Organiza o texto por categorias: 🚀 Novas Funcionalidades, 🐛 Correções, 🔧 Melhorias Técnicas.
    - O tom deve ser de um Tech Lead a comunicar com stakeholders.
    """

    # Aciona o Jules para aplicar as mudanças de ficheiro e gerar o markdown
    resultado = iniciar_sessao_jules(missao_especifica=missao)

    if resultado:
        # Exporta para o GITHUB_ENV para que o passo de commit do YAML possa usar a variável
        with open(os.environ.get('GITHUB_ENV', 'env.txt'), 'a') as env_file:
            env_file.write(f"NEW_VERSION={new_version}\n")
        print(f"✅ Ordem de Release despachada para v{new_version}.")

if __name__ == "__main__":
    main()