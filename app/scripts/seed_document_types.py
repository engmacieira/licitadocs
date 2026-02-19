"""
Script de Seeding: Categorias e Tipos de Documentos.
Popula o banco com a estrutura padrão de licitação (Jurídica, Fiscal, Técnica, etc.).

Como rodar:
python -m app.scripts.seed_document_types
"""
import sys
import os

# Adiciona o diretório raiz ao path
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.document_category_model import DocumentCategory
from app.models.document_type_model import DocumentType

# [FIX MARK] Imports de Contexto (TODOS os models envolvidos na teia de relacionamentos)
# Isso garante que o SQLAlchemy conheça todas as classes antes de montar os mapas.
from app.models.certificate_model import Certificate 
from app.models.company_model import Company
from app.models.document_model import Document
from app.models.user_model import User # <--- O Faltante

# Definição do Catálogo Padrão (Fonte: Backlog Sprint 17)
CATALOGO_INICIAL = [
    {
        "name": "Habilitação Jurídica",
        "slug": "juridica",
        "order": 1,
        "types": [
            {"name": "Contrato Social / Estatuto", "slug": "contrato_social", "validity": 0},
            {"name": "Cartão CNPJ", "slug": "cartao_cnpj", "validity": 0},
            {"name": "Documentos dos Sócios (RG/CPF)", "slug": "documentos_socios", "validity": 0},
        ]
    },
    {
        "name": "Regularidade Fiscal e Trabalhista",
        "slug": "fiscal",
        "order": 2,
        "types": [
            {"name": "CND Federal (Tributos e Contribuições)", "slug": "cnd_federal", "validity": 180},
            {"name": "CND Estadual", "slug": "cnd_estadual", "validity": 0}, 
            {"name": "CND Municipal", "slug": "cnd_municipal", "validity": 0}, 
            {"name": "CRF do FGTS", "slug": "fgts", "validity": 30},
            {"name": "CND Trabalhista (TST)", "slug": "trabalhista", "validity": 180},
        ]
    },
    {
        "name": "Qualificação Econômico-Financeira",
        "slug": "economica",
        "order": 3,
        "types": [
            {"name": "Balanço Patrimonial", "slug": "balanco_patrimonial", "validity": 0}, 
            {"name": "Certidão de Falência e Concordata", "slug": "falencia", "validity": 180},
        ]
    },
    {
        "name": "Qualificação Técnica",
        "slug": "tecnica",
        "order": 4,
        "types": [
            {"name": "Atestado de Capacidade Técnica", "slug": "atestado_tecnico", "validity": 0},
            {"name": "Certidão de Registro no Conselho (CREA/CAU/CRA)", "slug": "registro_conselho", "validity": 365},
        ]
    }
]

def seed():
    db = SessionLocal()
    print("🌱 Iniciando o Seeding de Documentos...")

    try:
        for cat_data in CATALOGO_INICIAL:
            # 1. Busca ou Cria a Categoria
            category = db.query(DocumentCategory).filter_by(slug=cat_data["slug"]).first()
            
            if not category:
                print(f"   Criando Categoria: {cat_data['name']}")
                category = DocumentCategory(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    order=cat_data["order"]
                )
                db.add(category)
                db.commit() 
                db.refresh(category)
            else:
                print(f"   Categoria já existe: {cat_data['name']}")

            # 2. Busca ou Cria os Tipos dentro da Categoria
            for type_data in cat_data["types"]:
                doc_type = db.query(DocumentType).filter_by(slug=type_data["slug"]).first()
                
                if not doc_type:
                    print(f"      + Criando Tipo: {type_data['name']}")
                    doc_type = DocumentType(
                        name=type_data["name"],
                        slug=type_data["slug"],
                        validity_days_default=type_data["validity"],
                        category_id=category.id
                    )
                    db.add(doc_type)
                else:
                    if doc_type.category_id != category.id:
                        doc_type.category_id = category.id
                        db.add(doc_type)

        db.commit()
        print("✅ Seeding concluído com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro durante o seed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()