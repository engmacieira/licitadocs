import { LayoutGrid, Building2, UserCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Contexto
import { useAuth } from '../../contexts/AuthContext';

// Subcomponentes e Tipos da Feature
import { DeclarationSection } from './components/DeclarationSection';
import { AttestationSection } from './components/AttestationSection';
import type { CompanyDocData } from './utils/docxGenerator';

/**
 * Orquestrador de Modelos de Documentos.
 * Responsável por extrair os dados dinâmicos da empresa atual do contexto,
 * formatá-los no padrão exigido (CompanyDocData) e distribuí-los para
 * os geradores de documentos (Declarações e Atestados).
 */
export function TemplatesOrchestrator() {
    // Busca os dados reais e instantâneos do Contexto
    const { currentCompany, userProfile } = useAuth();

    // Fazemos um cast para lidar com a tipagem da empresa
    const company = currentCompany as any;

    // Renderização de estado de carregamento amigável
    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-amber-600 animate-pulse">
                <Building2 className="h-10 w-10 mb-4 opacity-50" />
                <p className="font-medium">A carregar dados da empresa...</p>
            </div>
        );
    }

    // Mapeia os dados do AuthContext para o formato que os nossos Documentos exigem
    const companyData: CompanyDocData = {
        razaoSocial: company?.razao_social || "NOME DA EMPRESA",
        cnpj: company?.cnpj || "00.000.000/0000-00",
        // Monta o endereço concatenando os campos
        endereco: `${company?.logradouro || ''}, ${company?.numero || ''} - ${company?.bairro || 'Centro'}`,
        cidadeUf: `${company?.cidade || 'Cidade'}/${company?.estado || 'UF'}`,

        // Data formatada para hoje
        dataAtual: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),

        // Puxa do Perfil de Utilizador primeiro, com fallback para a Empresa
        nomeRepresentante: userProfile?.nome || company?.responsavel_nome || "NOME DO REPRESENTANTE",
        cpfRepresentante: userProfile?.cpf || company?.responsavel_cpf || "000.000.000-00"
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="p-4 bg-slate-100 text-slate-600 rounded-2xl shrink-0">
                    <LayoutGrid size={32} />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Modelos de Documentos</h1>
                    <p className="text-sm text-slate-500 mt-1">Gere declarações e atestados padrão preenchidos automaticamente com os seus dados.</p>
                </div>
            </div>

            {/* Painel de Contexto (Aviso visual do que será injetado nos documentos) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 transition-colors hover:border-blue-200">
                    <Building2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-bold text-slate-800">{companyData.razaoSocial}</p>
                        <p className="text-xs text-slate-500 mt-1">CNPJ: {companyData.cnpj}</p>
                        <p className="text-xs text-slate-500">{companyData.endereco}, {companyData.cidadeUf}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 transition-colors hover:border-blue-200">
                    <UserCircle2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-bold text-slate-800">{companyData.nomeRepresentante}</p>
                        <p className="text-xs text-slate-500 mt-1">CPF: {companyData.cpfRepresentante}</p>
                        <p className="text-xs text-slate-500">Data de emissão: {companyData.dataAtual}</p>
                    </div>
                </div>
            </div>

            {/* Lista de Módulos Isolados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DeclarationSection companyData={companyData} />
                <AttestationSection companyData={companyData} />
            </div>
        </div>
    );
}