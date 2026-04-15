import subprocess
from pathlib import Path

# Importamos a nossa ponte de comunicação para a API do Jules
from jules_core import iniciar_sessao_jules

def obter_arquivos_modificados():
    """Lê o Git Diff para descobrir o que mudou no último commit."""
    try:
        # Extrai os ficheiros alterados no commit mais recente
        output = subprocess.check_output(
            ["git", "diff", "--name-only", "HEAD~1", "HEAD"], 
            text=True
        )
        return [linha.strip() for linha in output.splitlines() if linha.strip()]
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Aviso: Não foi possível ler o histórico do Git. Detalhes: {e}")
        return []

def main():
    print("\n🛡️ [Jules 02] A iniciar Auditoria de Segurança e Clean Code...")
    
    arquivos_alterados = obter_arquivos_modificados()
    
    # Filtramos apenas os ficheiros de código que nos interessam
    arquivos_codigo = [f for f in arquivos_alterados if f.endswith(('.py', '.ts', '.tsx', '.js'))]
    
    if not arquivos_codigo:
        print("✅ Nenhum ficheiro de código fonte modificado. Auditoria ignorada.")
        return

    print(f"🔎 O Git reportou {len(arquivos_codigo)} ficheiro(s) modificado(s). A acionar o Agente...")
    
    # Preparamos a lista de ficheiros para o briefing da missão
    lista_arquivos = "\n".join([f"- {f}" for f in arquivos_codigo])
    
    missao = f"""
    Foco de Ação: Auditoria de Segurança e Qualidade de Código (Clean Code)

    Os seguintes ficheiros foram modificados recentemente na nossa base de código e requerem a tua auditoria:
    {lista_arquivos}

    Instruções Técnicas:
    1. Faz o checkout e analisa o conteúdo destes ficheiros específicos no repositório.
    2. 🛡️ Segurança: Procura ativamente por condições de corrida (race conditions), falhas de sanitização, fugas de dados ou vulnerabilidades arquiteturais.
    3. 📝 Clean Code: Verifica a ausência ou inconsistência de Docstrings (Python) ou JSDoc (TypeScript). Se faltar documentação ou estiver desatualizada, adiciona-a.
    4. Aplica todas as correções e otimizações diretamente nos ficheiros.
    5. Importante: Se o ficheiro estiver perfeitamente seguro e documentado, não faças nenhuma alteração.
    """

    # Entregamos a missão ao Agente Oficial
    iniciar_sessao_jules(missao_especifica=missao)

if __name__ == "__main__":
    main()