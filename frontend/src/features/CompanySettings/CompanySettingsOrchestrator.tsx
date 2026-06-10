import { useState, useEffect, useMemo } from 'react';
import { Building2, Users, FileText, UserCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

// Contexto e Hooks
import { useAuth } from '../../contexts/AuthContext';
import { useCompanySettingsData } from './hooks/useCompanySettingsData';
import { useIBGE } from '../../hooks/useIBGE';
import { useCompanyDocuments } from './hooks/useCompanyDocuments';
import { useCompanyTeam } from './hooks/useCompanyTeam';

// Subcomponentes da Feature
import { DetailsTab } from './components/DetailsTab';
import { DocumentsTab } from './components/DocumentsTab';
import { TeamTab } from './components/TeamTab';
import { ProfileTab } from './components/ProfileTab';
import { Skeleton } from '../../components/ui/Skeleton';

export type SettingsTab = 'details' | 'team' | 'documents' | 'profile';

/**
 * Orquestrador das Configurações da Empresa (Visão do Cliente).
 * Atua como um Container leve que gerencia o estado da aba ativa
 * e delega a lógica pesada para hooks customizados.
 */
export function CompanySettingsOrchestrator() {
    const { currentCompany, user } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('details');

    const safeCompanyData = useMemo(() => currentCompany
        ? { ...currentCompany, is_active: true } as any
        : null, [currentCompany]);

    // --- HOOKS DE LÓGICA ---
    const {
        statusFlags,
        companyForm,
        profileForm,
        passwordForm,
        onSaveDetails,
        onSaveProfile,
        onChangePassword,
        handleResendVerification
    } = useCompanySettingsData(safeCompanyData, user);

    const selectedUf = companyForm.watch('estado');
    const { ufs, cities } = useIBGE(selectedUf);

    const {
        clientDocs,
        isLoadingDocs,
        loadClientDocuments,
        handleUploadDoc,
        handleDownloadDoc,
        handleDeleteDoc
    } = useCompanyDocuments(currentCompany?.id);

    const {
        team,
        loadTeamData
    } = useCompanyTeam(currentCompany?.id);

    // Efeitos para carregar dados específicos da aba (Compatibilidade com comportamento original)
    useEffect(() => {
        if (!currentCompany?.id) return;
        if (activeTab === 'team') loadTeamData();
        if (activeTab === 'documents') loadClientDocuments();
    }, [activeTab, currentCompany?.id, loadTeamData, loadClientDocuments]);

    const isRegular = statusFlags.data && statusFlags.contract && statusFlags.payment && statusFlags.approval;

    if (!currentCompany) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        Gerencie os dados da <span className="font-semibold text-slate-700">{currentCompany.razao_social}</span>
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-medium ${isRegular ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    {isRegular ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {isRegular ? "Empresa Regular" : "Pendências Cadastrais"}
                </div>
            </div>

            {/* Abas de Navegação */}
            <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar">
                <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={Building2} label="Dados Cadastrais" />
                <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={FileText} label="Documentação" />
                <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={Users} label="Equipe" />
                <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserCircle} label="Meu Perfil" />
            </div>

            {/* Renderização Condicional dos Separadores Isolados */}
            {activeTab === 'details' && (
                <DetailsTab
                    currentCompany={safeCompanyData}
                    companyForm={companyForm}
                    onSaveDetails={onSaveDetails}
                    onResendVerification={handleResendVerification}
                    ufs={ufs}
                    cities={cities}
                    selectedUf={selectedUf}
                    statusFlags={statusFlags}
                />
            )}

            {activeTab === 'documents' && (
                <DocumentsTab
                    clientDocs={clientDocs}
                    isLoadingDocs={isLoadingDocs}
                    handleUploadDoc={handleUploadDoc}
                    handleDownloadDoc={handleDownloadDoc}
                    handleDeleteDoc={handleDeleteDoc}
                />
            )}

            {activeTab === 'team' && (
                <TeamTab
                    team={team}
                    currentCompanyId={currentCompany.id}
                    loadTeamData={loadTeamData}
                    user={user}
                />
            )}

            {activeTab === 'profile' && (
                <ProfileTab
                    profileForm={profileForm}
                    onSaveProfile={onSaveProfile}
                    passwordForm={passwordForm}
                    onChangePassword={onChangePassword}
                />
            )}
        </div>
    );
}

// Auxiliar das Tabs
function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${active ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
            <Icon size={18} /> {label}
        </button>
    )
}
