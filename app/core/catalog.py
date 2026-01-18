"""
Catálogo oficial de documentos suportados pela plataforma.
Serve como 'Contexto' para a Inteligência Artificial.
"""

DOCUMENT_CATALOG = [
    {
        "nome": "CND Federal",
        "descricao": "Certidão Negativa de Débitos Relativos a Créditos Tributários Federais e à Dívida Ativa da União.",
        "sinonimos": ["Certidão da Receita", "Prova de Regularidade Fiscal Federal", "CND da União", "Certidão de Tributos Federais"]
    },
    {
        "nome": "CND Trabalhista (CNDT)",
        "descricao": "Certidão Negativa de Débitos Trabalhistas.",
        "sinonimos": ["Prova de inexistência de débitos inadimplidos perante a Justiça do Trabalho", "Regularidade Trabalhista"]
    },
    {
        "nome": "CRF do FGTS",
        "descricao": "Certificado de Regularidade do FGTS.",
        "sinonimos": ["Certidão da Caixa", "Prova de regularidade com o Fundo de Garantia", "Situação regular perante o FGTS"]
    },
    {
        "nome": "Certidão de Falência e Concordata",
        "descricao": "Certidão dos distribuidores cíveis que comprova que a empresa não faliu.",
        "sinonimos": ["Certidão de Distribuição Cível", "Nada Consta de Falência", "Plano de Recuperação Judicial"]
    },
    {
        "nome": "Atestado de Capacidade Técnica",
        "descricao": "Documento emitido por pessoa jurídica de direito público ou privado que comprova aptidão de desempenho anterior.",
        "sinonimos": ["Atestado de desempenho", "Comprovação de aptidão", "Atestado de fornecimento anterior"]
    },
    {
        "nome": "Balanço Patrimonial",
        "descricao": "Demonstrativo contábil que apresenta a posição financeira e econômica da empresa.",
        "sinonimos": ["Demonstrações Contábeis", "Balanço do último exercício", "BP"]
    },
    {
        "nome": "Declaração de Empregador (Menor)",
        "descricao": "Declaração de que não emprega menor de 18 anos em trabalho noturno, perigoso ou insalubre e não emprega menor de 16 anos.",
        "sinonimos": ["Cumprimento do disposto no inciso XXXIII do art. 7º da Constituição", "Declaração de Menores", "Declaração Art. 7 CF"]
    },
    {
        "nome": "Declaração de Elaboração Independente de Proposta",
        "descricao": "Documento onde a empresa declara que fez sua proposta sem combinar preços com concorrentes.",
        "sinonimos": ["Declaração de proposta independente", "Não conluio"]
    }
]

def get_catalog_as_text() -> str:
    """
    Formata o catálogo como um texto legível para o Prompt da IA.
    """
    text = "LISTA DE DOCUMENTOS DISPONÍVEIS NO SISTEMA:\n"
    for doc in DOCUMENT_CATALOG:
        text += f"- NOME PADRÃO: {doc['nome']}\n"
        text += f"  DESCRIÇÃO: {doc['descricao']}\n"
        text += f"  TERMOS COMUNS EM EDITAIS: {', '.join(doc['sinonimos'])}\n\n"
    return text