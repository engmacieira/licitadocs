import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { documentService } from '../../services/documentService';
import type { DocumentTypeDTO, DocumentTypeCreateDTO, DocumentTypeUpdateDTO } from '../../services/documentService';

interface TypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categoryId: string;
    initialData?: DocumentTypeDTO | null;
}

export function TypeModal({ isOpen, onClose, onSuccess, categoryId, initialData }: TypeModalProps) {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<DocumentTypeCreateDTO>({
        defaultValues: initialData
            ? {
                ...initialData,
                automation_config: initialData.automation_config || { is_automatable: false, requires_captcha: false }
            }
            : {
                category_id: categoryId,
                validity_days_default: 30,
                scope: 'NATIONAL',
                automation_config: { is_automatable: false, requires_captcha: false }
            }
    });

    const [isSaving, setIsSaving] = useState(false);
    const isEdit = !!initialData;

    const isAutomatable = watch('automation_config.is_automatable');

    const onSubmit = async (data: DocumentTypeCreateDTO) => {
        setIsSaving(true);
        try {
            if (isEdit && initialData) {
                await documentService.updateType(initialData.id, data as DocumentTypeUpdateDTO);
                toast.success("Documento atualizado!");
            } else {
                await documentService.createType({ ...data, category_id: categoryId });
                toast.success("Documento adicionado à categoria!");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao salvar documento.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h2 className="text-lg font-semibold text-slate-800">{isEdit ? 'Editar Documento' : 'Novo Documento'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Documento</label>
                        <input {...register('name', { required: true })} placeholder="Ex: CND Federal" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        {errors.name && <span className="text-xs text-red-500">Obrigatório</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Identificador (Slug)</label>
                        <input {...register('slug', { required: true })} placeholder="Ex: cnd_federal" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Abrangência (Escopo) *</label>
                        <select
                            {...register('scope', { required: true })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        >
                            <option value="NATIONAL">Nacional (Ex: Receita Federal, FGTS)</option>
                            <option value="STATE">Estadual (Ex: SEFAZ, Junta Comercial)</option>
                            <option value="MUNICIPAL">Municipal (Ex: Prefeitura, ISS)</option>
                        </select>
                        {errors.scope && <span className="text-xs text-red-500">Obrigatório</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dias de Validade Padrão</label>
                        <input type="number" {...register('validity_days_default', { required: true, valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        <p className="text-xs text-slate-400 mt-1">Coloque 0 se o documento não tiver validade (Permanente).</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Instruções / Descrição (Opcional)</label>
                        <textarea {...register('description')} rows={3} placeholder="Instruções para o uploader..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('automation_config.is_automatable')}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-800">É Automatizável? (Buscar via Robô)</span>
                        </label>
                    </div>

                    {isAutomatable && (
                        <div className="space-y-4 pt-2 pl-4 border-l-2 border-blue-200 mt-2 bg-slate-50 p-4 rounded-r-lg">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Estratégia (Robô)</label>
                                <input
                                    {...register('automation_config.strategy_name')}
                                    placeholder="Ex: TST_CRAWLER_V1"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">O nome exato da classe na CrawlerFactory do backend.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">URL Fonte do Órgão (Opcional)</label>
                                <input
                                    {...register('automation_config.source_url')}
                                    placeholder="Ex: https://www.tst.jus.br/..."
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...register('automation_config.requires_captcha')}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">Requer Quebra de Captcha</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Frequência de Busca (Cron)</label>
                                <input
                                    {...register('automation_config.cron_schedule')}
                                    placeholder="Ex: 0 0 * * * (Diário)"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3 pb-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'A salvar...' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}