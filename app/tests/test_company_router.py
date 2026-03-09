"""
Testes de Integração de Rotas: Gestão de Empresas (Tenants).
Valida rigorosamente as regras de Multi-tenancy, garantindo que
apenas utilizadores MASTER podem alterar dados ou convidar membros,
e cobre todos os cenários secundários (Caminhos Tristes).
"""
import random
import string
from fastapi import status
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.core.security import get_password_hash, create_access_token

# ==========================================
# 🛠️ HELPER: FÁBRICA DE CENÁRIOS
# ==========================================

def gerar_cnpj_valido():
    """Gera um CNPJ aleatório, mas matematicamente válido para passar no Pydantic."""
    numeros = [random.randint(0, 9) for _ in range(12)]
    
    # Cálculo do 1º Dígito
    pesos_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma_1 = sum(n * p for n, p in zip(numeros, pesos_1))
    resto_1 = soma_1 % 11
    digito_1 = 0 if resto_1 < 2 else 11 - resto_1
    numeros.append(digito_1)
    
    # Cálculo do 2º Dígito
    pesos_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma_2 = sum(n * p for n, p in zip(numeros, pesos_2))
    resto_2 = soma_2 % 11
    digito_2 = 0 if resto_2 < 2 else 11 - resto_2
    numeros.append(digito_2)
    
    return "".join(map(str, numeros))

def setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value):
    """Cria uma empresa e vincula um utilizador com a permissão desejada."""
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    
    # Usamos o nosso gerador para criar um CNPJ que passe nas validações!
    cnpj_valido = gerar_cnpj_valido()
    
    user = User(
        email=f"{role}_user_{suffix}@teste.com", 
        password_hash=get_password_hash("123"), 
        role=UserRole.CLIENT.value, 
        is_active=True
    )
    company = Company(
        cnpj=cnpj_valido, 
        razao_social=f"Minha Empresa {suffix} S.A."
    )
    
    db_session.add(user)
    db_session.add(company)
    db_session.commit()
    
    link = UserCompanyLink(user_id=user.id, company_id=company.id, role=role, is_active=True)
    db_session.add(link)
    db_session.commit()
    
    token = create_access_token({"sub": user.email})
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
    
    # Compara o email devolvido pela rota com o email dinâmico do utilizador criado!
    assert response.json()[0]["email"] == user.email

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

# ==========================================
# 🧪 NOVOS TESTES DA SPRINT 24
# ==========================================

def test_update_onboarding_step_terms_success(db_session, client):
    """Cenário: O Frontend avisa que o utilizador aceitou os termos de uso (US-2404)."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value)
    
    response = client.patch(
        f"/companies/{company.id}/onboarding-step?step=terms",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_terms_accepted"] is True

def test_update_onboarding_step_data_success(db_session, client):
    """Cenário: O Frontend avisa que o utilizador preencheu os dados completos da empresa."""
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value)
    
    response = client.patch(
        f"/companies/{company.id}/onboarding-step?step=data",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_data_completed"] is True

def test_update_company_client_cannot_change_admin_flags(db_session, client):
    """
    Cenário de Segurança (US-2406): Cliente tenta alterar flags exclusivas do Admin 
    ou apagar as pendências impostas. O Backend deve ignorar esses campos silenciosamente.
    """
    company, user, token = setup_company_and_user(db_session, role=UserCompanyRole.MASTER.value)
    
    # O cliente (espertinho) tenta enviar dados que não lhe competem
    payload = {
        "razao_social": "Nome Atualizado S.A.", # Enviamos o alias
        "is_admin_verified": True,      # Tentativa de auto-aprovação
        "is_contract_signed": True,     # Tentativa de simular contrato
        "is_payment_active": True,      # Tentativa de simular pagamento
        "admin_pendencies": None        # Tentativa de apagar os avisos do Admin
    }
    
    response = client.put(
        f"/companies/{company.id}",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # O nome deve ser atualizado com sucesso (Verificando o alias 'razao_social')
    assert data["razao_social"] == "Nome Atualizado S.A."
    
    # Mas as flags e pendências DEVEM manter-se no estado original (False ou None),
    # comprovando que a blindagem da API funcionou.
    assert data["is_admin_verified"] is False
    assert data["is_contract_signed"] is False
    assert data["is_payment_active"] is False
    assert data["admin_pendencies"] is None