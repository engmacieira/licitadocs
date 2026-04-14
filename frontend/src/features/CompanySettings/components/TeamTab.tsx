import { useState } from 'react';
import { Plus, Mail, ShieldCheck, Edit, Trash2, Calendar, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../components/ui/Button';
import { companyService } from '../../../services/companyService';
import type { MemberResponse } from '../../../types';

/**
 * Propriedades do componente TeamTab.
 * @interface TeamTabProps
 */
interface TeamTabProps {
    team: MemberResponse[];
    currentCompanyId: string;
    loadTeamData: () => void;
    user: any;
}

/**
 * Componente visual que gere a equipa da empresa, permitindo convidar
 * novos utilizadores e gerir permissões (MASTER vs VIEWER).
 */
export function TeamTab({ team, currentCompanyId, loadTeamData, user }: TeamTabProps) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviting, setInviting] = useState(false);

    const [editingMember, setEditingMember] = useState<MemberResponse | null>(null);
    const [editRole, setEditRole] = useState<'MASTER' | 'VIEWER'>('VIEWER');
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setInviting(true);
        try {
            const res = await companyService.inviteMember(currentCompanyId, { email: inviteEmail, role: 'VIEWER' });
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
        if (member.user_id === user?.id || member.user_id === user?.sub) {
            toast.error("Ação não permitida", { description: "Você não pode editar a sua própria permissão." });
            return;
        }
        setEditingMember(member);
        setEditRole(member.role as 'MASTER' | 'VIEWER');
    };

    const confirmEditMember = async () => {
        if (!editingMember) return;
        setIsUpdatingRole(true);
        try {
            await companyService.updateMemberRole(currentCompanyId, editingMember.user_id, editRole);
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
        if (member.user_id === user?.id || member.user_id === user?.sub) {
            toast.error("Você não pode remover a si mesmo.");
            return;
        }
        if (!window.confirm(`Remover acesso de ${member.email}?`)) return;

        try {
            const toastId = toast.loading("Removendo...");
            await companyService.removeMember(currentCompanyId, member.user_id);
            toast.success("Membro removido!", { id: toastId });
            loadTeamData();
        } catch (error) {
            toast.error("Erro ao remover membro.");
        }
    };

    return (
        <>
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
                                className="pl-10 w-full rounded-lg border-slate-200 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                                            <div className="p-2 text-slate-300 cursor-not-allowed" title="Master não pode ser removido"><ShieldCheck size={18} /></div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* MODAL INTERNO DE EDIÇÃO */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900">Editar Permissões</h3>
                            <button onClick={() => setEditingMember(null)}><XCircle className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm font-medium text-slate-700">Membro: <span className="font-bold text-slate-900">{editingMember.email}</span></p>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">Nível de Acesso:</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 py-2.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
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
                            <Button onClick={confirmEditMember} isLoading={isUpdatingRole} className="bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}