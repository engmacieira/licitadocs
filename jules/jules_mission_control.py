import json
import os
import re
import sys
import subprocess
from pathlib import Path
from datetime import datetime

from jules_core import iniciar_sessao_jules

# --- CONFIGURAÇÕES DE CAMINHO ---
INSTRUCTIONS_FILE = "jules/instrucoes_jules.md"
BACKEND_COV_JSON = "coverage.json" 
FRONTEND_COV_JSON = "frontend/coverage/coverage-summary.json"
ROOT_DIR = Path(__file__).parent.parent
MAIN_API_FILE = "app/main.py"

# ==========================================
# 📊 FASE 01: COBERTURA DE TESTES
# ==========================================
def get_jules_thresholds():
    try:
        content = Path(INSTRUCTIONS_FILE).read_text(encoding="utf-8")
        metrics_match = re.search(r"Meta Global.*(\d{2})%.*Meta por Arquivo.*(\d{2})%", content)
        if metrics_match:
            return int(metrics_match.group(1)), int(metrics_match.group(2))
        return 90, 80
    except Exception as e:
        print(f"⚠️ Erro ao ler metas: {e}. A usar 90/80.")
        return 90, 80

def analyze_backend():
    if not os.path.exists(BACKEND_COV_JSON): return []
    with open(BACKEND_COV_JSON) as f: 
        data = json.load(f)
    _, file_min = get_jules_thresholds()
    critical = []
    for f_path, info in data.get("files", {}).items():
        percent = info.get("summary", {}).get("percent_covered", 0)
        if percent < file_min:
            critical.append({"path": f_path, "percent": percent, "missing": info.get("missing_lines", [])})
    return critical

def analyze_frontend():
    if not os.path.exists(FRONTEND_COV_JSON): return []
    with open(FRONTEND_COV_JSON) as f: 
        data = json.load(f)
    _, file_min = get_jules_thresholds()
    critical = []
    for f_path, metrics in data.items():
        if f_path == "total": continue
        percent = metrics.get("lines", {}).get("pct", 0)
        if isinstance(percent, (int, float)) and percent < file_min:
            critical.append({"path": f_path, "percent": percent})
    return critical

def gerar_briefing_cobertura():
    """Analisa a cobertura e retorna as instruções para o Jules."""
    print("📊 [Jules 01] Coletando métricas de Cobertura...")
    b_issues = analyze_backend()
    f_issues = analyze_frontend()
    
    briefing = ""
    if b_issues:
        lista_b = "\n".join([f"- {i['path']} ({i['percent']}%) | Faltam: {i.get('missing')}" for i in b_issues])
        briefing += f"\n**Aumentar Cobertura Backend (Python/Pytest):**\n{lista_b}\n"
    if f_issues:
        lista_f = "\n".join([f"- {i['path']} ({i['percent']}%)" for i in f_issues])
        briefing += f"\n**Aumentar Cobertura Frontend (React/Vitest):**\n{lista_f}\n"
        
    return briefing

# ==========================================
# 🛡️ FASE 02: AUDITORIA DE SEGURANÇA
# ==========================================
def obter_arquivos_modificados():
    try:
        output = subprocess.check_output(
            ["git", "diff", "--name-only", "HEAD~1", "HEAD"], 
            text=True
        )
        return [linha.strip() for linha in output.splitlines() if linha.strip()]
    except subprocess.CalledProcessError:
        return []

def gerar_briefing_auditoria():
    """Verifica os arquivos alterados e retorna as instruções de auditoria."""
    print("🛡️ [Jules 02] Levantando arquivos para Auditoria de Segurança...")
    arquivos = obter_arquivos_modificados()
    arquivos_codigo = [f for f in arquivos if f.endswith(('.py', '.ts', '.tsx', '.js'))]
    
    if not arquivos_codigo:
        return ""
        
    lista_arquivos = "\n".join([f"- {f}" for f in arquivos_codigo])
    return f"\n**Auditar Segurança e Clean Code nestes arquivos modificados:**\n{lista_arquivos}\n"

# ==========================================
# 🚀 FASE 03: GESTÃO DE RELEASE
# ==========================================
def obter_versao_atual():
    path = ROOT_DIR / MAIN_API_FILE
    if not path.exists():
        return "0.1.0"
    content = path.read_text(encoding="utf-8")
    match = re.search(r'API_VERSION\s*=\s*["\']([^"\']+)["\']', content)
    return match.group(1) if match else "0.1.0"

def gerar_briefing_release():
    """Calcula a nova versão e retorna as instruções de Release Notes."""
    print("🚀 [Jules 03] Calculando métricas de Versão e Release...")
    current_version = obter_versao_atual()
    
    try:
        commits = subprocess.check_output(["git", "log", "HEAD~1..HEAD", "--oneline"], text=True).strip()
    except subprocess.CalledProcessError:
        commits = "Melhorias gerais de sistema."

    increment = "patch" 
    if "feat:" in commits.lower(): increment = "minor"
    if "BREAKING CHANGE" in commits: increment = "major"

    v_parts = list(map(int, current_version.split('.')))
    if increment == "major": v_parts[0] += 1; v_parts[1] = 0; v_parts[2] = 0
    elif increment == "minor": v_parts[1] += 1; v_parts[2] = 0
    else: v_parts[2] += 1
    
    new_version = ".".join(map(str, v_parts))
    print(f"   🆙 Alvo de Versão: {new_version} ({increment})")

    briefing = f"""
**Gestão de Release e Documentação (v{new_version}):**
1. Atualize `API_VERSION` no arquivo `{MAIN_API_FILE}` para `{new_version}`.
2. Crie/Atualize o `docs/release-notes/v{new_version}.md` usando estes commits recentes:
   ---
   {commits}
   ---
"""
    return briefing, new_version

# ==========================================
# 🧠 ORQUESTRADOR CENTRAL (MAIN)
# ==========================================
def main():
    print("\n🌐 INICIANDO MISSION CONTROL DO JULES AI")
    
    # 1. Coleta os briefings de cada fase
    missao_cobertura = gerar_briefing_cobertura()
    missao_auditoria = gerar_briefing_auditoria()
    missao_release, nova_versao = gerar_briefing_release()

    # 2. Avalia se há trabalho a fazer
    missoes_ativas = [m for m in [missao_cobertura, missao_auditoria, missao_release] if m.strip()]
    
    if not missoes_ativas:
        print("✅ Nenhuma ação necessária. Sistema em conformidade total.")
        return

    # 3. Monta o Prompt Supremo (Mescla: Autoridade Antiga + Blindagem Atual)
    prompt_supremo = f"""
    VOCÊ É UM AGENTE DE EXECUÇÃO ATÔMICA (ENGENHEIRO SÊNIOR FULLSTACK). 
    Sua missão é completar TODAS as tarefas abaixo em um único ciclo de trabalho. 
    Não encerre a sessão ou finalize o PR sem concluir os 3 checkpoints.

    === 🛡️ REGRAS CRÍTICAS DE INFRAESTRUTURA ===
    - PROIBIÇÃO DE ALTERAÇÃO DE STACK: O LicitaDocs usa estritamente PostgreSQL.
    - É TERMINANTEMENTE PROIBIDO trocar PostgreSQL por SQLite no arquivo .env.test ou em qualquer parte do código.
    - Se um teste falhar por falta de banco de dados, reporte o erro no log, mas MANTENHA o driver Postgres intacto. Não tome atalhos técnicos.

    === 📍 PROTOCOLO DE CHECKPOINTS (MISSÕES ESPECÍFICAS) ===
    {missao_cobertura}
    {missao_auditoria}
    {missao_release}

    === 📦 REQUISITOS DE SAÍDA E COMMIT ===
    - Você DEVE entregar o resultado de todos os checkpoints acima em um único commit atômico.
    - MENSAGEM DE COMMIT OBRIGATÓRIA: "🤖 AI (Jules): Otimização Global v{nova_versao}"
    
    ATENÇÃO: Este prefixo "🤖 AI (Jules):" é o único gatilho que autoriza o deploy em produção. Se você falhar na mensagem, o sistema ficará fora do ar.
    """

    # 4. Despacha a missão para a API
    print("\n📡 Enviando Missão Unificada para a API Oficial...")
    resultado = iniciar_sessao_jules(missao_especifica=prompt_supremo)

    if resultado:
        print(f"✨ SUCESSO! Jules assumiu a missão. Sessão: {resultado.get('name')}")
        # Exporta a versão para o GitHub Actions (se necessário)
        with open(os.environ.get('GITHUB_ENV', 'env.txt'), 'a') as env_file:
            env_file.write(f"NEW_VERSION={nova_versao}\n")
    else:
        print("❌ FALHA no acionamento da missão.")

if __name__ == "__main__":
    main()