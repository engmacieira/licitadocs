"""
Testes de Integração de Rotas: Autenticação.
Garante que o login é seguro, e que o registro processa 
arquivos e dados simultaneamente sem sujar o disco real (Mocking).
"""
from fastapi import status
from unittest.mock import patch

# ==========================================
# 🔐 1. TESTES DE LOGIN (OAuth2)
# ==========================================

def test_login_success(client):
    """
    Cenário: Usuário válido tenta fazer login.
    Resultado Esperado: 200 OK e retorno do JWT.
    """
    # 1. Setup: Criamos um usuário rápido usando a rota simplificada
    client.post("/auth/register-simple", json={
        "email": "acesso@teste.com", 
        "password": "senha_segura_123"
    })
    
    # 2. Ação: Login OAuth2 (Exige envio como DATA/Form, e chaves username/password)
    response = client.post("/auth/token", data={
        "username": "acesso@teste.com",
        "password": "senha_segura_123"
    })
    
    # 3. Validação
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client):
    """
    Cenário QA [Hardening]: Tentativa de Força Bruta / Senha Errada.
    Resultado Esperado: 401 Unauthorized.
    """
    client.post("/auth/register-simple", json={"email": "hacker@teste.com", "password": "senha123"})
    
    response = client.post("/auth/token", data={
        "username": "hacker@teste.com",
        "password": "senha_errada_aqui"
    })
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Email ou senha incorretos"


# ==========================================
# 🏢 2. TESTES DE REGISTRO COM UPLOAD
# ==========================================

# Interceptamos a função de salvar o arquivo para ela não escrever no disco real!
@patch("app.routers.auth_router.save_upload_file")
def test_register_multipart_success(mock_save_file, client):
    """
    Cenário: Registro completo de nova Empresa (SaaS), enviando arquivos.
    Resultado Esperado: 201 Created, geração de Token e processamento seguro.
    """
    # 1. Ensinamos a função falsa a retornar a Tupla (caminho, tamanho) que o router espera
    mock_save_file.return_value = ("storage/mock_path/file.pdf", 1024)
    
    # 2. Dados de Texto (Form Data)
    payload = {
        "email": "ceo@novasaas.com",
        "password": "senha_forte_456",
        "legal_name": "Nova SaaS LTDA",
        "cnpj": "11.222.333/0001-44",
        "responsible_name": "Elon Falso",
        "cpf": "111.222.333-44"
    }
    
    # 3. Simulando um Arquivo em Memória (PDF falso)
    files = {
        "social_contract": ("contrato_social.pdf", b"%PDF-1.4 conteudo binario falso", "application/pdf")
    }
    
    # 4. Ação: Dispara a requisição Multipart
    response = client.post("/auth/register", data=payload, files=files)
    
    # 5. Validação
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    
    # Confirma que retornou o token (Auto-Login funcionou)
    assert "access_token" in data
    assert data["user"]["email"] == "ceo@novasaas.com"
    
    # QA Bônus: Garante que a função de salvar arquivo foi chamada exatamente 1 vez
    mock_save_file.assert_called_once()

@patch("app.routers.auth_router.save_upload_file")
def test_register_duplicate_email(mock_save_file, client):
    """
    Cenário: Tentativa de registrar a mesma empresa/email duas vezes.
    Resultado Esperado: 400 Bad Request.
    """
    mock_save_file.return_value = ("fake/path.pdf", 1024)
    payload = {
        "email": "duplicado@teste.com", "password": "123", "legal_name": "Empresa 1",
        "cnpj": "1111", "responsible_name": "João", "cpf": "111"
    }
    
    # Registra a primeira vez (Sucesso)
    client.post("/auth/register", data=payload)
    
    # Tenta de novo com o mesmo e-mail
    response = client.post("/auth/register", data=payload)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Email já cadastrado."