import { useFormContext } from 'react-hook-form';
import { AlertTriangle, CheckCircle, XOctagon } from 'lucide-react';

/**
 * Componente acoplado ao react-hook-form que gere o campo de status de regularidade
 * e as observações. Força a obrigatoriedade da observação se houver irregularidade.
 */
export function RegularityAnalysis() {
    const { register, watch } = useFormContext();
    const currentStatus = watch('status');

    const getStatusHeader = () => {
        switch (currentStatus) {
            case 'error':
                return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: <XOctagon className="h-4 w-4 text-red-600" /> };
            case 'irregular':
                return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle className="h-4 w-4 text-amber-600" /> };
            default:
                return { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: <CheckCircle className="h-4 w-4 text-green-600" /> };
        }
    };

    const header = getStatusHeader();

    return (
        <div className={`p-5 rounded-xl border ${header.border} ${header.bg} transition-colors min-h-[140px] flex flex-col`}>
            <div className={`flex items-center gap-2 font-semibold text-sm mb-3 border-b ${header.border} pb-2 ${header.color}`}>
                {header.icon}
                <span>Análise de Regularidade</span>
            </div>

            <div className="space-y-3 flex-1">
                <div>
                    <label htmlFor="document-status" className={`text-xs font-medium block mb-1 ${header.color}`}>Status do Documento *</label>
                    <select
                        id="document-status"
                        className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 outline-none ${currentStatus === 'error' ? 'focus:ring-red-300 border-red-300' : currentStatus === 'irregular' ? 'focus:ring-amber-300 border-amber-300' : 'focus:ring-green-300 border-green-200'}`}
                        {...register('status')}
                    >
                        <option value="valid">Válido (Regular / Negativa)</option>
                        <option value="irregular">Irregular (Positiva / Vencida / Inválida)</option>
                        <option value="error">Erro na Emissão (Indisponível / Falha no Órgão)</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="document-notes" className={`text-xs font-medium block mb-1 ${header.color}`}>
                        Observações {currentStatus !== 'valid' && '*'}
                    </label>
                    <textarea
                        id="document-notes"
                        placeholder={currentStatus === 'valid' ? "Opcional: Ex: Autenticado via QR Code..." : "Obrigatório: Descreva o motivo da irregularidade ou erro..."}
                        className={`w-full text-sm p-3 rounded-lg border bg-white focus:ring-2 outline-none resize-none h-20 ${currentStatus === 'error' ? 'border-red-200 focus:ring-red-500' : currentStatus === 'irregular' ? 'border-amber-200 focus:ring-amber-500' : 'border-green-200 focus:ring-green-500'}`}
                        {...register('notes')}
                    />
                </div>

            </div>
        </div>
    );
}