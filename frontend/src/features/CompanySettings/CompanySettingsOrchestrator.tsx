import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2, Users, FileText, UserCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

// Contexto e Serviços
import { useAuth } from '../../contexts/AuthContext';
import { companyService } from '../../services/companyService';
import api from '../../services/api';
import type { CompanyUpdatePayload, MemberResponse } from '../../types';

// Subcomponentes da Feature
import { DetailsTab } from './components/DetailsTab';
import { DocumentsTab } from './components/DocumentsTab';
import { TeamTab } from './components/TeamTab';
import { ProfileTab } from './components/ProfileTab';
import { Skeleton } from '../../components/ui/Skeleton';

// Interfaces de Formulário
export interface CompanyFormSchema {
    razao_social: string; cnpj: string; nome_fantasia: string;
    email_corporativo: string; telefone: string; responsavel_nome: string;
    cep: string; logradouro: string; numero: string; bairro: string;
    cidade: string; estado: string;
}
export interface PasswordFormSchema {
    currentPassword: string;
    password: string;
    confirmPassword: string;
}
export interface ProfileFormSchema {
    nome: string; cpf: string; rg: string; celular: string;
    genero: string; nacionalidade: string; estado_civil: string; profissao: string;
}

export type SettingsTab = 'details' | 'team' | 'documents' | 'profile';

/**
 * Orquestrador das Configurações da Empresa (Visão do Cliente).
 * Gere todos os estados, requisições à API, integração com IBGE e a lógica
 * de submissão dos 4 separadores (Tabs) do painel de definições.
 */
export function CompanySettingsOrchestrator() {
    const { currentCompany, user } = useAuth();

    // --- ESTADOS DE NAVEGAÇÃO E UI ---
    const [activeTab, setActiveTab] = useState<SettingsTab>('details');
    const [statusFlags, setStatusFlags] = useState({ data: false, contract: false, payment: false, approval: false, data_email_verified: false });

    // --- ESTADOS DE DADOS (EQUIPA E DOCUMENTOS) ---
    const [team, setTeam] = useState<MemberResponse[]>([]);
    const [clientDocs, setClientDocs] = useState<any[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);

    // --- ESTADOS IBGE ---
    const [ufs, setUfs] = useState<{ sigla: string; nome: string }[]>([]);
    const [cities, setCities] = useState<{ nome: string }[]>([]);

    // --- FORMULÁRIOS ---
    const companyForm = useForm<CompanyFormSchema>();
    const passwordForm = useForm<PasswordFormSchema>();
    const profileForm = useForm<ProfileFormSchema>();

    const selectedUf = companyForm.watch('estado');

    // --- EFEITOS INICIAIS ---
    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(res => res.json())
            .then(data => setUfs(data))
            .catch(err => console.error("Erro ao buscar UFs:", err));
    }, []);

    useEffect(() => {
        if (!selectedUf) { setCities([]); return; }
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`)
            .then(res => res.json())
            .then(data => setCities(data))
            .catch(err => console.error("Erro ao buscar Cidades:", err));
    }, [selectedUf]);

    useEffect(() => {
        async function loadAllData() {
            if (!currentCompany?.id) return;
            try {
                // A. Empresa
                const freshCompany = await companyService.getById(currentCompany.id) as any;
                setStatusFlags({
                    data: freshCompany.is_data_completed || false,
                    contract: freshCompany.is_contract_signed || false,
                    payment: freshCompany.is_payment_active || false,
                    approval: freshCompany.is_admin_verified || false,
                    data_email_verified: freshCompany.is_email_verified || (user as any)?.is_email_verified || false
                });

                companyForm.reset({
                    razao_social: freshCompany.razao_social || freshCompany.name || currentCompany.razao_social,
                    cnpj: freshCompany.cnpj || currentCompany.cnpj,
                    nome_fantasia: freshCompany.nome_fantasia || '',
                    email_corporativo: freshCompany.email_corporativo || (user as any)?.email || user?.sub || '',
                    telefone: freshCompany.telefone || '',
                    responsavel_nome: freshCompany.responsavel_nome || '',
                    cep: freshCompany.cep || '',
                    logradouro: freshCompany.logradouro || '',
                    numero: freshCompany.numero || '',
                    bairro: freshCompany.bairro || '',
                    cidade: freshCompany.cidade || '',
                    estado: freshCompany.estado || ''
                });

                // B. Perfil
                const { data: userData } = await api.get('/users/me');
                profileForm.reset({
                    nome: userData.nome || userData.name || userData.full_name || '',
                    cpf: userData.cpf || userData.documento || '',
                    rg: userData.rg || '',
                    celular: userData.celular || '',
                    genero: userData.genero || '',
                    nacionalidade: userData.nacionalidade || '',
                    estado_civil: userData.estado_civil || '',
                    profissao: userData.profissao || ''
                });
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            }
        }

        if (currentCompany) {
            loadAllData();
            if (activeTab === 'team') loadTeamData();
            if (activeTab === 'documents') loadClientDocuments();
        }
    }, [currentCompany, activeTab, companyForm, profileForm, user]);

    async function loadTeamData() {
        if (!currentCompany?.id) return;
        try {
            const members = await companyService.getTeam(currentCompany.id);
            setTeam(members);
        } catch (error) { console.error(error); }
    }

    async function loadClientDocuments() {
        if (!currentCompany?.id) return;
        setIsLoadingDocs(true);
        try {
            const { data } = await api.get(`/documents/?company_id=${currentCompany.id}&is_client_upload=true`);
            setClientDocs(data);
        } catch (error) {
            console.error("Erro ao buscar documentos", error);
        } finally {
            setIsLoadingDocs(false);
        }
    }

    // --- FUNÇÕES DE SALVAR ---
    const onSaveDetails = async (data: CompanyFormSchema) => {
        if (!currentCompany?.id) return;
        try {
            const payload: CompanyUpdatePayload = { ...data };
            await companyService.update(currentCompany.id, payload);
            await api.patch(`/companies/${currentCompany.id}/onboarding-step?step=data`);
            setStatusFlags(prev => ({ ...prev, data: true }));
            toast.success("Dados da empresa atualizados com sucesso!");
        } catch (error) {
            toast.error("Erro ao salvar alterações.");
        }
    };

    const onSaveProfile = async (data: ProfileFormSchema) => {
        try {
            await api.patch('/users/me', data);
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            toast.error("Erro ao atualizar o perfil.");
        }
    };

    const onChangePassword = async (data: PasswordFormSchema) => {
        if (data.password !== data.confirmPassword) {
            toast.error("As senhas novas não coincidem.");
            return;
        }
        try {
            // Agora enviamos a senha atual junto com a nova senha para o backend validar
            await api.patch('/users/me', {
                current_password: data.currentPassword,
                password: data.password
            });
            toast.success("Senha alterada com sucesso!");
            passwordForm.reset();
        } catch (error: any) {
            // Tratamento de erro específico para senha atual incorreta
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error("Senha atual incorreta.");
            } else {
                toast.error("Erro ao alterar senha. Tente novamente.");
            }
        }
    };

    // --- FUNÇÕES DE DOCUMENTAÇÃO ---
    const handleUploadDoc = async (file: File, docTitle: string) => {
        if (!currentCompany?.id) return;
        const toastId = toast.loading("Enviando arquivo...");
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", docTitle);
            formData.append("company_id", currentCompany.id);
            formData.append("is_client_upload", "true");

            await api.post("/documents/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success(`${docTitle} enviado com sucesso!`, { id: toastId });
            loadClientDocuments();
        } catch (error) {
            toast.error("Erro no envio.", { id: toastId });
        }
    };

    const handleDownloadDoc = async (docId: string, filename: string) => {
        try {
            const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Erro ao baixar documento.");
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!window.confirm("Tem certeza que deseja excluir permanentemente este documento?")) return;
        try {
            const toastId = toast.loading("A excluir...");
            await api.delete(`/documents/${docId}`);
            toast.success("Documento excluído.", { id: toastId });
            loadClientDocuments();
        } catch (error) {
            toast.error("Erro ao excluir documento.");
        }
    };

    const handleResendVerification = async () => {
        const email = companyForm.getValues('email_corporativo');

        if (!email) {
            toast.error("Por favor, preencha o e-mail corporativo primeiro.");
            return;
        }

        const toastId = toast.loading("Enviando link de verificação...");

        try {
            // Atenção: Ajuste a rota '/auth/resend-verification' para bater certinho com seu Backend (FastAPI/Node)
            await api.post('/auth/resend-verification', { email });

            toast.success("Link enviado com sucesso!", {
                id: toastId,
                description: "Verifique sua caixa de entrada e pasta de spam."
            });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao reenviar e-mail. Tente novamente.", { id: toastId });
        }
    };

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
                    currentCompany={currentCompany}
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