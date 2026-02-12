from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.dependencies import get_current_user 

def test_chat_consultant_success(client, db_session):
    """
    Cenário: Teste com Override de Autenticação e Vínculo correto.
    """
    # 1. Setup Dados
    company = Company(razao_social="IA Test Ltd", cnpj="111")
    db_session.add(company)
    db_session.commit()
    
    user = User(
        email="ia@test.com", 
        password_hash="pw", 
        is_active=True,
        role=UserRole.CLIENT.value
    )
    db_session.add(user)
    db_session.commit()
    
    link = UserCompanyLink(
        user_id=user.id, 
        company_id=company.id, 
        role=UserCompanyRole.MASTER.value,
        is_active=True
    )
    db_session.add(link)    
    db_session.commit()

    # 2. Override da Dependência de Usuário Logado
    # Em vez de ler Token, a API vai receber este objeto user direto.
    def mock_get_current_user():
        db_session.refresh(user)
        return user

    app.dependency_overrides[get_current_user] = mock_get_current_user

    try:
        # 3. Mock da IA
        with patch("app.core.ai_client.AIClient.generate_chat_response") as mock_method:
            mock_method.return_value = "Resposta Mockada com Sucesso!"

            # Chamada sem Header de Auth (o override cuida disso)
            response = client.post("/ai/chat", json={"message": "Olá"})

        assert response.status_code == 200
        assert response.json()["response"] == "Resposta Mockada com Sucesso!"
    
    finally:
        # Importante: Limpar o override para não afetar outros testes
        del app.dependency_overrides[get_current_user]

def test_chat_empty_message(client, db_session):
    # 1. Setup
    company = Company(razao_social="IA Test 2", cnpj="222")
    db_session.add(company)
    db_session.commit()
    user = User(email="ia2@test.com", password_hash="pw", is_active=True)
    db_session.add(user)
    db_session.commit()
    
    link = UserCompanyLink(
        user_id=user.id, 
        company_id=company.id, 
        role=UserCompanyRole.MASTER.value,
        is_active=True
    )
    db_session.add(link)    
    db_session.commit()

    # 2. Override
    def mock_get_current_user():
        db_session.refresh(user)
        return user
    app.dependency_overrides[get_current_user] = mock_get_current_user

    try:
        response = client.post("/ai/chat", json={"message": ""})
        assert response.status_code in [200, 422]
    finally:
        del app.dependency_overrides[get_current_user]