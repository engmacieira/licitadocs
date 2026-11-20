import { useCallback, useEffect, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Mail,
    MessageSquarePlus,
    Phone,
    Radar,
    RefreshCw,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatsCard } from '../../../components/ui/StatsCard';
import { pncpLeadService } from '../../../services/pncpLeadService';
import type {
    PncpLeadContactRequest,
    PncpLeadContactStatus,
    PncpLeadResponse,
    PncpLeadStats,
    PncpLeadSyncRequest,
} from '../../../types';
import { ContactLeadModal } from './ContactLeadModal';
import { SyncLeadsModal } from './SyncLeadsModal';
import {
    BRAZILIAN_UFS,
    formatCnpj,
    formatLastContactDate,
    formatPhone,
    formatRelativeContactTime,
} from './leadFormatters';

const DEFAULT_PAGE_LIMIT = 50;

export function AdminLeadsPage() {
    const [leads, setLeads] = useState<PncpLeadResponse[]>([]);
    const [stats, setStats] = useState<PncpLeadStats>({
        total: 0,
        ready_for_contact: 0,
        in_cooldown: 0,
    });
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    // Filtros e paginação
    const [search, setSearch] = useState<string>('');
    const [uf, setUf] = useState<string>('');
    const [contactStatus, setContactStatus] = useState<PncpLeadContactStatus>('all');
    const [skip, setSkip] = useState<number>(0);

    // Modais e ações
    const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [selectedLead, setSelectedLead] = useState<PncpLeadResponse | null>(null);
    const [isRegisteringContact, setIsRegisteringContact] = useState<boolean>(false);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const response = await pncpLeadService.listLeads({
                search: search.trim() || undefined,
                uf: uf || undefined,
                contact_status: contactStatus,
                skip,
                limit: DEFAULT_PAGE_LIMIT,
            });
            setLeads(response.items);
            setTotal(response.total);
            setStats(response.stats);
        } catch {
            toast.error('Erro ao carregar leads do PNCP');
        } finally {
            setLoading(false);
        }
    }, [search, uf, contactStatus, skip]);

    useEffect(() => {
        void fetchLeads();
    }, [fetchLeads]);

    const handleSyncLeads = async (payload: PncpLeadSyncRequest) => {
        setIsSyncing(true);
        try {
            const result = await pncpLeadService.syncLeads(payload);
            const summary = `${result.created} novos, ${result.updated} atualizados (${result.fetched} extraídos)`;
            if (result.errors.length > 0) {
                toast(`Sincronização concluída com avisos: ${summary}`);
            } else {
                toast.success(`Sincronização concluída: ${summary}`);
            }
            setIsSyncModalOpen(false);
            setSkip(0);
            await fetchLeads();
        } catch {
            toast.error('Falha ao sincronizar leads do PNCP');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRegisterContact = async (leadId: string, payload: PncpLeadContactRequest) => {
        setIsRegisteringContact(true);
        try {
            const response = await pncpLeadService.registerContact(leadId, payload);
            if (response.was_in_cooldown) {
                toast(
                    response.warning_message ||
                        'Contato registrado durante a janela de cooldown anti-SPAM.'
                );
            } else {
                toast.success('Contato registrado com sucesso!');
            }
            setSelectedLead(null);
            await fetchLeads();
        } catch {
            toast.error('Não foi possível registrar o contato');
        } finally {
            setIsRegisteringContact(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setSkip(0);
    };

    const handleUfChange = (value: string) => {
        setUf(value);
        setSkip(0);
    };

    const handleStatusChange = (value: PncpLeadContactStatus) => {
        setContactStatus(value);
        setSkip(0);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Radar className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leads PNCP</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Prospecção de fornecedores extraídos do PNCP com controle anti-SPAM.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => void fetchLeads()} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button onClick={() => setIsSyncModalOpen(true)}>
                        <Radar className="w-4 h-4 mr-2" />
                        Sincronizar PNCP
                    </Button>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Resumo de Leads">
                <StatsCard
                    title="Total Extraído"
                    value={stats.total}
                    icon={Users}
                    color="purple"
                    description="Leads ativos na base PNCP"
                    loading={loading}
                />
                <StatsCard
                    title="Prontos para Contato"
                    value={stats.ready_for_contact}
                    icon={ShieldCheck}
                    color="green"
                    description="Fora da janela de cooldown"
                    loading={loading}
                />
                <StatsCard
                    title="Em Cooldown Anti-SPAM"
                    value={stats.in_cooldown}
                    icon={AlertTriangle}
                    color="amber"
                    description="Contatados recentemente"
                    loading={loading}
                />
            </section>

            <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-6">
                        <Input
                            id="leads-search-input"
                            label="Buscar Lead"
                            placeholder="Buscar por CNPJ, Razão Social, Nome Fantasia ou E-mail..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            icon={<Search className="w-4 h-4" />}
                        />
                    </div>

                    <div className="md:col-span-3 space-y-1.5">
                        <label htmlFor="leads-uf-filter" className="text-sm font-medium text-slate-700">
                            UF
                        </label>
                        <select
                            id="leads-uf-filter"
                            value={uf}
                            onChange={(e) => handleUfChange(e.target.value)}
                            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value="">Todas as UFs</option>
                            {BRAZILIAN_UFS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-3 space-y-1.5">
                        <label htmlFor="leads-status-filter" className="text-sm font-medium text-slate-700">
                            Status Anti-SPAM
                        </label>
                        <select
                            id="leads-status-filter"
                            value={contactStatus}
                            onChange={(e) => handleStatusChange(e.target.value as PncpLeadContactStatus)}
                            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value="all">Todos</option>
                            <option value="ready">Prontos</option>
                            <option value="cooldown">Em Cooldown</option>
                            <option value="never_contacted">Nunca Contatados</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <th className="px-4 py-3.5">CNPJ / Empresa</th>
                                <th className="px-4 py-3.5">Contato</th>
                                <th className="px-4 py-3.5">UF / Município</th>
                                <th className="px-4 py-3.5">Último Contato</th>
                                <th className="px-4 py-3.5">Status Anti-SPAM</th>
                                <th className="px-4 py-3.5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-4">
                                            <Skeleton className="h-4 w-44 mb-2" />
                                            <Skeleton className="h-3 w-32" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <Skeleton className="h-4 w-36 mb-2" />
                                            <Skeleton className="h-3 w-28" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <Skeleton className="h-4 w-24" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <Skeleton className="h-4 w-32 mb-1" />
                                            <Skeleton className="h-3 w-20" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <Skeleton className="h-6 w-32 rounded-full" />
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <Skeleton className="h-8 w-32 ml-auto rounded-lg" />
                                        </td>
                                    </tr>
                                ))
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Nenhum lead encontrado com os filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => {
                                    const relativeTime = formatRelativeContactTime(lead.last_contacted_at);
                                    return (
                                        <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-4 align-top">
                                                <div className="font-semibold text-slate-900">
                                                    {lead.razao_social}
                                                </div>
                                                {lead.nome_fantasia && (
                                                    <div className="text-xs text-slate-500">
                                                        {lead.nome_fantasia}
                                                    </div>
                                                )}
                                                <div className="text-xs font-mono text-slate-600 mt-1">
                                                    {formatCnpj(lead.cnpj)}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 align-top space-y-1">
                                                <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span>{formatPhone(lead.telefone)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="truncate max-w-[220px]">
                                                        {lead.email || '—'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 align-top text-slate-700">
                                                {lead.uf || lead.municipio ? (
                                                    <span>
                                                        {lead.uf || '—'}
                                                        {lead.municipio ? ` • ${lead.municipio}` : ''}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                <div className="text-slate-800 text-xs font-medium">
                                                    {formatLastContactDate(lead.last_contacted_at)}
                                                </div>
                                                {relativeTime && (
                                                    <div className="text-xs text-slate-500">{relativeTime}</div>
                                                )}
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {lead.contact_count}{' '}
                                                    {lead.contact_count === 1 ? 'contato' : 'contatos'}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                {lead.is_in_cooldown ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        Cooldown ({lead.cooldown_remaining_days}d restantes)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Pronto para contato
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-4 align-top text-right">
                                                <Button
                                                    size="sm"
                                                    variant={lead.is_in_cooldown ? 'outline' : 'primary'}
                                                    onClick={() => setSelectedLead(lead)}
                                                >
                                                    <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" />
                                                    Registrar Contato
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-sm text-slate-600 font-medium">
                <span>
                    Mostrando {leads.length} de {total} leads
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSkip(Math.max(0, skip - DEFAULT_PAGE_LIMIT))}
                        disabled={skip === 0 || loading}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSkip(skip + DEFAULT_PAGE_LIMIT)}
                        disabled={skip + DEFAULT_PAGE_LIMIT >= total || loading}
                    >
                        Próxima
                    </Button>
                </div>
            </div>

            {isSyncModalOpen && (
                <SyncLeadsModal
                    isSyncing={isSyncing}
                    onClose={() => setIsSyncModalOpen(false)}
                    onSync={handleSyncLeads}
                />
            )}

            {selectedLead && (
                <ContactLeadModal
                    lead={selectedLead}
                    isSubmitting={isRegisteringContact}
                    onClose={() => setSelectedLead(null)}
                    onSubmit={handleRegisterContact}
                />
            )}
        </div>
    );
}
