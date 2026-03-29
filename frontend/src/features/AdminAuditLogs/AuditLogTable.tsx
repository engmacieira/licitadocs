import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, ShieldAlert } from 'lucide-react';
import { AuditLog } from '../../schemas/audit';

interface Props {
    logs: AuditLog[];
    loading: boolean;
    onViewDetails: (log: AuditLog) => void;
}

export function AuditLogTable({ logs, loading, onViewDetails }: Props) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!logs.length) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                <ShieldAlert className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Nenhum log encontrado</h3>
                <p className="text-sm text-slate-500 mt-1">Ajuste os filtros para tentar novamente.</p>
            </div>
        );
    }

    const getActionColor = (action: string) => {
        switch (action.toUpperCase()) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Data/Hora</th>
                            <th className="px-4 py-3">Ação</th>
                            <th className="px-4 py-3">Entidade</th>
                            <th className="px-4 py-3">ID Entidade</th>
                            <th className="px-4 py-3">Usuário</th>
                            <th className="px-4 py-3">Request ID</th>
                            <th className="px-4 py-3 text-right">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                                    {log.entity_name}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-500">
                                    {log.entity_id.substring(0, 8)}...
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {log.user_id ? (
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                            {log.user_id.substring(0, 8)}...
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 italic text-xs">Sistema</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-500">
                                    {log.request_id ? log.request_id.substring(0, 8) + '...' : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => onViewDetails(log)}
                                        className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 transition-colors"
                                        title="Ver Detalhes"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
