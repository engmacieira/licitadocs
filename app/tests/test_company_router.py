"""
Testes de Integração de Rotas: Gestão de Empresas (Tenants).
Valida rigorosamente as regras de Multi-tenancy, garantindo que
apenas utilizadores MASTER podem alterar dados ou convidar membros,
e cobre todos os cenários secundários (Caminhos Tristes).
"""
from fastapi import status
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.core.security import get_password_hash, create_access_token

# ==========================================
# 🛠️ HELPER: FÁBRICA DE CENÁRIOS
# ==========================================

def setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value):
    """Cria uma empresa e vincula um utilizador com a permissão desejada."""
    user = User(email=f"{role}_user@teste.com", password_hash=get_password_hash("123"), role=UserRole.CLIENT.value, is_active=True)
    company = Company(cnpj="11222333000144", razao_social="Minha Empresa S.A.")
    
    db_session.add(user)
    db_session.add(company)
    db_session.commit()
    
    link = UserCompanyLink(user_id=user.id, company_id=company.id, role=role, is_active=True)
    db_session.add(link)
    db_session.commit()
    
    token = create_access_token(data={"sub": user.email, "role": user.role, "user_id": user.id})
    return company, user, token

# ==========================================
# 🏢 1. TESTES DE ATUALIZAÇÃO (PUT)
# ==========================================

def test_update_company_success_master(db_session, client):
    """Cenário: Dono (MASTER) atualiza um campo simples (telefone) com sucesso."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value)
    
    # Usamos o 'telefone' para fugir à complexidade dos aliases do Pydantic
    payload = {"telefone": "11988887777"}
    response = client.put(
        f"/companies/{company.id}",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["telefone"] == "11988887777"
        
def test_update_company_forbidden_viewer(db_session, client):
    """Cenário QA [Segurança]: Empregado (VIEWER) tenta alterar dados da empresa."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.VIEWER.value)
    
    payload = {"name": "Hacker Mudando Nome"}
    response = client.put(
        f"/companies/{company.id}",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
    # Ajustado para coincidir exatamente com a mensagem da tua API
    assert "Permissão insuficiente" in response.json()["detail"]
    
# ==========================================
# 👥 2. TESTES DE EQUIPA (MEMBROS)
# ==========================================

def test_get_company_members_success(db_session, client):
    """Cenário: Qualquer membro da empresa pode listar a sua própria equipa."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.VIEWER.value)
    
    response = client.get(
        f"/companies/{company.id}/members",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    # Ajustado para maiúsculas conforme gerado dinamicamente pela factory
    assert response.json()[0]["email"] == "VIEWER_user@teste.com"

def test_add_member_new_user_success(db_session, client):
    """Cenário: MASTER convida um e-mail novo (o sistema cria a conta automaticamente)."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value)
    
    payload = {"email": "novo_talento@empresa.com", "role": "VIEWER"}
    response = client.post(
        f"/companies/{company.id}/members",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # QA SÉNIOR: Corrigido para 201 Created (A API está correctíssima em devolver isto!)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "Usuário criado" in data["message"]
    assert data["email"] == "novo_talento@empresa.com"
        
def test_add_member_already_linked(db_session, client):
    """Cenário QA [Edge Case]: MASTER tenta convidar alguém que JÁ está na empresa."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value)
    
    # Ajustado para "VIEWER" maiúsculo
    payload = {"email": user.email, "role": "VIEWER"}
    response = client.post(
        f"/companies/{company.id}/members",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "já faz parte da equipe" in response.json()["detail"]
    
# ==========================================
# 🚀 3. TESTES DE ONBOARDING
# ==========================================

def test_update_onboarding_step_contract_success(db_session, client):
    """Cenário: O Frontend avisa que o utilizador assinou o contrato."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value)
    
    response = client.patch(
        f"/companies/{company.id}/onboarding-step?step=contract",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_contract_signed"] is True

def test_update_onboarding_step_payment_success(db_session, client):
    """Cenário: O Frontend avisa que o utilizador configurou o pagamento."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value)
    
    response = client.patch(
        f"/companies/{company.id}/onboarding-step?step=payment",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_payment_active"] is True

def test_update_onboarding_step_invalid(db_session, client):
    """Cenário QA [Validação]: Frontend envia um passo que não existe."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value)
    
    response = client.patch(
        f"/companies/{company.id}/onboarding-step?step=passo_falso",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    # Ajustado para a mensagem limpa que a tua API devolve!
    assert "Passo inválido" in response.json()["detail"]