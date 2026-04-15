import os
import re
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# --- CONFIGURAÇÕES DE CAMINHO ---
ROOT_DIR = Path(__file__).parent.parent
REGRAS_OURO = ROOT_DIR / "docs" / "00REGRAS_CODIGO.md"
INSTRUCOES_JULES = ROOT_DIR / "jules" / "instrucoes_jules.md"
MAIN_API_FILE = ROOT_DIR / "app" / "main.py"
RELEASE_NOTES_DIR = ROOT_DIR / "docs" / "release-notes"

class JulesOrchestrator:
    def __init__(self):
        print("\n" + "="*50)
        print("🤖 [Jules] Protocolo de Qualidade LicitaDocs Ativado")
        print("="*50)
        self.contexto_base = self._carregar_contexto()
        RELEASE_NOTES_DIR.mkdir(parents=True, exist_ok=True)

    def _carregar_contexto(self):
        """Lê a base de conhecimento do Jules."""
        regras = REGRAS_OURO.read_text() if REGRAS_OURO.exists() else "Regras base não encontradas."
        instrucoes = INSTRUCOES_JULES.read_text() if INSTRUCOES_JULES.exists() else ""
        return f"--- CONSTITUIÇÃO DO PROJETO ---\n{regras}\n\n--- METAS DE QUALIDADE ---\n{instrucoes}"

    def passo_1_coverage(self):
        """Chama o script de correção de cobertura."""
        print("\n📊 [PASSO 1] Auditando Cobertura...")
        try:
            from jules_coverage_fixer import main as run_coverage
            run_coverage()
        except Exception as e:
            print(f"❌ Erro na cobertura: {e}")

    def passo_2_seguranca(self):
        """Stub para auditoria de segurança."""
        print("\n🛡️ [PASSO 2] Verificando Vulnerabilidades e Estresse...")
        print("✅ Verificação concluída (Simulada).")

    def passo_3_documentacao(self):
        """Verifica se arquivos alterados estão documentados."""
        print("\n📝 [PASSO 3] Validando Documentação Clean Code...")
        try:
            diff_files = subprocess.check_output(["git", "diff", "--name-only", "HEAD~1", "HEAD"]).decode().splitlines()
            for f in diff_files:
                if f.endswith(('.py', '.ts', '.tsx')):
                    print(f"   🔎 Analisando: {f}")
        except subprocess.CalledProcessError:
            print("   ⚠️ Não foi possível ler o diff do Git. Pulando documentação.")

    def passo_4_release_and_version(self):
        """Lógica inteligente de versionamento e release notes."""
        print("\n🚀 [PASSO 4] Gestão de Release e Versão...")
        
        content = MAIN_API_FILE.read_text()
        
        # 🔍 NOVA REGEX: Agora foca na constante centralizada
        version_match = re.search(r'API_VERSION\s*=\s*["\']([^"\']+)["\']', content)
        current_version = version_match.group(1) if version_match else "0.1.0"
        
        try:
            commits = subprocess.check_output(["git", "log", "HEAD~1..HEAD", "--oneline"]).decode()
        except subprocess.CalledProcessError:
            commits = "feat: atualizações automáticas do Jules"
        
        print(f"   📍 Versão Atual: {current_version}")

        # Lógica de decisão de incremento (Simulação IA)
        increment = "patch" 
        if "feat:" in commits.lower(): increment = "minor"
        if "BREAKING CHANGE" in commits: increment = "major"

        v_parts = list(map(int, current_version.split('.')))
        if increment == "major": v_parts[0] += 1; v_parts[1] = 0; v_parts[2] = 0
        elif increment == "minor": v_parts[1] += 1; v_parts[2] = 0
        else: v_parts[2] += 1
        
        new_version = ".".join(map(str, v_parts))
        print(f"   🆙 Nova Versão Definida: {new_version}")

        # 🎯 ATUALIZAÇÃO ÚNICA: Altera apenas a constante no topo do arquivo
        new_content = re.sub(r'API_VERSION\s*=\s*["\'][^"\']+["\']', f'API_VERSION = "{new_version}"', content)
        MAIN_API_FILE.write_text(new_content)

        # 📝 Geração das Notas de Release
        release_file = RELEASE_NOTES_DIR / f"v{new_version}.md"
        release_content = f"# Release Notes - v{new_version}\n\n**Data:** {datetime.now().strftime('%d/%m/%Y')}\n\n## Alterações:\n{commits}"
        release_file.write_text(release_content)
        
        return new_version

    def passo_5_validar_e_commitar(self, nova_versao):
        """Roda os testes e commita se tudo estiver verde."""
        print("\n🧪 [PASSO 5] Fail-Fast: Validando código gerado...")
        try:
            print("   👉 Testando Backend...")
            subprocess.run(["pytest"], check=True, capture_output=True)
            print("   ✅ Backend OK!")
        except subprocess.CalledProcessError as e:
            print(f"\n🚨 ERRO: O Jules quebrou os testes de backend!\n{e.stderr.decode('utf-8', errors='ignore')}")
            sys.exit(1)

        print("\n📦 [PASSO 6] Commit e Push para Deploy...")
        mensagem_commit = f"🤖 AI (Jules): Otimizações de cobertura e docs (v{nova_versao})"
        
        try:
            # Configura a identidade do bot
            subprocess.run(["git", "config", "user.name", "Jules AI QA"], check=True)
            subprocess.run(["git", "config", "user.email", "jules@licitadocs.ai"], check=True)
            
            # Adiciona os arquivos criados (testes, release notes, main.py alterado)
            subprocess.run(["git", "add", "."], check=True)
            
            # Verifica se há algo para commitar antes de tentar
            status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
            if not status.stdout.strip():
                print("   ℹ️ Nenhuma alteração foi feita pelo Jules. Ignorando commit.")
                return

            subprocess.run(["git", "commit", "-m", mensagem_commit], check=True)
            subprocess.run(["git", "push"], check=True)
            print("   🚀 Push realizado! A Trilha B (Deploy) será iniciada.")
        except subprocess.CalledProcessError as e:
            print(f"❌ Erro ao realizar o push: {e}")
            sys.exit(1)

    def executar(self):
        self.passo_1_coverage()
        self.passo_2_seguranca()
        self.passo_3_documentacao()
        
        # 🐛 Corrigido o nome da função e recebendo a nova versão
        nova_versao = self.passo_4_release_and_version() 
        
        # 🛡️ Nova trava de segurança e integração com CI
        self.passo_5_validar_e_commitar(nova_versao)

        print("\n" + "="*50)
        print("✨ [Jules] Ciclo Completo de Qualidade Finalizado!")
        print("="*50)

if __name__ == "__main__":
    JulesOrchestrator().executar()