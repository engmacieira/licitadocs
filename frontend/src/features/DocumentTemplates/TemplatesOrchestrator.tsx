// src/features/DocumentTemplates/TemplatesOrchestrator.tsx
import { Building2, UserCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAuth } from '../../contexts/AuthContext';
import { DeclarationSection } from './components/DeclarationSection';
import { AttestationSection } from './components/AttestationSection';

// REGRA: Importação do tipo de onde ele existe atualmente
import { type CompanyDocData } from './utils/docxGenerator';

export function TemplatesOrchestrator() {
    const { currentCompany, userProfile } = useAuth();

    const company = currentCompany as any;
    const user = userProfile as any;

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-amber-600 animate-pulse">
                <Building2 className="h-10 w-10 mb-4 opacity-50" />
                <p className="font-medium">A carregar dados da empresa...</p>
            </div>
        );
    }

    // Lógica de mapeamento corrigida para incluir o Bairro e campos de localidade
    const companyData: CompanyDocData = {
        razaoSocial: company.razao_social || company.name || 'Empresa não identificada',
        cnpj: company.cnpj || '00.000.000/0000-00',
        endereco: company.logradouro
            ? `${company.logradouro}${company.numero ? `, ${company.numero}` : ''}${company.bairro ? ` - ${company.bairro}` : ''}`
            : 'Endereço não informado',
        cidadeUf: company.cidade && company.estado ? `${company.cidade}/${company.estado}` : 'Local não informado',
        dataAtual: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        nomeRepresentante: user?.nome_completo || company.responsavel_nome || 'Não informado',
        cpfRepresentante: user?.cpf || company.responsavel_cpf || '000.000.000-00'
    };

    return (
        <div className="space-y-8">
            {/* Cabeçalho com os dados que o teste valida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-slate-200">
                    <Building2 className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="font-bold text-slate-800">{companyData.razaoSocial}</p>
                    <p className="text-xs text-slate-500">CNPJ: {companyData.cnpj}</p>
                    {/* Estas duas linhas abaixo fazem o teste passar! */}
                    <p className="text-xs text-slate-500">{companyData.endereco}</p>
                    <p className="text-xs text-slate-500">{companyData.cidadeUf}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <UserCircle2 className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="font-bold text-slate-800">{companyData.nomeRepresentante}</p>
                    <p className="text-xs text-slate-500">CPF: {companyData.cpfRepresentante}</p>
                    <p className="text-xs text-slate-500">Data: {companyData.dataAtual}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div data-testid="declaration-section">
                    <DeclarationSection companyData={companyData} />
                </div>
                <div data-testid="attestation-section">
                    <AttestationSection companyData={companyData} />
                </div>
            </div>
        </div>
    );
}