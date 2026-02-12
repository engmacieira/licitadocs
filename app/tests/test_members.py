import pytest
from app.models.user_model import User, UserCompanyLink, UserCompanyRole, UserRole
from app.models.company_model import Company
from app.core.security import get_password_hash

# Helper simples de token
def get_token(client, email):
    resp = client.post("/auth/token", data={"username": email, "password": "123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}

def test_add_member_existing_user(client, db_session):
    """
    Cenário: Master adiciona um usuário que JÁ existe no sistema.
    """
    # 1. Setup: Master e Empresa
    company = Company(razao_social="Tech Corp", cnpj="10000000000100")
    db_session.add(company)
    db_session.commit()

    master = User(email="boss@tech.com", password_hash=get_password_hash("123"), role="client", is_active=True)
    db_session.add(master)
    db_session.commit()
    
    # Vínculo Master
    link = UserCompanyLink(user_id=master.id, company_id=company.id, role="MASTER", is_active=True)
    db_session.add(link)
    db_session.commit()

    # Usuário a ser convidado (Existente, sem vínculo)
    guest = User(email="guest@gmail.com", password_hash=get_password_hash("123"), role="client", is_active=True)
    db_session.add(guest)
    db_session.commit()

    # 2. Ação: Master convida Guest
    headers = get_token(client, "boss@tech.com")
    payload = {
        "email": "guest@gmail.com",
        "role": "VIEWER"
    }
    
    response = client.post(f"/companies/{company.id}/members", json=payload, headers=headers)

    # 3. Asserts
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "guest@gmail.com"
    
    # Verifica no banco
    link_db = db_session.query(UserCompanyLink).filter(
        UserCompanyLink.user_id == guest.id, 
        UserCompanyLink.company_id == company.id
    ).first()
    assert link_db is not None
    assert link_db.role == "VIEWER"

def test_add_member_new_user_provisional(client, db_session):
    """
    Cenário: Master adiciona um email NOVO (cria usuário + senha provisória).
    """
    # Setup básico (reaproveitando lógica anterior se quiser, ou fazendo novo)
    company = Company(razao_social="Novos Inc", cnpj="20000000000100")
    db_session.add(company)
    master = User(email="lider@novos.com", password_hash=get_password_hash("123"), role="client", is_active=True)
    db_session.add(master)
    db_session.commit()
    db_session.add(UserCompanyLink(user_id=master.id, company_id=company.id, role="MASTER"))
    db_session.commit()

    headers = get_token(client, "lider@novos.com")
    payload = {
        "email": "novo_funcionario@novos.com", # Email nunca visto
        "role": "VIEWER"
    }

    response = client.post(f"/companies/{company.id}/members", json=payload, headers=headers)

    assert response.status_code == 201
    data = response.json()
    assert "Senha provisória" in data["message"] # Verifica se gerou senha
    
    # Verifica se criou o user
    new_user = db_session.query(User).filter(User.email == "novo_funcionario@novos.com").first()
    assert new_user is not None
    assert len(new_user.company_links) == 1

def test_security_viewer_cannot_add_member(client, db_session):
    """
    Cenário: Um usuário VIEWER tenta adicionar outro membro (deve ser proibido).
    """
    company = Company(razao_social="Secure Ltd", cnpj="30000000000100")
    db_session.add(company)
    
    # Cria um Viewer
    viewer = User(email="estagiario@secure.com", password_hash=get_password_hash("123"), role="client", is_active=True)
    db_session.add(viewer)
    db_session.commit()
    db_session.add(UserCompanyLink(user_id=viewer.id, company_id=company.id, role="VIEWER"))
    db_session.commit()

    headers = get_token(client, "estagiario@secure.com")
    payload = {"email": "hacker@evil.com", "role": "MASTER"}

    response = client.post(f"/companies/{company.id}/members", json=payload, headers=headers)

    assert response.status_code == 403
    assert "Apenas gerentes" in response.json()["detail"]