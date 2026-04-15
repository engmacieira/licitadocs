import subprocess
import sys
from pathlib import Path

# Importando o Cérebro do Jules
from jules_core import build_jules_system_prompt

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
    """Monta o contexto e chama a API do Gemini para auditar o código."""
    print(f"   🧠 Jules: Auditando {arquivo_path}...")
    
    # 1. Carrega a Constituição do projeto
    system_prompt = build_jules_system_prompt()
    
    # 2. Monta a requisição focada em Segurança e Docs
    user_prompt = f"""
    Analise o código abaixo ({arquivo_path}).
    
    Sua tarefa é focar EXCLUSIVAMENTE nas seguintes diretrizes:
    1. 🛡️ Segurança: Identifique condições de corrida (race conditions), falhas de sanitização, vazamento de dados ou vulnerabilidades graves.
    2. 📝 Clean Code: Verifique a ausência ou inconsistência de Docstrings (Python) ou JSDoc (TypeScript).
    
    Se houver problemas críticos, forneça o código corrigido.
    Se o código estiver seguro e bem documentado, retorne apenas: "STATUS: APROVADO".
    
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
    
    # Para o esqueleto, vamos simular que a IA aprovou o código
    resposta_simulada = "STATUS: APROVADO" 
    print(f"   ✅ [Simulação] Análise concluída: {resposta_simulada}")
    
    # Retorna True se encontrou erro (não aprovado), False se passou
    return "STATUS: APROVADO" not in resposta_simulada

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
            continue # Arquivo foi deletado ou renomeado, ignoramos
            
        try:
            codigo_original = path.read_text(encoding="utf-8")
            
            # Chama a função que fala com a IA
            encontrou_problema = auditar_arquivo_com_ia(arquivo, codigo_original)
            
            if encontrou_problema:
                arquivos_com_alerta.append(arquivo)
                
        except Exception as e:
             print(f"   ⚠️ Erro ao ler {arquivo}: {e}")
        
    if arquivos_com_alerta:
        print(f"\n🚨 O Jules encontrou pendências de documentação ou segurança em {len(arquivos_com_alerta)} arquivo(s).")
        # Futuramente, podemos dar sys.exit(1) aqui para quebrar o CI se a vulnerabilidade for grave
    else:
        print("\n✅ Auditoria concluída: Nenhuma vulnerabilidade crítica ou falha de documentação encontrada!")

def main():
    print("\n🛡️ [Jules 02] Iniciando Auditoria de Segurança e Clean Code...")
    arquivos_alterados = obter_arquivos_modificados()
    
    if not arquivos_alterados:
        print("ℹ️ Nenhum arquivo retornado pelo Git Diff.")
        return
        
    auditar_seguranca_e_docs(arquivos_alterados)

if __name__ == "__main__":
    main()