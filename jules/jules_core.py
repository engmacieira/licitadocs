import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
REGRAS_FILE = ROOT_DIR / "docs" / "00REGRAS_CODIGO.md"
INSTRUCOES_FILE = ROOT_DIR / "jules" / "instrucoes_jules.md"

def _ler_arquivo_seguro(caminho: Path, nome_amigavel: str) -> str:
    """Lê um arquivo garantindo que falhas sejam avisadas visualmente no log do CI."""
    if not caminho.exists():
        print(f"🚨 AVISO CRÍTICO (Core): Arquivo {nome_amigavel} não encontrado no caminho:\n-> {caminho}")
        # Retorna um texto que força a IA a avisar que está sem instruções
        return f"[ERRO GRAVE: {nome_amigavel} INACESSÍVEL. SOLICITE INTERVENÇÃO HUMANA IMEDIATA.]"
    
    try:
        return caminho.read_text(encoding="utf-8")
    except Exception as e:
        print(f"🚨 ERRO (Core) ao ler {nome_amigavel}: {e}")
        return f"[ERRO AO LER {nome_amigavel}]"

def build_jules_system_prompt(contexto_tarefa: str = "") -> str:
    """
    Constrói a base de conhecimento (Constituição) do Jules.
    Aceita um 'contexto_tarefa' opcional para refinar o comportamento.
    """
    regras = _ler_arquivo_seguro(REGRAS_FILE, "00REGRAS_CODIGO.md")
    instrucoes = _ler_arquivo_seguro(INSTRUCOES_FILE, "instrucoes_jules.md")
    
    stack_tecnologico = """
    === TECH STACK OFICIAL DO PROJETO ===
    - Backend: Python 3.11+, FastAPI, SQLAlchemy, Pytest.
    - Frontend: React, TypeScript, Vite, Vitest, TailwindCSS.
    - Infra: Docker, GitHub Actions, AWS EC2.
    """

    system_prompt = f"""
    Você é Jules, o Agente de QA Automatizado do projeto LicitaDocs.
    Sua missão é otimizar código, aplicar boas práticas e garantir resiliência.

    {stack_tecnologico}

    Antes de gerar qualquer análise ou código, você DEVE processar e obedecer rigorosamente as diretrizes abaixo:

    === A DIRETRIZ SUPREMA ===
    {regras}

    === METAS DA ESTEIRA (CI/CD) ===
    {instrucoes}
    """
    
    # Se o script que chamou quiser injetar regras específicas daquela fase
    if contexto_tarefa:
        system_prompt += f"\n\n=== CONTEXTO ESPECÍFICO DESTA TAREFA ===\n{contexto_tarefa}\n"

    return system_prompt