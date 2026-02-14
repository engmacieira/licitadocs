import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Building2, Users, Save, Plus, Mail,
    CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
    FileSignature, CreditCard, FileText, RefreshCw, Lock, KeyRound
} from 'lucide-react';

// Contexto e Serviços
import { useAuth } from '../../../contexts/AuthContext';
import { companyService } from '../../../services/companyService';
import { documentService } from '../../../services/documentService';
import api from '../../../services/api';
import type { CompanyUpdatePayload, MemberResponse } from '../../../services/companyService';

// Componentes UI
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Skeleton } from '../../../components/ui/Skeleton';

// Interface do Formulário da Empresa
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
}

// Interface do Formulário de Senha
interface PasswordFormSchema {
    password: string;
    confirmPassword: string;
}

export function CompanySettings() {
    const { currentCompany, user } = useAuth();

    // Estados
    const [activeTab, setActiveTab] = useState<'details' | 'team' | 'documents' | 'security'>('details');
    const [team, setTeam] = useState<MemberResponse[]>([]);
    const [statusFlags, setStatusFlags] = useState({
        contract: false,
        payment: false,
        approval: false
    });

    // --- FORMULÁRIOS ---
    const companyForm = useForm<CompanyFormSchema>();
    const passwordForm = useForm<PasswordFormSchema>();

    // 1. CARREGAR DADOS AO ABRIR
    useEffect(() => {
        async function loadFreshData() {
            if (!currentCompany?.id) return;

            try {
                // A. Busca dados atualizados do banco
                const freshCompany = await companyService.getById(currentCompany.id) as any;

                // B. Atualiza as flags de status
                setStatusFlags({
                    contract: freshCompany.is_contract_signed || false,
                    payment: freshCompany.is_payment_active || false,
                    approval: freshCompany.is_admin_verified || false
                });

                // C. Preenche o formulário
                companyForm.reset({
                    razao_social: freshCompany.razao_social || freshCompany.name || currentCompany.razao_social,
                    cnpj: freshCompany.cnpj || currentCompany.cnpj,

                    nome_fantasia: freshCompany.nome_fantasia || '',

                    // CORREÇÃO: Usamos user.sub (que contem o email no JWT)
                    email_corporativo: freshCompany.email_corporativo || user?.sub || '',

                    telefone: freshCompany.telefone || '',
                    responsavel_nome: freshCompany.responsavel_nome || '',
                    cep: freshCompany.cep || '',
                    logradouro: freshCompany.logradouro || '',
                    numero: freshCompany.numero || '',
                    bairro: freshCompany.bairro || '',
                    cidade: freshCompany.cidade || ''
                });

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                toast.error("Não foi possível carregar os dados atualizados.");
            }
        }

        if (currentCompany) {
            loadFreshData();
            if (activeTab === 'team') loadTeamData();
        }
        // CORREÇÃO: Dependência user?.sub em vez de user?.email
    }, [currentCompany, activeTab, companyForm.reset, user?.sub]);

    // Carregar Equipe
    async function loadTeamData() {
        if (!currentCompany?.id) return;
        try {
            const members = await companyService.getTeam(currentCompany.id);
            setTeam(members);
        } catch (error) {
            console.error(error);
        }
    }

    // Ação: Salvar Dados da Empresa
    const onSaveDetails = async (data: CompanyFormSchema) => {
        if (!currentCompany?.id) return;
        try {
            const payload: CompanyUpdatePayload = {
                razao_social: data.razao_social,
                nome_fantasia: data.nome_fantasia,
                email_corporativo: data.email_corporativo,
                telefone: data.telefone,
                responsavel_nome: data.responsavel_nome,
                cep: data.cep,
                logradouro: data.logradouro,
                numero: data.numero,
                bairro: data.bairro,
                cidade: data.cidade
            };

            await companyService.update(currentCompany.id, payload);
            toast.success("Dados da empresa atualizados!");
        } catch (error) {
            toast.error("Erro ao salvar alterações.");
        }
    };

    // Ação: Alterar Senha (Usuário)
    const onChangePassword = async (data: PasswordFormSchema) => {
        if (data.password !== data.confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }
        if (data.password.length < 8) {
            toast.error("A senha deve ter no mínimo 8 caracteres.");
            return;
        }

        try {
            await api.patch('/users/me', { password: data.password });
            toast.success("Senha alterada com sucesso!");
            passwordForm.reset();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao alterar senha.");
        }
    };

    // Ação: Convidar
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

    // Ação: Re-upload
    const handleReupload = async (file: File, type: string) => {
        if (!currentCompany?.id) return;
        const toastId = toast.loading("Enviando arquivo...");
        try {
            await documentService.upload(file, type, currentCompany.id);
            toast.success("Documento atualizado!", { id: toastId });
        } catch (error) {
            toast.error("Erro no envio.", { id: toastId });
        }
    };

    const isRegular = statusFlags.contract && statusFlags.payment && statusFlags.approval;

    if (!currentCompany) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        Gerencie os dados da <span className="font-semibold text-slate-700">{currentCompany.razao_social}</span>
                    </p>
                </div>

                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-medium ${isRegular ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                    {isRegular ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {isRegular ? "Empresa Regular" : "Pendências Cadastrais"}
                </div>
            </div>

            {/* Abas de Navegação */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
                <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={Building2} label="Dados Cadastrais" />
                <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={FileText} label="Documentação" />
                <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={Users} label="Equipe" />
                <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={ShieldCheck} label="Segurança" />
            </div>

            {/* --- ABA 1: DADOS CADASTRAIS --- */}
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
                                    <Input label="Nome Fantasia" {...companyForm.register("nome_fantasia")} />
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
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Input label="Número" {...companyForm.register("numero")} />
                                    <div className="md:col-span-2">
                                        <Input label="Bairro" {...companyForm.register("bairro")} />
                                    </div>
                                    <Input label="Cidade/UF" {...companyForm.register("cidade")} />
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <Button type="submit" isLoading={companyForm.formState.isSubmitting} className="w-full md:w-auto">
                                        <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Widget Situação Cadastral */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-4">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-blue-600" /> Situação Cadastral
                            </h3>
                            <div className="space-y-4">
                                <StatusItem label="Contrato SaaS" status={statusFlags.contract} icon={FileSignature} textTrue="Assinado" textFalse="Pendente" />
                                <StatusItem label="Mensalidade" status={statusFlags.payment} icon={CreditCard} textTrue="Ativo" textFalse="Pendente" />
                                <StatusItem label="Compliance" status={statusFlags.approval} icon={ShieldCheck} textTrue="Aprovado" textFalse="Em análise" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ABA 2: DOCUMENTAÇÃO --- */}
            {activeTab === 'documents' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
                    <DocUploadCard title="Contrato Social" description="Última alteração consolidada." onUpload={(f) => handleReupload(f, "Contrato Social")} />
                    <DocUploadCard title="Cartão CNPJ" description="Emitido no site da Receita." onUpload={(f) => handleReupload(f, "Cartão CNPJ")} />
                    <DocUploadCard title="Doc. do Responsável" description="RG ou CNH do sócio administrador." onUpload={(f) => handleReupload(f, "Documento Identidade")} />
                    <div className="md:col-span-3 bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 text-sm text-blue-800">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p><strong>Atenção:</strong> O envio de novos documentos reiniciará o processo de validação pela nossa equipe.</p>
                    </div>
                </div>
            )}

            {/* --- ABA 3: EQUIPE --- */}
            {activeTab === 'team' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="md:col-span-1 bg-blue-50 p-6 rounded-xl border border-blue-100 h-fit">
                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Plus className="h-4 w-4" /> Convidar Membro</h3>
                        <div className="space-y-3 mt-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                                <input type="email" className="pl-10 w-full rounded-lg border-blue-200 py-2 focus:ring-2 focus:ring-blue-500" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@..." />
                            </div>
                            <Button onClick={handleInvite} disabled={!inviteEmail} isLoading={inviting} className="w-full">Enviar Convite</Button>
                        </div>
                    </div>
                    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-semibold text-slate-900">Membros Ativos ({team.length})</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {team.map(m => (
                                <div key={m.user_id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{m.email[0].toUpperCase()}</div>
                                        <div><p className="font-medium text-slate-900">{m.name || "Usuário"}</p><p className="text-sm text-slate-500">{m.email}</p></div>
                                    </div>
                                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">{m.role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ABA 4: SEGURANÇA (NOVA) --- */}
            {activeTab === 'security' && (
                <div className="max-w-2xl animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                            <Lock className="h-5 w-5 text-slate-500" /> Alterar Senha
                        </h3>
                        {/* CORREÇÃO: Usando user.sub aqui também */}
                        <p className="text-sm text-slate-500 mb-6">Atualize a senha de acesso do seu usuário ({user?.sub}).</p>

                        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                            <div className="space-y-4">
                                <Input
                                    type="password"
                                    label="Nova Senha"
                                    placeholder="Mínimo 8 caracteres"
                                    icon={<KeyRound className="h-4 w-4 text-slate-400" />}
                                    {...passwordForm.register("password", { required: true })}
                                />
                                <Input
                                    type="password"
                                    label="Confirmar Nova Senha"
                                    placeholder="Repita a nova senha"
                                    icon={<CheckCircle2 className="h-4 w-4 text-slate-400" />}
                                    {...passwordForm.register("confirmPassword", { required: true })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" variant="primary" isLoading={passwordForm.formState.isSubmitting}>
                                    Atualizar Senha
                                </Button>
                            </div>
                        </form>
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
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${active ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
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

function DocUploadCard({ title, description, onUpload }: { title: string, description: string, onUpload: (f: File) => void }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6">{description}</p>
            </div>
            <label className="cursor-pointer">
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                <div className="w-full py-2 px-4 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-blue-400 transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Substituir Arquivo
                </div>
            </label>
        </div>
    );
}