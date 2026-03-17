import { useState, useEffect } from 'react';
import { X, Calendar, Key, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { documentService } from '../../services/documentService';
import type { DocumentDTO } from '../../services/documentService';

interface EditDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    document: DocumentDTO | null;
}

interface EditForm {
    expiration_date: string;
    authentication_code: string;
}

export function EditDocumentModal({ isOpen, onClose, onSuccess, document }: EditDocumentModalProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const { register, handleSubmit, reset, setValue } = useForm<EditForm>();

    // Preenche os campos com os dados atuais quando o modal abre
    useEffect(() => {
        if (document && isOpen) {
            // Formata a data para YYYY-MM-DD para o input type="date"
            const formattedDate = document.expiration_date ? document.expiration_date.split('T')[0] : '';
            setValue('expiration_date', formattedDate);
            setValue('authentication_code', document.authentication_code || '');
        } else {
            reset();
        }
    }, [document, isOpen, setValue, reset]);

    if (!isOpen || !document) return null;

    async function handleUpdate(data: EditForm) {
        // ---> ADICIONADO AQUI: Garantia para o TypeScript de que o documento existe <---
        if (!document) return;

        setIsUpdating(true);
        try {
            await documentService.updateDocument(document.id, {
                expiration_date: data.expiration_date || undefined,
                authentication_code: data.authentication_code || undefined
            });
            toast.success("Documento atualizado com sucesso!");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Erro ao atualizar o documento.");
        } finally {
            setIsUpdating(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Edit className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Editar Documento</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleUpdate)} className="p-6 flex flex-col gap-5">

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-1">
                        <p className="text-xs text-slate-500 font-medium">Ficheiro selecionado:</p>
                        <p className="text-sm text-slate-800 font-semibold truncate mt-0.5">{document.title || document.filename}</p>
                    </div>

                    <Input
                        id="expiration_date"
                        type="date"
                        label="Nova Data de Validade"
                        icon={<Calendar className="h-4 w-4 text-slate-400" />}
                        {...register('expiration_date')}
                    />

                    <Input
                        id="authentication_code"
                        type="text"
                        label="Novo Cód. Autenticação"
                        placeholder="Ex: ABCD-1234"
                        icon={<Key className="h-4 w-4 text-slate-400" />}
                        {...register('authentication_code')}
                    />

                    {/* Actions */}
                    <div className="pt-2 flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isUpdating} className="flex-1 bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 text-white">
                            Guardar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}