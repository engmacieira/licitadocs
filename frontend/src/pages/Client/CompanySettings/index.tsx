import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Building2, Users, Save, Plus, Mail,
    CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
    FileSignature, CreditCard, FileText, Lock, KeyRound,
    Trash2, Edit, Calendar, UserCircle, UploadCloud, Download
} from 'lucide-react';

// Contexto e Serviços
import { useAuth } from '../../../contexts/AuthContext';
import { companyService } from '../../../services/companyService';
import api from '../../../services/api';
import type { CompanyUpdatePayload, MemberResponse } from '../../../services/companyService';

// Componentes UI
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Skeleton } from '../../../components/ui/Skeleton';

interface CompanyFormSchema {
    razao_social: string;
    cnpj: string;
    nome_fantasia: string;
    email_corporativo: string;
    telefone: string;
    responsavel_nome: string;
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
}

interface PasswordFormSchema {
    password: string;
    confirmPassword: string;
}

interface ProfileFormSchema {
    nome: string;
    cpf: string;
    rg: string;
    celular: string;
    genero: string;
    nacionalidade: string;
    estado_civil: string;
    profissao: string;
}

export function CompanySettings() {
    const { currentCompany, user } = useAuth();

    const [activeTab, setActiveTab] = useState<'details' | 'team' | 'documents' | 'profile'>('details');
    const [team, setTeam] = useState<MemberResponse[]>([]);

    const [statusFlags, setStatusFlags] = useState({
        data: false,
        contract: false,
        payment: false,
        approval: false
    });

    const [editingMember, setEditingMember] = useState<MemberResponse | null>(null);
    const [editRole, setEditRole] = useState<'MASTER' | 'VIEWER'>('VIEWER');
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    // --- ESTADOS IBGE ---
    const [ufs, setUfs] = useState<{ sigla: string; nome: string }[]>([]);
    const [cities, setCities] = useState<{ nome: string }[]>([]);

    // --- ESTADOS DE DOCUMENTAÇÃO (US-2405) ---
    const [clientDocs, setClientDocs] = useState<any[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);

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
        if (!selectedUf) {
            setCities([]);
            return;
        }
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
                    approval: freshCompany.is_admin_verified || false
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
        } catch (error) {
            console.error(error);
        }
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
            toast.error("As senhas não coincidem.");
            return;
        }
        try {
            await api.patch('/users/me', { password: data.password });
            toast.success("Senha alterada com sucesso!");
            passwordForm.reset();
        } catch (error) {
            toast.error("Erro ao alterar senha.");
        }
    };

    // --- FUNÇÕES DA EQUIPE ---
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviting, setInviting] = useState(false);

    const handleInvite = async () => {
        if (!inviteEmail || !currentCompany?.id) return;
        setInviting(true);
        try {
            const res = await companyService.inviteMember(currentCompany.id, { email: inviteEmail, role: 'VIEWER' });
            toast.success("Convite enviado!", { description: res?.message });
            setInviteEmail("");
            loadTeamData();
        } catch (error) {
            toast.error("Falha ao enviar convite.");
        } finally {
            setInviting(false);
        }
    };

    const handleEditMember = (member: MemberResponse) => {
        if (member.user_id === (user as any)?.id || member.user_id === (user as any)?.sub) {
            toast.error("Ação não permitida", { description: "Você não pode editar a sua própria permissão." });
            return;
        }
        setEditingMember(member);
        setEditRole(member.role as 'MASTER' | 'VIEWER');
    };

    const confirmEditMember = async () => {
        if (!currentCompany?.id || !editingMember) return;
        setIsUpdatingRole(true);
        try {
            await companyService.updateMemberRole(currentCompany.id, editingMember.user_id, editRole);
            toast.success(`Permissão atualizada!`);
            setEditingMember(null);
            loadTeamData();
        } catch (error) {
            toast.error("Erro ao atualizar permissão.");
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const handleRemoveMember = async (member: MemberResponse) => {
        if (member.role === 'MASTER') {
            toast.error("Um MASTER não pode ser removido.");
            return;
        }
        if (member.user_id === (user as any)?.id || member.user_id === (user as any)?.sub) {
            toast.error("Você não pode remover a si mesmo.");
            return;
        }
        if (!window.confirm(`Remover acesso de ${member.email}?`)) return;

        try {
            const toastId = toast.loading("Removendo...");
            await companyService.removeMember(currentCompany!.id, member.user_id);
            toast.success("Membro removido!", { id: toastId });
            loadTeamData();
        } catch (error) {
            toast.error("Erro ao remover membro.");
        }
    };

    // --- FUNÇÕES DE DOCUMENTAÇÃO DO CLIENTE ---
    const handleUploadDoc = async (file: File, docTitle: string) => {
        if (!currentCompany?.id) return;
        const toastId = toast.loading("Enviando arquivo...");
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", docTitle);
            formData.append("company_id", currentCompany.id); // BLINDADO!

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

            {/* Abas */}
            <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
                <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={Building2} label="Dados Cadastrais" />
                <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={FileText} label="Documentação" />
                <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={Users} label="Equipe" />
                <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserCircle} label="Meu Perfil" />
            </div>

            {/* ABA 1: DADOS */}
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Informações Gerais</h3>
                            <form onSubmit={companyForm.handleSubmit(onSaveDetails)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="opacity-75 cursor-not-allowed">
                                        <Input label="CNPJ (Imutável)" value={currentCompany.cnpj} disabled className="bg-slate-100" />
                                    </div>
                                    <Input label="Razão Social" {...companyForm.register("razao_social")} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input id="nome_fantasia" label="Nome Fantasia" {...companyForm.register("nome_fantasia")} />
                                    <Input label="E-mail Corporativo" type="email" {...companyForm.register("email_corporativo")} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Responsável Legal" {...companyForm.register("responsavel_nome")} />
                                    <Input label="Telefone / WhatsApp" {...companyForm.register("telefone")} />
                                </div>

                                <h3 className="text-lg font-semibold text-slate-900 pt-4 mb-2 border-b pb-2">Endereço</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="CEP" {...companyForm.register("cep")} />
                                    <div className="md:col-span-2">
                                        <Input label="Logradouro" {...companyForm.register("logradouro")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <Input label="Número" {...companyForm.register("numero")} />
                                    <div className="md:col-span-2">
                                        <Input label="Bairro" {...companyForm.register("bairro")} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Estado</label>
                                        <select
                                            className="w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                            {...companyForm.register("estado")}
                                        >
                                            <option value="">UF</option>
                                            {ufs.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Cidade</label>
                                        <select
                                            className="w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                                            {...companyForm.register("cidade")}
                                            disabled={!selectedUf || cities.length === 0}
                                        >
                                            <option value="">Selecione...</option>
                                            {cities.map(city => <option key={city.nome} value={city.nome}>{city.nome}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <Button type="submit" isLoading={companyForm.formState.isSubmitting} className="w-full md:w-auto">
                                        <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-4">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-blue-600" /> Situação Cadastral
                            </h3>
                            <div className="space-y-4">
                                <StatusItem label="Dados da Empresa" status={statusFlags.data} icon={Building2} textTrue="Preenchidos" textFalse="Pendentes" />
                                <StatusItem label="Contrato SaaS" status={statusFlags.contract} icon={FileSignature} textTrue="Assinado" textFalse="Pendente" />
                                <StatusItem label="Mensalidade" status={statusFlags.payment} icon={CreditCard} textTrue="Ativo" textFalse="Pendente" />
                                <StatusItem label="Compliance" status={statusFlags.approval} icon={ShieldCheck} textTrue="Aprovado" textFalse="Em análise" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 2: DOCUMENTAÇÃO (GESTOR DE ARQUIVOS US-2405) */}
            {activeTab === 'documents' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">

                    {/* Bloco de Uploads Obrigatórios */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-blue-600" /> Enviar Novos Documentos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <DocUploadCard title="Contrato Social" onUpload={(f) => handleUploadDoc(f, "Contrato Social")} />
                            <DocUploadCard title="Cartão CNPJ" onUpload={(f) => handleUploadDoc(f, "Cartão CNPJ")} />
                            <DocUploadCard title="Balanço Patrimonial" onUpload={(f) => handleUploadDoc(f, "Balanço Patrimonial")} />
                            <DocUploadCard title="Declaração (Outra)" onUpload={(f) => handleUploadDoc(f, "Declaração de Empresa")} />
                        </div>
                    </div>

                    {/* Lista de Documentos Enviados */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-slate-500" /> Arquivos da Empresa
                            </h3>
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {clientDocs.length} Arquivos
                            </span>
                        </div>

                        {isLoadingDocs ? (
                            <div className="p-6 space-y-3">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : clientDocs.length === 0 ? (
                            <div className="p-10 text-center text-slate-500">
                                <UploadCloud className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p>Nenhum documento anexado ainda.</p>
                                <p className="text-sm mt-1">Utilize os atalhos acima para enviar o Contrato Social e o Cartão CNPJ.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {clientDocs.map(doc => (
                                    <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                                <FileText size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-900 truncate">{doc.title || "Documento"}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 truncate">
                                                    <span>{doc.filename}</span>
                                                    <span>•</span>
                                                    <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button variant="outline" size="sm" onClick={() => handleDownloadDoc(doc.id, doc.filename)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDeleteDoc(doc.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ABA 3: EQUIPE */}
            {activeTab === 'team' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="xl:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-blue-600" /> Convidar Membro
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Envie um convite para acessar a plataforma.</p>
                        <div className="space-y-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="email"
                                    className="pl-10 w-full rounded-lg border-slate-200 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="email@empresa.com.br"
                                />
                            </div>
                            <Button onClick={handleInvite} disabled={!inviteEmail} isLoading={inviting} className="w-full">
                                Enviar Convite
                            </Button>
                        </div>
                    </div>

                    <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-900">Membros Ativos ({team.length})</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {team.map(m => {
                                const isMaster = m.role === 'MASTER';
                                return (
                                    <div key={m.user_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${isMaster ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-50 text-blue-600'}`}>
                                                {m.name ? m.name[0].toUpperCase() : m.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-slate-900">{m.name || "Usuário"}</p>
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-full ${isMaster ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {m.role}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500">{m.email}</p>
                                                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Entrou em {m.joined_at ? new Date(m.joined_at).toLocaleDateString('pt-BR') : 'Data não registrada'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 self-end sm:self-auto">
                                            <button onClick={() => handleEditMember(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit size={18} />
                                            </button>
                                            {!isMaster ? (
                                                <button onClick={() => handleRemoveMember(m)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={18} />
                                                </button>
                                            ) : (
                                                <div className="p-2 text-slate-300 cursor-not-allowed"><ShieldCheck size={18} /></div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 4: MEU PERFIL */}
            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                                <UserCircle className="h-5 w-5 text-blue-600" /> Informações Pessoais
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Mantenha seus dados atualizados para emissão de documentos.</p>
                            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Input label="Nome Completo" placeholder="Seu nome completo" {...profileForm.register("nome")} />
                                    </div>
                                    <Input label="CPF" placeholder="000.000.000-00" {...profileForm.register("cpf")} />
                                    <Input label="RG" placeholder="Sua identidade" {...profileForm.register("rg")} />
                                    <Input label="Nacionalidade" placeholder="Ex: Brasileiro" {...profileForm.register("nacionalidade")} />
                                    <Input label="Estado Civil" placeholder="Ex: Solteiro, Casado..." {...profileForm.register("estado_civil")} />
                                    <Input label="Profissão" placeholder="Ex: Empresário, Engenheiro..." {...profileForm.register("profissao")} />
                                    <Input label="Celular / WhatsApp" placeholder="(00) 00000-0000" {...profileForm.register("celular")} />
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Gênero</label>
                                        <select className="w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500" {...profileForm.register("genero")}>
                                            <option value="">Selecione...</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                            <option value="Outro">Outro / Prefiro não dizer</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" isLoading={profileForm.formState.isSubmitting}>
                                        <Save className="mr-2 h-4 w-4" /> Atualizar Perfil
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                                <Lock className="h-5 w-5 text-slate-500" /> Segurança
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Alterar senha de acesso.</p>
                            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                                <Input type="password" label="Nova Senha" {...passwordForm.register("password", { required: true })} />
                                <Input type="password" label="Confirmar Senha" {...passwordForm.register("confirmPassword", { required: true })} />
                                <Button type="submit" variant="outline" className="w-full" isLoading={passwordForm.formState.isSubmitting}>
                                    Trocar Senha
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* ---> ADICIONE ESTE BLOCO INFORMATIVO AQUI <--- */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>Atenção:</strong> É obrigatório o preenchimento de todos os seus dados pessoais. Eles serão utilizados para gerar automaticamente as minutas contratuais, procurações e demais documentos com validade jurídica exigidos pela plataforma.
                            </p>
                        </div>
                    </div>
                    {/* ----------------------------------------------- */}
                </div>
            )}

            {/* MODAL DE EDIÇÃO */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Editar Permissões</h3>
                            <button onClick={() => setEditingMember(null)}><XCircle className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm font-medium text-slate-700">Membro: <span className="font-bold text-slate-900">{editingMember.email}</span></p>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">Nível de Acesso:</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 py-2.5 px-3 focus:ring-2 focus:ring-blue-500"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value as 'MASTER' | 'VIEWER')}
                                >
                                    <option value="VIEWER">VIEWER (Leitura)</option>
                                    <option value="MASTER">MASTER (Gestão Total)</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setEditingMember(null)}>Cancelar</Button>
                            <Button onClick={confirmEditMember} isLoading={isUpdatingRole}>Salvar Alterações</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-componentes
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

function StatusItem({ label, status, icon: Icon, textTrue, textFalse }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${status ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="text-xs text-slate-500">{status ? textTrue : textFalse}</p>
                </div>
            </div>
            {status ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-amber-500 h-5 w-5" />}
        </div>
    );
}

function DocUploadCard({ title, onUpload }: { title: string, onUpload: (f: File) => void }) {
    return (
        <label className="cursor-pointer group">
            <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => {
                if (e.target.files?.[0]) {
                    onUpload(e.target.files[0]);
                    e.target.value = ''; // Limpa o input para permitir enviar o mesmo ficheiro de novo
                }
            }} />
            <div className="h-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 group-hover:border-blue-400 group-hover:bg-blue-50/30 transition-all text-center">
                <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-full transition-colors">
                    <UploadCloud size={24} />
                </div>
                <h3 className="font-semibold text-sm text-slate-700 group-hover:text-blue-700">{title}</h3>
            </div>
        </label>
    );
}