import re
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).parent.parent
MAIN_API_FILE = ROOT_DIR / "app" / "main.py"
RELEASE_NOTES_DIR = ROOT_DIR / "docs" / "release-notes"

def main():
    print("\n🚀 [Jules 03] Iniciando Gestão de Release e Versão...")
    RELEASE_NOTES_DIR.mkdir(parents=True, exist_ok=True)
    
    if not MAIN_API_FILE.exists():
        print(f"❌ Erro: Arquivo {MAIN_API_FILE} não encontrado.")
        sys.exit(1)

    content = MAIN_API_FILE.read_text()
    version_match = re.search(r'API_VERSION\s*=\s*["\']([^"\']+)["\']', content)
    current_version = version_match.group(1) if version_match else "0.1.0"
    
    try:
        commits = subprocess.check_output(["git", "log", "HEAD~1..HEAD", "--oneline"]).decode()
    except subprocess.CalledProcessError:
        commits = "feat: atualizações automáticas do Jules"
    
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

    new_content = re.sub(r'API_VERSION\s*=\s*["\'][^"\']+["\']', f'API_VERSION = "{new_version}"', content)
    MAIN_API_FILE.write_text(new_content)

    release_file = RELEASE_NOTES_DIR / f"v{new_version}.md"
    release_content = f"# Release Notes - v{new_version}\n\n**Data:** {datetime.now().strftime('%d/%m/%Y')}\n\n## Alterações:\n{commits}"
    release_file.write_text(release_content)
    
    # Exportar a nova versão para o GitHub Actions ler depois (se necessário)
    with open(os.environ.get('GITHUB_ENV', 'env.txt'), 'a') as env_file:
        env_file.write(f"NEW_VERSION={new_version}\n")

if __name__ == "__main__":
    main()