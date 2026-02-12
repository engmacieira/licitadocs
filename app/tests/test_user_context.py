import pytest
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.core.security import get_password_hash

# Helper de autenticação
def get_auth_header(client, email):
    resp = client.post("/auth/token", data={"username": email, "password": "123"})
    if resp.status_code != 200:
        raise ValueError(f"Falha ao logar no teste: {resp.text}")
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}

def test_list_my_companies_context(client, db_session):
    """
    Cenário: Usuário 'Consultor' trabalha em duas empresas.
    - Na Empresa A (Matriz) ele é MASTER.
    - Na Empresa B (Cliente) ele é VIEWER.
    
    O endpoint deve retornar ambas com os cargos corretos.
    """
    # 1. Setup User
    user = User(
        email="consultor@teste.com", 
        password_hash=get_password_hash("123"), 
        role=UserRole.CLIENT.value,
        is_active=True
    )
    db_session.add(user)
    
    # 2. Setup Empresas
    empresa_a = Company(razao_social="Matriz Ltda", cnpj="10000000000100")
    empresa_b = Company(razao_social="Cliente S.A.", cnpj="20000000000200")
    db_session.add_all([empresa_a, empresa_b])
    db_session.commit()
    
    # 3. Setup Vínculos (O Coração do Teste)
    # Vínculo 1: MASTER
    link_a = UserCompanyLink(
        user_id=user.id, 
        company_id=empresa_a.id, 
        role=UserCompanyRole.MASTER.value,
        is_active=True
    )
    # Vínculo 2: VIEWER
    link_b = UserCompanyLink(
        user_id=user.id, 
        company_id=empresa_b.id, 
        role=UserCompanyRole.VIEWER.value,
        is_active=True
    )
    db_session.add_all([link_a, link_b])
    db_session.commit()
    
    # 4. Act (Chama a API)
    headers = get_auth_header(client, "consultor@teste.com")
    response = client.get("/users/me/companies", headers=headers)
    
    # 5. Assert
    assert response.status_code == 200
    data = response.json()
    
    # Deve ter 2 empresas
    assert len(data) == 2
    
    # Verifica Empresa A (Tem que ser MASTER)
    res_a = next(c for c in data if c["id"] == empresa_a.id)
    assert res_a["razao_social"] == "Matriz Ltda"
    assert res_a["role"] == "MASTER"
    
    # Verifica Empresa B (Tem que ser VIEWER)
    res_b = next(c for c in data if c["id"] == empresa_b.id)
    assert res_b["razao_social"] == "Cliente S.A."
    assert res_b["role"] == "VIEWER"

def test_list_companies_empty(client, db_session):
    """
    Cenário: Usuário recém-criado sem empresa vinculada.
    Deve retornar lista vazia (e não erro).
    """
    user = User(email="novato@teste.com", password_hash=get_password_hash("123"), is_active=True)
    db_session.add(user)
    db_session.commit()
    
    headers = get_auth_header(client, "novato@teste.com")
    response = client.get("/users/me/companies", headers=headers)
    
    assert response.status_code == 200
    assert response.json() == []