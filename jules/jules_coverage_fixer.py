import json
import os
import re
from pathlib import Path

# --- CONFIGURAÇÕES DE CAMINHO ---
# Garantindo que os caminhos batem com os artefatos do CI
INSTRUCTIONS_FILE = "jules/instrucoes_jules.md"
BACKEND_COV_JSON = "coverage.json" 
FRONTEND_COV_JSON = "frontend/coverage/coverage-summary.json"

def get_jules_thresholds():
    """Lê as metas de cobertura via metadados para evitar erros de Regex em texto."""
    try:
        content = Path(INSTRUCTIONS_FILE).read_text()
        # Busca especificamente o bloco de metadados que criamos
        metrics_match = re.search(r"JULES_METRICS: GLOBAL_TARGET=(\d+), FILE_TARGET=(\d+)", content)
        
        if metrics_match:
            global_target = int(metrics_match.group(1))
            file_target = int(metrics_match.group(2))
            return global_target, file_target
        
        # Fallback de segurança caso o arquivo de instruções esteja corrompido
        return 90, 80 
    except Exception as e:
        print(f"⚠️ Erro ao ler instruções: {e}. Usando padrões (90/80).")
        return 90, 80

def analyze_backend():
    """Analisa o JSON do Pytest-cov e identifica arquivos críticos."""
    if not os.path.exists(BACKEND_COV_JSON):
        print(f"❌ Arquivo {BACKEND_COV_JSON} não encontrado.")
        return []
    
    with open(BACKEND_COV_JSON) as f:
        data = json.load(f)
    
    _, file_min = get_jules_thresholds()
    critical_files = []
    
    # Estrutura padrão do pytest-cov JSON
    for file_path, info in data.get("files", {}).items():
        percent = info.get("summary", {}).get("percent_covered", 0)
        if percent < file_min:
            # Captura linhas faltantes para ajudar o Jules a criar o teste exato
            missing = info.get("missing_lines", [])
            critical_files.append({"path": file_path, "percent": percent, "missing": missing})
            
    return critical_files

def analyze_frontend():
    """Analisa o json-summary do Vitest e identifica arquivos críticos."""
    if not os.path.exists(FRONTEND_COV_JSON):
        print(f"❌ Arquivo {FRONTEND_COV_JSON} não encontrado.")
        return []
    
    with open(FRONTEND_COV_JSON) as f:
        data = json.load(f)
    
    _, file_min = get_jules_thresholds()
    critical_files = []
    
    # O Vitest json-summary tem uma chave para cada arquivo e uma chave 'total'
    for file_path, metrics in data.items():
        if file_path == "total":
            continue
            
        # No Vitest, verificamos a porcentagem de linhas (lines)
        percent = metrics.get("lines", {}).get("pct", 0)
        
        # Vitest às vezes retorna "Unknown" ou 0 para arquivos vazios
        if isinstance(percent, (int, float)) and percent < file_min:
            critical_files.append({"path": file_path, "percent": percent})
            
    return critical_files

def generate_ai_tests(file_info, tech_stack):
    """Stub para a integração com a Jules API."""
    print(f"🤖 Jules ({tech_stack}): Analisando {file_info['path']} ({file_info['percent']}%)...")
    # Aqui chamaremos a API enviando o conteúdo do arquivo e as regras de ouro
    pass

def main():
    print("\n🚀 Iniciando Auditoria de Cobertura do Jules...")
    g_target, f_target = get_jules_thresholds()
    print(f"🎯 Metas Atuais: Global {g_target}% | Por Arquivo {f_target}%")

    # Auditoria Backend
    backend_issues = analyze_backend()
    if backend_issues:
        print(f"⚠️ Backend: {len(backend_issues)} arquivos abaixo da meta.")
        for issue in backend_issues:
            generate_ai_tests(issue, "Python/Pytest")
    else:
        print("✅ Backend está dentro dos padrões!")

    # Auditoria Frontend
    frontend_issues = analyze_frontend()
    if frontend_issues:
        print(f"⚠️ Frontend: {len(frontend_issues)} arquivos abaixo da meta.")
        for issue in frontend_issues:
            generate_ai_tests(issue, "React/Vitest")
    else:
        print("✅ Frontend está dentro dos padrões!")

if __name__ == "__main__":
    main()