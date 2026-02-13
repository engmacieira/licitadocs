import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2, Users, Save, Plus, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { companyService } from '../../services/companyService';
import type { CompanyUpdatePayload, MemberResponse } from '../../services/companyService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';

export function CompanySettings() {
    const { currentCompany } = useAuth();
    const [activeTab, setActiveTab] = useState<'details' | 'team'>('details');
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<MemberResponse[]>([]);

    // Form de Dados
    const { register, handleSubmit, reset } = useForm<CompanyUpdatePayload>();

    // Carregar Dados Iniciais
    useEffect(() => {
        if (currentCompany?.id) {
            loadCompanyData();
            if (activeTab === 'team') loadTeamData();
        }
    }, [currentCompany, activeTab]);

    async function loadCompanyData() {
        try {
            // Nota: Precisamos garantir que o backend tenha GET /companies/{id}
            // Se não tiver, usamos os dados parciais do contexto por enquanto
            // Ou implementamos o GET no backend. Vamos assumir que o PUT retorna os dados atualizados.
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    }

    async function loadTeamData() {
        if (!currentCompany?.id) return;
        try {
            const members = await companyService.getTeam(currentCompany.id);
            setTeam(members);
        } catch (error) {
            toast.error("Erro ao carregar equipe.");
        }
    }

    // Ação: Salvar Dados da Empresa
    const onSaveDetails = async (data: CompanyUpdatePayload) => {
        if (!currentCompany?.id) return;
        try {
            await companyService.updateSelf(currentCompany.id, data);
            toast.success("Dados da empresa atualizados!");
        } catch (error) {
            toast.error("Erro ao atualizar dados.");
        }
    };

    // Ação: Convidar Membro
    const [inviteEmail, setInviteEmail] = useState("");
    const handleInvite = async () => {
        if (!inviteEmail || !currentCompany?.id) return;
        try {
            const res = await companyService.inviteMember(currentCompany.id, {
                email: inviteEmail,
                role: 'VIEWER' // Padrão
            });
            toast.success("Convite enviado!", {
                description: res.message.includes("Senha") ? res.message : undefined,
                duration: 10000 // Tempo maior para ler a senha se houver
            });
            setInviteEmail("");
            loadTeamData(); // Recarrega lista
        } catch (error) {
            toast.error("Falha ao enviar convite.");
        }
    };

    if (!currentCompany) return <div className="p-8">Selecione uma empresa primeiro.</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Configurações da Empresa</h1>
                <p className="text-sm text-slate-500">Gerencie dados cadastrais e acessos da {currentCompany.razao_social}</p>
            </div>

            {/* Abas */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Building2 size={16} /> Dados Cadastrais
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'team' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Users size={16} /> Gestão de Equipe
                </button>
            </div>

            {/* Conteúdo: Detalhes */}
            {activeTab === 'details' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                    <form onSubmit={handleSubmit(onSaveDetails)} className="space-y-4 max-w-2xl">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Nome Fantasia" placeholder="Ex: Matriz SP" {...register("nome_fantasia")} />
                            <Input label="E-mail Corporativo" placeholder="contato@empresa.com" {...register("email_corporativo")} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Responsável" placeholder="Nome do Gestor" {...register("responsavel_nome")} />
                            <Input label="Telefone / Whats" placeholder="(11) 99999-9999" {...register("telefone")} />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-medium text-slate-900 mb-3">Endereço</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1"><Input label="CEP" {...register("cep")} /></div>
                                <div className="col-span-2"><Input label="Logradouro" {...register("logradouro")} /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <Input label="Número" {...register("numero")} />
                                <Input label="Bairro" {...register("bairro")} />
                                <Input label="Cidade/UF" {...register("cidade")} />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit"><Save className="mr-2 h-4 w-4" /> Salvar Alterações</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Conteúdo: Equipe */}
            {activeTab === 'team' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Card de Convite */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-blue-900 mb-1">Convidar Novo Membro</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                                <input
                                    type="email"
                                    placeholder="email@colaborador.com"
                                    className="pl-10 w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-blue-600 mt-1">O usuário receberá acesso de visualização (VIEWER).</p>
                        </div>
                        <Button onClick={handleInvite} disabled={!inviteEmail}>
                            <Plus className="mr-2 h-4 w-4" /> Enviar Convite
                        </Button>
                    </div>

                    {/* Lista de Membros */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuário</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Papel</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Entrou em</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {team.map((member) => (
                                    <tr key={member.user_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                    {member.email[0].toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">{member.name || "Sem nome"}</div>
                                                    <div className="text-sm text-slate-500">{member.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.role === 'MASTER' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Ativo
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(member.joined_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {team.length === 0 && <div className="p-6 text-center text-slate-500">Nenhum membro encontrado.</div>}
                    </div>
                </div>
            )}
        </div>
    );
}