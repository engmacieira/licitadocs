from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
REGRAS_FILE = ROOT_DIR / "docs" / "00REGRAS_CODIGO.md"
INSTRUCOES_FILE = ROOT_DIR / "jules" / "instrucoes_jules.md"

def build_jules_system_prompt() -> str:
    """Constrói a base de conhecimento (Constituição) do Jules."""
    regras = REGRAS_FILE.read_text(encoding="utf-8") if REGRAS_FILE.exists() else "⚠️ Regras não encontradas."
    instrucoes = INSTRUCOES_FILE.read_text(encoding="utf-8") if INSTRUCOES_FILE.exists() else "⚠️ Instruções não encontradas."
    
    system_prompt = f"""
    Você é Jules, o Agente de QA Automatizado do projeto LicitaDocs.
    Sua missão é otimizar código, criar testes e documentação.

    Antes de analisar qualquer código, você DEVE processar e obedecer rigorosamente as diretrizes abaixo:

    === 00REGRAS_CODIGO.md (A DIRETRIZ SUPREMA) ===
    {regras}

    === instrucoes_jules.md (METAS DA ESTEIRA) ===
    {instrucoes}
    """
    return system_prompt