import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { PncpLeadSyncRequest } from '../../../types';
import { BRAZILIAN_UFS } from './leadFormatters';

interface SyncLeadsModalProps {
    isSyncing: boolean;
    onClose: () => void;
    onSync: (payload: PncpLeadSyncRequest) => Promise<void>;
}

export function SyncLeadsModal({ isSyncing, onClose, onSync }: SyncLeadsModalProps) {
    const [uf, setUf] = useState<string>('');
    const [diasRetroativos, setDiasRetroativos] = useState<string>('7');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const parsedDays = Number.parseInt(diasRetroativos, 10);
        await onSync({
            uf: uf || null,
            dias_retroativos: Number.isNaN(parsedDays) ? 7 : Math.min(90, Math.max(1, parsedDays)),
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sync-leads-modal-title"
        >
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="sync-leads-modal-title" className="text-lg font-semibold text-slate-900">
                                Sincronizar Leads do PNCP
                            </h2>
                            <p className="text-xs text-slate-500">
                                Extrai fornecedores de contratações recentes preservando histórico anti-SPAM.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar modal de sincronização"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="sync-uf" className="text-sm font-medium text-slate-700">
                            UF (Opcional)
                        </label>
                        <select
                            id="sync-uf"
                            value={uf}
                            onChange={(e) => setUf(e.target.value)}
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

                    <Input
                        id="sync-dias-retroativos"
                        label="Dias Retroativos"
                        type="number"
                        min={1}
                        max={90}
                        value={diasRetroativos}
                        onChange={(e) => setDiasRetroativos(e.target.value)}
                        helperText="Período de busca nas publicações do PNCP (entre 1 e 90 dias)."
                        required
                    />

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSyncing}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isSyncing}>
                            Iniciar Extração
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
