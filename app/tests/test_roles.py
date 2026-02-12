from app.models.user_model import UserRole, User
from fastapi import status

def test_default_user_is_client(client):
    # 1. Registra usuário via Rota Simples
    payload = {"email": "comum@teste.com", "password": "senha_forte_123"}
    
    # Rota de compatibilidade (JSON)
    res = client.post("/auth/register-simple", json=payload)
    
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    
    # Verifica se nasceu como client (padrão da rota simples)
    assert data["role"] == "client"

def test_admin_permissions_check(client, db_session):
    """
    Cenário: Simula um Admin no banco e verifica se o token carrega essa info (indiretamente).
    Nota: Neste teste, vamos manipular o banco direto para transformar alguém em admin,
    pois não existe rota de cadastro de admin.
    """
    # 1. Cria usuário comum (COM SENHA FORTE)
    email = "futuro_admin@teste.com"
    payload = {"email": email, "password": "senha_forte_123"}
    res = client.post("/auth/register-simple", json=payload)
    assert res.status_code == status.HTTP_201_CREATED
    
    # 2. Hack: Vai no banco (usando a fixture db) e promove ele a ADMIN
    user = db_session.query(User).filter(User.email == email).first()
    
    assert user is not None, "ERRO CRÍTICO: Usuário não encontrado no banco de testes!"
    
    user.role = UserRole.ADMIN.value
    db_session.commit() # Commita na transação do teste
    
    # 3. Faz Login e verifica se funciona
    # [CORREÇÃO] Mudado de /auth/login para /auth/token para bater com o Router atual
    login_res = client.post("/auth/token", data={"username": email, "password": "senha_forte_123"})
    assert login_res.status_code == status.HTTP_200_OK
    
    # 4. Verifica persistência
    # Buscamos de novo para garantir que o commit funcionou
    updated_user = db_session.query(User).filter(User.email == email).first()
    assert updated_user.role == "admin"