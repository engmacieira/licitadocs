import re
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime
import google.generativeai as genai

# Importando o Cérebro do Jules
from jules_core import build_jules_system_prompt

ROOT_DIR = Path(__file__).parent.parent
MAIN_API_FILE = ROOT_DIR / "app" / "main.py"
RELEASE_NOTES_DIR = ROOT_DIR / "docs" / "release-notes"

GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

def gerar_release_notes_com_ia(commits_crus, versao):
    """Pede ao Jules para formatar o log do Git em um Changelog legível."""
    if not GEMINI_KEY:
        return commits_crus # Fallback para o texto cru se não houver API
        
    print("   🧠 Jules: Redigindo as Notas de Release...")
    system_prompt = build_jules_system_prompt()
    
    user_prompt = f"""
    Aja como Tech Lead e escreva o Release Notes para a versão v{versao}.
    
    Aqui estão as mensagens de commit brutas desta release:
    {commits_crus}
    
    FORMATAÇÃO EXIGIDA:
    Escreva um Markdown limpo. Agrupe os itens logicamente (ex: 🚀 Novas Funcionalidades, 🐛 Correções de Bugs, 🔧 Melhorias Técnicas).
    Seja breve, profissional e direto. NÃO use blocos de código (```markdown), retorne apenas o texto final.
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_prompt)
        response = model.generate_content(user_prompt)
        return response.text.strip()
    except Exception as e:
        print(f"   ⚠️ Erro ao gerar notas com IA: {e}")
        return commits_crus # Fallback

def main():
    print("\n🚀 [Jules 03] Iniciando Gestão de Release e Versão...")
    RELEASE_NOTES_DIR.mkdir(parents=True, exist_ok=True)
    
    if not MAIN_API_FILE.exists():
        print(f"❌ Erro: Arquivo {MAIN_API_FILE} não encontrado.")
        sys.exit(1)

    content = MAIN_API_FILE.read_text(encoding="utf-8")
    version_match = re.search(r'API_VERSION\s*=\s*["\']([^"\']+)["\']', content)
    current_version = version_match.group(1) if version_match else "0.1.0"
    
    try:
        # Pega os commits desde o último merge
        commits = subprocess.check_output(["git", "log", "HEAD~1..HEAD", "--oneline"]).decode()
    except subprocess.CalledProcessError:
        commits = "feat: atualizações automáticas de infraestrutura"
    
    print(f"   📍 Versão Atual: {current_version}")

    # Lógica de decisão de incremento
    increment = "patch" 
    if "feat:" in commits.lower(): increment = "minor"
    if "BREAKING CHANGE" in commits: increment = "major"

    v_parts = list(map(int, current_version.split('.')))
    if increment == "major": v_parts[0] += 1; v_parts[1] = 0; v_parts[2] = 0
    elif increment == "minor": v_parts[1] += 1; v_parts[2] = 0
    else: v_parts[2] += 1
    
    new_version = ".".join(map(str, v_parts))
    print(f"   🆙 Nova Versão Definida: {new_version}")

    # 1. Atualiza a versão no main.py
    new_content = re.sub(r'API_VERSION\s*=\s*["\'][^"\']+["\']', f'API_VERSION = "{new_version}"', content)
    MAIN_API_FILE.write_text(new_content, encoding="utf-8")

    # 2. Gera e salva as Notas de Release (Agora com IA!)
    texto_formatado = gerar_release_notes_com_ia(commits, new_version)
    
    release_file = RELEASE_NOTES_DIR / f"v{new_version}.md"
    cabecalho = f"# 📦 Release Notes - v{new_version}\n**Data:** {datetime.now().strftime('%d/%m/%Y')}\n\n"
    release_file.write_text(cabecalho + texto_formatado, encoding="utf-8")
    print(f"   📝 Notas de release salvas em: docs/release-notes/v{new_version}.md")
    
    # 3. BUG CORRIGIDO: Exportando a nova versão para o GitHub Actions
    with open(os.environ.get('GITHUB_ENV', 'env.txt'), 'a') as env_file:
        env_file.write(f"NEW_VERSION={new_version}\n")

if __name__ == "__main__":
    main()