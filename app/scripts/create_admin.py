"""
Script para criar o primeiro usuário ADMIN do sistema.
Execute com: python -m app.scripts.create_admin
"""
import sys
import os

# Adiciona o diretório atual ao path para conseguir importar o 'app'
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.user_model import User, UserRole, Company
from app.core.security import get_password_hash

def create_super_admin():
    db = SessionLocal()
    
    email = "matheus_macieira@hotmail.com"
    password = "a22061993"
    
    # 1. Verifica se já existe
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"⚠️  O usuário {email} já existe! Excluindo para recriar corrigido...")
        db.delete(existing_user)
        db.commit()

    # 2. Cria o Usuário Admin
    print(f"Criando super admin: {email}...")
    admin_user = User(
        email=email,
        password_hash=get_password_hash(password),
        is_active=True,
        role=UserRole.ADMIN.value 
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    # 3. Cria a Empresa do Admin 
    print("Criando empresa matriz...")
    admin_company = Company(
        cnpj="00.000.000/0001-91",
        razao_social="LicitaDoc HQ",
        owner_id=admin_user.id
    )
    db.add(admin_company)
    db.commit()
    db.refresh(admin_company)

    #4. Vincula o Admin à Empresa (Multi-tenancy)
    print("Vinculando admin à empresa...")
    admin_user.company_id = admin_company.id
    db.add(admin_user)
    db.commit()
    
    print("✅ Admin criado e vinculado com sucesso!")
    print(f"Login: {email}")
    print(f"Senha: {password}")

if __name__ == "__main__":
    create_super_admin()