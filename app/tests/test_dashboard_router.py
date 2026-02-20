"""
Testes de Integração de Rotas: Dashboard.
Valida a extração de métricas (Estatísticas) e garante rigorosamente
o isolamento de dados (Multi-tenancy) na exibição do painel.
"""
from fastapi import status
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.models.document_model import Document, DocumentStatus
from app.core.security import get_password_hash, create_access_token

# ==========================================
# 🛡️ 1. TESTES DE SEGURANÇA (ACL & ISOLAMENTO)
# ==========================================

def test_admin_dashboard_forbidden_for_normal_user(authorized_client):
    """
    Cenário QA [Hardening]: Usuário comum tenta ver o painel de estatísticas globais do Admin.
    Resultado Esperado: Acesso Negado (403).
    """
    response = authorized_client.get("/dashboard/admin/stats")
    
    # Dependendo da configuração do dependency, pode ser 401 ou 403. Cobrimos ambos.
    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

def test_client_dashboard_forbidden_other_company(db_session, client, normal_user_token):
    """
    Cenário QA [Hardening - Multi-tenancy]: Usuário comum tenta espionar métricas de outra empresa 
    passando o ID manualmente na Query String.
    Resultado Esperado: 403 Forbidden.
    """
    # 1. Setup: Criamos a empresa alvo (que não pertence ao usuário do token)
    vitima_company = Company(cnpj="11111111000111", razao_social="Vítima SA")
    db_session.add(vitima_company)
    db_session.commit()

    # 2. Ação Maliciosa: O usuário injeta o ID da Vítima
    response = client.get(
        f"/dashboard/client/stats?company_id={vitima_company.id}",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )

    # 3. Validação: O bloqueio de links do usuário tem que agir
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Acesso negado aos dados desta empresa" in response.json()["detail"]

def test_client_dashboard_no_company(authorized_client):
    """
    Cenário: Usuário sem vínculo com NENHUMA empresa tenta carregar o dashboard.
    Resultado Esperado: 200 OK com dados zerados (Fallback amigável da API).
    """
    response = authorized_client.get("/dashboard/client/stats")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["company_name"] == "Sem Empresa"
    assert data["total_docs"] == 0


# ==========================================
# 📊 2. TESTES DE REGRAS DE NEGÓCIO (MÉTRICAS)
# ==========================================

def test_admin_dashboard_success(admin_client):
    """
    Cenário: Admin acessa seu painel.
    Resultado Esperado: 200 OK e a estrutura completa com listas e contadores.
    """
    response = admin_client.get("/dashboard/admin/stats")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_companies" in data
    assert "total_documents" in data
    assert "total_users" in data
    # Corrigido para "recent_documents" para bater com a API
    assert isinstance(data["recent_documents"], list) 
    assert isinstance(data["recent_companies"], list)

def test_client_dashboard_success(db_session, client):
    """
    Cenário: Cliente acessa seu painel, e o sistema deve agrupar as estatísticas 
    dos documentos (Válidos vs Vencidos) corretamente.
    """
    # 1. Setup Cirúrgico de Cenário Completo
    user = User(email="dash@cliente.com", password_hash=get_password_hash("123"), role=UserRole.CLIENT.value, is_active=True)
    company = Company(cnpj="22222222000122", razao_social="Minha Empresa")
    db_session.add(user)
    db_session.add(company)
    db_session.commit()

    # Faz o Vínculo 
    link = UserCompanyLink(user_id=user.id, company_id=company.id, role=UserCompanyRole.MASTER.value, is_active=True)
    db_session.add(link)

    # Adiciona 2 Documentos (1 Válido, 1 Vencido) para testar a contagem
    doc1 = Document(filename="valido.pdf", file_path="/fake", company_id=company.id, status=DocumentStatus.VALID.value)
    doc2 = Document(filename="vencido.pdf", file_path="/fake", company_id=company.id, status=DocumentStatus.EXPIRED.value)
    db_session.add(doc1)
    db_session.add(doc2)
    db_session.commit()

    # Fabrica o Token
    user_token = create_access_token(data={"sub": user.email, "role": user.role, "user_id": user.id})

    # 2. Ação
    response = client.get(
        "/dashboard/client/stats",
        headers={"Authorization": f"Bearer {user_token}"}
    )

    # 3. Validação das Métricas Matemáticas (AGORA ALINHADO COM A API!)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["company_name"] == "Minha Empresa"
    assert data["total_docs"] == 2    # Corrigido
    assert data["docs_valid"] == 1    # Corrigido
    assert data["docs_expired"] == 1  # Corrigido
    assert len(data["recent_docs"]) == 2 # Corrigido