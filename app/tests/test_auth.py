from fastapi import status
from io import BytesIO

def test_create_user_success(client):
    """
    Cenário: Cadastro de usuário com dados válidos e ARQUIVOS (Novo Fluxo).
    Resultado Esperado: 201 Created e retorno do ID.
    """
    # 1. Dados do Formulário
    # Em testes multipart, dicionários simples funcionam bem, mas vamos garantir
    payload = {
        "email": "sucesso_upload@teste.com",
        "password": "senha_segura_123",
        "cnpj": "12.345.678/0001-90",
        "legal_name": "Empresa de Teste LTDA",
        "trade_name": "Teste SA"
    }

    # 2. Arquivos Simulados
    # Dica: O nome do campo (key) deve bater com o do endpoint (social_contract, cnpj_card)
    files = {
        'social_contract': ('contrato.pdf', b'%PDF-1.4 content...', 'application/pdf'),
        'cnpj_card': ('cnpj.pdf', b'%PDF-1.4 content...', 'application/pdf')
    }

    # 3. Envio
    # O segredo aqui é que data=payload envia Content-Type: multipart/form-data automaticamente
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
    
    # Precisamos enviar arquivos mesmo no teste de falha de email, 
    # senão ele falha antes dizendo "Missing Field: social_contract"
    files = {
        'social_contract': ('a.pdf', b'', 'application/pdf'),
        'cnpj_card': ('b.pdf', b'', 'application/pdf')
    }
    
    response = client.post("/auth/register", data=payload, files=files)
    
    # O FastAPI retorna 422 tanto para erro de validação de tipo quanto de valor
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT