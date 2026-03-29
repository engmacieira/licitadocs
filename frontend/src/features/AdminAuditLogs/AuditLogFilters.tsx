import React, { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { AuditLogFilters as IAuditLogFilters } from '../../schemas/audit';

interface Props {
    filters: IAuditLogFilters;
    onFilterChange: (filters: Partial<IAuditLogFilters>) => void;
    onReset: () => void;
}

export function AuditLogFilters({ filters, onFilterChange, onReset }: Props) {
    const [localFilters, setLocalFilters] = useState<Partial<IAuditLogFilters>>(filters);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value || undefined }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange(localFilters);
    };

    const handleReset = () => {
        setLocalFilters({});
        onReset();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Entidade (Ex: User, Company)</label>
                <input
                    type="text"
                    name="entity_name"
                    value={localFilters.entity_name || ''}
                    onChange={handleChange}
                    className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                    placeholder="Nome da Entidade"
                />
            </div>

            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Ação</label>
                <select
                    name="action"
                    value={localFilters.action || ''}
                    onChange={handleChange}
                    className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border bg-white"
                >
                    <option value="">Todas</option>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                </select>
            </div>

            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">ID da Entidade</label>
                <input
                    type="text"
                    name="entity_id"
                    value={localFilters.entity_id || ''}
                    onChange={handleChange}
                    className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                    placeholder="UUID da Entidade"
                />
            </div>

            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">ID da Requisição</label>
                <input
                    type="text"
                    name="request_id"
                    value={localFilters.request_id || ''}
                    onChange={handleChange}
                    className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                    placeholder="UUID da Requisição"
                />
            </div>

            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">ID do Usuário</label>
                <input
                    type="text"
                    name="user_id"
                    value={localFilters.user_id || ''}
                    onChange={handleChange}
                    className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                    placeholder="UUID do Usuário"
                />
            </div>

            <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Data Início</label>
                <input
                    type="date"
                    name="start_date"
                    value={localFilters.start_date ? localFilters.start_date.split('T')[0] : ''}
                    onChange={e => setLocalFilters(prev => ({ ...prev, start_date: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                />
            </div>

            <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Data Fim</label>
                <input
                    type="date"
                    name="end_date"
                    value={localFilters.end_date ? localFilters.end_date.split('T')[0] : ''}
                    onChange={e => setLocalFilters(prev => ({ ...prev, end_date: e.target.value ? new Date(e.target.value + 'T23:59:59.999Z').toISOString() : undefined }))}
                    className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                />
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                    <Search className="w-4 h-4 mr-2" />
                    Filtrar
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium border border-slate-200"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Limpar
                </button>
            </div>
        </form>
    );
}
