import subprocess
import sys
import os
from pathlib import Path
import google.generativeai as genai

# Importando o Cérebro do Jules
from jules_core import build_jules_system_prompt

GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

def obter_arquivos_modificados():
    """Lê o Git Diff para descobrir o que mudou no último commit."""
    try:
        output = subprocess.check_output(
            ["git", "diff", "--name-only", "HEAD~1", "HEAD"], 
            text=True
        )
        return [linha.strip() for linha in output.splitlines() if linha.strip()]
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Aviso: Não foi possível ler o histórico do Git. Detalhes: {e}")
        return []

def auditar_arquivo_com_ia(arquivo_path, codigo_original):
    """Monta o contexto e chama a API do Gemini para auditar e corrigir o código."""
    if not GEMINI_KEY:
        print("❌ Erro: GEMINI_API_KEY não configurada no ambiente.")
        return False

    print(f"   🧠 Jules: Auditando {arquivo_path}...")
    
    system_prompt = build_jules_system_prompt()
    
    user_prompt = f"""
    Analise o código abaixo ({arquivo_path}).
    
    Sua tarefa é focar EXCLUSIVAMENTE nas seguintes diretrizes:
    1. 🛡️ Segurança: Identifique condições de corrida (race conditions), falhas de sanitização, vazamento de dados ou vulnerabilidades graves.
    2. 📝 Clean Code: Verifique a ausência ou inconsistência de Docstrings (Python) ou JSDoc (TypeScript).
    
    Se o código estiver TOTALMENTE seguro e perfeitamente documentado, retorne EXATAMENTE E APENAS a string: "STATUS: APROVADO".
    
    Se houver qualquer problema crítico de segurança ou falta de documentação, CORRIJA o código e retorne APENAS o código corrigido na íntegra.
    NÃO inclua blocos de markdown (```), explicações, ou o texto 'Aqui está o código'. Retorne apenas o código puro para que não quebre o arquivo na hora de salvar.
    
    === CÓDIGO FONTE ===
    {codigo_original}
    """
    
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt
        )
        
        response = model.generate_content(user_prompt)
        resposta = response.text.strip()
        
        # O modelo decidiu que está tudo OK
        if "STATUS: APROVADO" in resposta:
            print(f"   ✅ {arquivo_path}: Seguro e documentado!")
            return False 
        
        # O modelo encontrou erros e retornou o código corrigido
        else:
            print(f"   🔧 {arquivo_path}: Otimizações aplicadas pelo Jules! Sobrescrevendo...")
            Path(arquivo_path).write_text(resposta, encoding="utf-8")
            return True 
            
    except Exception as e:
        print(f"   ⚠️ Erro ao consultar IA para {arquivo_path}: {e}")
        return False

def auditar_seguranca_e_docs(arquivos):
    """Filtra os arquivos relevantes e passa pela auditoria da IA."""
    arquivos_codigo = [f for f in arquivos if f.endswith(('.py', '.ts', '.tsx', '.js'))]
    
    if not arquivos_codigo:
        print("✅ Nenhum arquivo de código fonte modificado. Auditoria ignorada.")
        return

    print(f"🔎 Analisando {len(arquivos_codigo)} arquivo(s) modificado(s)...")
    arquivos_com_alerta = []

    for arquivo in arquivos_codigo:
        path = Path(arquivo)
        if not path.exists():
            continue 
            
        try:
            codigo_original = path.read_text(encoding="utf-8")
            encontrou_problema = auditar_arquivo_com_ia(arquivo, codigo_original)
            
            if encontrou_problema:
                arquivos_com_alerta.append(arquivo)
                
        except Exception as e:
             print(f"   ⚠️ Erro ao ler {arquivo}: {e}")
        
    if arquivos_com_alerta:
        print(f"\n🚨 O Jules otimizou/corrigiu {len(arquivos_com_alerta)} arquivo(s) modificado(s).")
    else:
        print("\n✅ Auditoria concluída: Nenhuma vulnerabilidade ou falha de documentação encontrada!")

def main():
    print("\n🛡️ [Jules 02] Iniciando Auditoria de Segurança e Clean Code...")
    arquivos_alterados = obter_arquivos_modificados()
    
    if not arquivos_alterados:
        print("ℹ️ Nenhum arquivo retornado pelo Git Diff.")
        return
        
    auditar_seguranca_e_docs(arquivos_alterados)

if __name__ == "__main__":
    main()