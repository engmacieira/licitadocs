"""
Testes de Integração de Rotas: Gestão de Perfil do Usuário.
Valida leitura de perfil, proteção contra injeção de privilégios (Mass Assignment)
e a listagem correta dos vínculos com as empresas.
"""
from fastapi import status
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.core.security import get_password_hash, create_access_token

# ==========================================
# 🛡️ 1. TESTES DE SEGURANÇA E HARDENING
# ==========================================

def test_get_me_unauthorized(client):
    """
    Cenário QA [Hardening]: Tentar ler perfil sem token.
    Resultado Esperado: 401 Unauthorized.
    """
    response = client.get("/users/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_patch_me_security_ignore_role(authorized_client):
    """
    Cenário QA [Segurança]: Tentar injetar privilégio de ADMIN via PATCH.
    Resultado Esperado: 200 OK, MAS a role não deve ser alterada (Mass Assignment Protection).
    """
    # 1. Ação Maliciosa: O usuário comum tenta mudar sua própria role
    payload = {
        "celular": "11999999999",
        "role": "admin"  # O router deve ignorar isso!
    }
    
    response = authorized_client.patch("/users/me", json=payload)
    
    # 2. Validação
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["celular"] == "11999999999" # O celular atualiza
    assert data.get("role") != "admin" # A role não pode ter mudado


# ==========================================
# 👤 2. TESTES DE REGRAS DE NEGÓCIO
# ==========================================

def test_get_me_success(authorized_client):
    """
    Cenário: Ler os próprios dados de perfil com sucesso.
    Resultado Esperado: 200 OK e dados básicos do usuário da fixture.
    """
    response = authorized_client.get("/users/me")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "email" in data
    assert "cliente_qa@teste.com" in data["email"] # Email padrão da nossa fixture

def test_get_my_companies_success(db_session, client):
    """
    Cenário: Listar as empresas nas quais o usuário trabalha.
    Resultado Esperado: 200 OK, retorno de lista com a 'role' injetada corretamente.
    """
    # 1. Setup Cirúrgico no Banco
    user = User(email="trabalhador@teste.com", password_hash=get_password_hash("123"), role=UserRole.CLIENT.value, is_active=True)
    company = Company(cnpj="00000001000136", razao_social="Firma LTDA")
    db_session.add(user)
    db_session.add(company)
    db_session.commit()

    # Vínculo como VIEWER
    link = UserCompanyLink(user_id=user.id, company_id=company.id, role=UserCompanyRole.VIEWER.value, is_active=True)
    db_session.add(link)
    db_session.commit()

    # Cria Token
    token = create_access_token(data={"sub": user.email, "role": user.role, "user_id": user.id})

    # 2. Ação
    response = client.get("/users/me/companies", headers={"Authorization": f"Bearer {token}"})
    
    # 3. Validação
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["razao_social"] == "Firma LTDA"
    assert data[0]["role"] == "VIEWER"  # O dado injetado pelo router tem que estar presente!