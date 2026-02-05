from fastapi import status
from io import BytesIO

def test_create_user_success(client):
    """
    Cenário: Cadastro de usuário com dados válidos e ARQUIVOS (Novo Fluxo).
    Resultado Esperado: 201 Created e retorno do ID.
    """
    # 1. Dados do Formulário (Não é JSON aninhado, são campos soltos)
    payload = {
        "email": "sucesso_upload@teste.com",
        "password": "senha_segura_123",
        "cnpj": "12.345.678/0001-90",
        "legal_name": "Empresa de Teste LTDA",
        "trade_name": "Teste SA"
    }

    # 2. Arquivos Simulados (BytesIO cria um arquivo na memória RAM)
    files = {
        'social_contract': ('contrato.pdf', b'%PDF-1.4 content...', 'application/pdf'),
        'cnpj_card': ('cnpj.pdf', b'%PDF-1.4 content...', 'application/pdf')
    }

    # 3. Envio como Multipart (data=... e files=...)
    response = client.post("/auth/register", data=payload, files=files)

    if response.status_code != 201:
        print(f"Erro Retornado: {response.json()}")

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "company_id" in data
    assert data["message"] == "Cadastro realizado!"

def test_create_user_invalid_email(client):
    """Teste de falha deve usar o endpoint novo também"""
    payload = {
        "email": "email_invalido", # Sem @
        "password": "123",
        "cnpj": "000",
        "legal_name": "X"
    }
    # Arquivos dummy para não falhar na validação de arquivo, e sim na de email
    files = {
        'social_contract': ('a.pdf', b'', 'application/pdf'),
        'cnpj_card': ('b.pdf', b'', 'application/pdf')
    }
    
    response = client.post("/auth/register", data=payload, files=files)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT