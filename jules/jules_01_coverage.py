import json
import os
import re
from pathlib import Path
import google.generativeai as genai

# Importando o Cérebro do Jules
from jules_core import build_jules_system_prompt

# --- CONFIGURAÇÕES DE CAMINHO ---
INSTRUCTIONS_FILE = "jules/instrucoes_jules.md"
BACKEND_COV_JSON = "coverage.json" 
FRONTEND_COV_JSON = "frontend/coverage/coverage-summary.json"

GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

def get_jules_thresholds():
    """Lê as metas de cobertura via metadados nas instruções."""
    try:
        content = Path(INSTRUCTIONS_FILE).read_text(encoding="utf-8")
        metrics_match = re.search(r"Meta Global.*(\d{2})%.*Meta por Arquivo.*(\d{2})%", content)
        if metrics_match:
            return int(metrics_match.group(1)), int(metrics_match.group(2))
        return 90, 80
    except Exception as e:
        print(f"⚠️ Erro ao ler metas: {e}. Usando 90/80.")
        return 90, 80

def analyze_backend():
    """Analisa o coverage.json gerado pelo Pytest."""
    if not os.path.exists(BACKEND_COV_JSON):
        print(f"❌ Artefato Backend {BACKEND_COV_JSON} não encontrado.")
        return []
    
    with open(BACKEND_COV_JSON) as f:
        data = json.load(f)
    
    _, file_min = get_jules_thresholds()
    critical_files = []
    
    for file_path, info in data.get("files", {}).items():
        percent = info.get("summary", {}).get("percent_covered", 0)
        if percent < file_min:
            missing = info.get("missing_lines", [])
            critical_files.append({"path": file_path, "percent": percent, "missing": missing})
            
    return critical_files

def analyze_frontend():
    """Analisa o summary do Vitest."""
    if not os.path.exists(FRONTEND_COV_JSON):
        print(f"❌ Artefato Frontend {FRONTEND_COV_JSON} não encontrado.")
        return []
    
    with open(FRONTEND_COV_JSON) as f:
        data = json.load(f)
    
    _, file_min = get_jules_thresholds()
    critical_files = []
    
    for file_path, metrics in data.items():
        if file_path == "total": continue
        percent = metrics.get("lines", {}).get("pct", 0)
        
        if isinstance(percent, (int, float)) and percent < file_min:
            critical_files.append({"path": file_path, "percent": percent})
            
    return critical_files

def generate_ai_tests(file_info, tech_stack):
    """Chama a API do Gemini para gerar os testes e os salva no disco."""
    if not GEMINI_KEY:
        print("❌ Erro: GEMINI_API_KEY não configurada no ambiente.")
        return

    print(f"\n🧠 Jules ({tech_stack}): Otimizando {file_info['path']} ({file_info['percent']}%)")
    
    system_prompt = build_jules_system_prompt()
    linhas_faltantes = file_info.get("missing", "Não detalhado")
    
    try:
        codigo_original = Path(file_info['path']).read_text(encoding="utf-8")
        
        # Inicializa o modelo com as instruções de sistema (Constituição)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt
        )

        prompt_usuario = f"""
        Analise o código de {file_info['path']}. Cobertura atual: {file_info['percent']}%.
        Linhas sem cobertura: {linhas_faltantes}.
        
        Gere um arquivo de teste completo usando {tech_stack}.
        RESPOSTA OBRIGATÓRIA: Retorne APENAS o código puro, sem explicações ou markdown blocks (```).
        
        === CÓDIGO ORIGINAL ===
        {codigo_original}
        """

        response = model.generate_content(prompt_usuario)
        codigo_gerado = response.text.strip()

        # Define o caminho do teste (Ex: app/models/user.py -> app/tests/test_user_jules.py)
        path_obj = Path(file_info['path'])
        test_dir = path_obj.parent.parent / "tests" if "app" in str(path_obj) else path_obj.parent / "__tests__"
        test_dir.mkdir(parents=True, exist_ok=True)
        
        test_file_name = f"test_{path_obj.stem}_jules.py" if "Python" in tech_stack else f"{path_obj.stem}.jules.test.ts"
        test_path = test_dir / test_file_name

        test_path.write_text(codigo_gerado, encoding="utf-8")
        print(f"   ✅ Teste gerado e salvo em: {test_path}")

    except Exception as e:
        print(f"   ⚠️ Falha crítica na geração de testes: {e}")

def main():
    print("\n📊 [Jules 01] Iniciando Auditoria de Cobertura...")
    g_target, f_target = get_jules_thresholds()
    
    b_issues = analyze_backend()
    f_issues = analyze_frontend()

    if not b_issues and not f_issues:
        print(f"✅ Cobertura impecável! (Meta: {f_target}%)")
    else:
        if b_issues:
            print(f"\n⚠️ Backend: {len(b_issues)} arquivos abaixo da meta.")
            for issue in b_issues:
                generate_ai_tests(issue, "Python/Pytest")
                
        if f_issues:
            print(f"\n⚠️ Frontend: {len(f_issues)} arquivos abaixo da meta.")
            for issue in f_issues:
                generate_ai_tests(issue, "React/Vitest")

if __name__ == "__main__":
    main()