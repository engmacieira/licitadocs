import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { documentService } from '../../services/documentService';
import type { DocumentCategoryDTO, DocumentCategoryCreateDTO, DocumentCategoryUpdateDTO } from '../../services/documentService';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: DocumentCategoryDTO | null;
}

export function CategoryModal({ isOpen, onClose, onSuccess, initialData }: CategoryModalProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<DocumentCategoryCreateDTO>({
        defaultValues: initialData || { order: 0 }
    });
    const [isSaving, setIsSaving] = useState(false);
    const isEdit = !!initialData;

    const onSubmit = async (data: DocumentCategoryCreateDTO) => {
        setIsSaving(true);
        try {
            if (isEdit && initialData) {
                await documentService.updateCategory(initialData.id, data as DocumentCategoryUpdateDTO);
                toast.success("Categoria atualizada!");
            } else {
                await documentService.createCategory(data);
                toast.success("Categoria criada!");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao salvar categoria.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-semibold text-slate-800">{isEdit ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Categoria</label>
                        <input {...register('name', { required: true })} placeholder="Ex: Habilitação Jurídica" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        {errors.name && <span className="text-xs text-red-500">Obrigatório</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Identificador (Slug)</label>
                        <input {...register('slug', { required: true })} placeholder="Ex: habilitacao_juridica" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        <p className="text-xs text-slate-400 mt-1">Apenas letras minúsculas, números e underline (_).</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ordem de Exibição</label>
                        <input type="number" {...register('order', { required: true, valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'A salvar...' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}