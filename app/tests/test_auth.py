from fastapi import status

def test_create_user_success(client):
    """
    Cenário: Cadastro de usuário com dados válidos.
    Resultado Esperado: 201 Created e retorno do ID.
    """
    payload = {
        "email": "sucesso@teste.com",
        "password": "senha_segura_123",
        "is_active": True
    }
    response = client.post("/auth/register", json=payload)
    
    # Debug: Se falhar, vai mostrar o erro no terminal
    if response.status_code != 201:
        print(f"Erro Retornado: {response.json()}")

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == payload["email"]
    assert "id" in data
    assert "password" not in data  # Garante que não vazamos a senha

def test_create_user_1_to_9_reproduction(client):
    """
    Cenário: Tentar reproduzir o erro que o Matheus encontrou.
    Senha: '123456789' (9 caracteres).
    """
    payload = {
        "email": "bug_matheus@teste.com",
        "password": "123456789", # Sua senha de teste
        "is_active": True
    }
    response = client.post("/auth/register", json=payload)
    
    # Se falhar aqui, o pytest vai nos mostrar EXATAMENTE o JSON de erro
    assert response.status_code == status.HTTP_201_CREATED, f"Falhou com erro: {response.json()}"

def test_password_min_length(client):
    """
    Cenário: Senha muito curta (<8 caracteres).
    Resultado Esperado: 422 Unprocessable Entity (Erro de validação Pydantic).
    """
    payload = {
        "email": "curto@teste.com",
        "password": "123", # Muito curta
        "is_active": True
    }
    response = client.post("/auth/register", json=payload)
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    # Verifica se o erro menciona o campo 'password'
    errors = response.json()["detail"]
    assert any(err["loc"][-1] == "password" for err in errors)