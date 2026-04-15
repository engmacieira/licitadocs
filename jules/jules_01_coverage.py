import json
import os
import re
from pathlib import Path

# Importando o Cérebro do Jules
from jules_core import build_jules_system_prompt

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
        
        return 90, 80 # Fallback padrão
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
    """Monta o contexto e chama a API do Gemini para gerar testes."""
    
    print(f"\n🧠 Jules ({tech_stack}): Analisando {file_info['path']} ({file_info['percent']}%)")
    
    # 1. Carrega a Constituição do projeto
    system_prompt = build_jules_system_prompt()
    
    # 2. Prepara os dados específicos do arquivo
    linhas_faltantes = file_info.get("missing", "Não detalhado")
    
    # Lendo o código fonte original para enviar à IA
    try:
        codigo_original = Path(file_info['path']).read_text(encoding="utf-8")
    except Exception as e:
        print(f"   ⚠️ Não foi possível ler o arquivo original: {e}")
        return

    # 3. Monta a requisição do usuário (User Prompt)
    user_prompt = f"""
    Analise o código abaixo ({file_info['path']}). A cobertura atual é de {file_info['percent']}%.
    As seguintes linhas estão descobertas (missing lines): {linhas_faltantes}.
    
    Gere os testes unitários necessários usando {tech_stack} focando estritamente em cobrir essas linhas.
    Siga a regra de imutabilidade: não altere nomes de variáveis que vêm de fora.
    
    === CÓDIGO FONTE ===
    {codigo_original}
    """
    
    # TODO: Implementar Google GenAI SDK
    # print("   ⏳ Chamando a API do Gemini...")
    # response = gemini_client.models.generate_content(
    #     model='gemini-2.5-flash',
    #     contents=user_prompt,
    #     config=types.GenerateContentConfig(system_instruction=system_prompt)
    # )
    
    print(f"   ✅ [Simulação] Testes gerados em memória para as linhas {linhas_faltantes}.")
    # Aqui entrará a lógica de salvar o arquivo gerado na pasta de testes apropriada.

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