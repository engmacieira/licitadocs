"""
Script de Inicialização (Reset & Seed) Integrado ao Alembic.
ATENÇÃO: RODE ISSO APENAS EM AMBIENTE DE DEV/TESTE.
"""
import sys
import os
from alembic import command
from alembic.config import Config
from sqlalchemy import text

# Adiciona o diretório raiz ao path
sys.path.append(os.getcwd())

from app.core.database import SessionLocal, engine, Base
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.core.security import get_password_hash

def run_alembic_upgrade():
    """Executa 'alembic upgrade head' programaticamente"""
    print("🚀 Executando Migrations via Alembic...")
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

def reset_db():
    print("🗑️  Apagando TODAS as tabelas antigas...")
    
    # Detecta se é Postgres para usar o método "Nuclear" (Cascade)
    if engine.dialect.name == 'postgresql':
        try:
            with engine.connect() as conn:
                # O autocommit é necessário para operações de CREATE/DROP SCHEMA em alguns drivers
                conn.execution_options(isolation_level="AUTOCOMMIT")
                print("🔥 Modo Postgres: Recriando Schema Public (Cascade)...")
                conn.execute(text("DROP SCHEMA public CASCADE;"))
                conn.execute(text("CREATE SCHEMA public;"))
                # Restaura permissões padrão (opcional, mas recomendado)
                conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        except Exception as e:
            print(f"⚠️ Aviso ao resetar schema: {e}")
            # Fallback: tenta o método tradicional se o usuário não tiver permissão de Schema
            Base.metadata.drop_all(bind=engine)
    else:
        # SQLite (drop_all funciona bem aqui)
        Base.metadata.drop_all(bind=engine)
    
    # Recriamos as tabelas novas via Alembic
    run_alembic_upgrade()

def seed_data():
    db = SessionLocal()
    try:
        print("🌱 Semeando dados iniciais...")

        # 1. Criar Super Admin
        admin_pass = get_password_hash("admin123")
        admin = User(
            email="admin@licitadocs.com",
            password_hash=admin_pass,
            role=UserRole.ADMIN.value,
            is_active=True,
            cpf="00000000000"
        )
        db.add(admin)
        db.flush() 

        # 2. Criar uma Empresa de Teste
        demo_company = Company(
            cnpj="12345678000199",
            razao_social="Construtora Demo Ltda",
            nome_fantasia="ConstruDemo",
            owner_id=admin.id,
            email_corporativo="contato@construdemo.com",
            telefone="11999999999"
        )
        db.add(demo_company)
        db.flush()

        # 3. Vincular Admin como MASTER
        link = UserCompanyLink(
            user_id=admin.id,
            company_id=demo_company.id,
            role=UserCompanyRole.MASTER.value
        )
        db.add(link)

        db.commit()
        print(f"✅ Sucesso! Admin criado: {admin.email} / senha: admin123")
        print(f"🏢 Empresa criada: {demo_company.razao_social} (ID: {demo_company.id})")
        
    except Exception as e:
        print(f"❌ Erro ao semear dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Confirmação de segurança
    print("⚠️  ATENÇÃO: Este script vai APAGAR todo o banco de dados (DROP SCHEMA).")
    confirm = input("Digite 'CONFIRMAR' para continuar: ")
    
    if confirm == "CONFIRMAR":
        reset_db()
        seed_data()
    else:
        print("Operação cancelada.")