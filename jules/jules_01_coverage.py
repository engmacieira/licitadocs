import json
import os
import re
from pathlib import Path

# Importamos a nossa ponte de comunicação para a API do Jules
from jules_core import iniciar_sessao_jules

# --- CONFIGURAÇÕES DE CAMINHO ---
INSTRUCTIONS_FILE = "jules/instrucoes_jules.md"
BACKEND_COV_JSON = "coverage.json" 
FRONTEND_COV_JSON = "frontend/coverage/coverage-summary.json"

def get_jules_thresholds():
    """Lê as metas de cobertura via metadados nas instruções."""
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
    """Analisa o coverage.json gerado pelo Pytest."""
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
    """Analisa o summary do Vitest."""
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

def despachar_missao(issues, stack_name, tools_info):
    """Monta o briefing da missão e aciona o Agente."""
    if not issues:
        return

    print(f"\n⚠️ {stack_name}: Identificados {len(issues)} ficheiro(s) abaixo da meta. A preparar a missão...")
    
    # Formata a lista de problemas num formato legível
    detalhes = []
    for i in issues:
        linhas = f" | Linhas em falta: {i.get('missing')}" if 'missing' in i else ""
        detalhes.append(f"- {i['path']} ({i['percent']}%){linhas}")
        
    lista_arquivos = "\n".join(detalhes)
    
    missao = f"""
    Foco de Ação: Aumentar a Cobertura de Testes ({stack_name})

    Os seguintes ficheiros falharam em atingir a nossa meta de cobertura e precisam da tua intervenção:
    {lista_arquivos}

    Instruções Técnicas:
    1. Utiliza {tools_info} para criares ou atualizares os testes unitários.
    2. Navega até a estes ficheiros no repositório, analisa o código fonte e escreve os testes focando estritamente nas linhas em falta.
    3. Guarda os ficheiros na pasta correta (ex: /tests ou /__tests__).
    4. Confirma que a lógica não quebra os padrões do projeto antes de finalizares.
    """
    
    # Entrega a missão ao motor central
    iniciar_sessao_jules(missao_especifica=missao)

def main():
    print("\n📊 [Jules 01] Auditoria de Cobertura e Acionamento do Agente Autónomo")
    
    b_issues = analyze_backend()
    f_issues = analyze_frontend()

    if not b_issues and not f_issues:
        print("✅ Cobertura impecável! Nenhuma ação necessária.")
        return

    # Despachamos missões separadas para não confundir o Agente com contextos de Backend e Frontend ao mesmo tempo
    if b_issues:
        despachar_missao(b_issues, "Backend", "Python e Pytest")
        
    if f_issues:
        despachar_missao(f_issues, "Frontend", "React, TypeScript e Vitest")

if __name__ == "__main__":
    main()