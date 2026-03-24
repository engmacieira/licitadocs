import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { X, Calendar, Key, Edit, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { documentService } from '../../../services/documentService';
import type { DocumentDTO } from '../../../services/documentService';

import { EmissionLinkDisplay } from './EmissionLinkDisplay';
import { RegularityAnalysis } from './RegularityAnalysis';

/**
 * Propriedades para o modal de Edição de Documento.
 * @interface EditDocumentModalProps
 */
interface EditDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    document: DocumentDTO | null;
}

/** Estrutura do formulário de edição */
interface EditForm {
    expiration_date: string;
    authentication_code: string;
    status: string;
    notes: string;
}

/**
 * Modal para editar metadados e o status de um documento já existente no cofre.
 */
export function EditDocumentModal({ isOpen, onClose, onSuccess, document }: EditDocumentModalProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const methods = useForm<EditForm>();
    const { register, handleSubmit, reset, setValue, watch } = methods;

    const currentStatus = watch('status');

    useEffect(() => {
        if (document && isOpen) {
            const formattedDate = document.expiration_date ? document.expiration_date.split('T')[0] : '';
            setValue('expiration_date', formattedDate);
            setValue('authentication_code', document.authentication_code || '');
            setValue('status', document.status || 'valid');
            setValue('notes', '');
        } else {
            reset();
        }
    }, [document, isOpen, setValue, reset]);

    if (!isOpen || !document) return null;

    async function handleUpdate(data: EditForm) {
        if (!document) return;

        const isFileRequired = data.status === 'valid';

        if (!isFileRequired && (!data.notes || data.notes.trim() === '')) {
            toast.error("Observação Obrigatória", { description: "Justifique o motivo da irregularidade ou erro nas observações." });
            return;
        }

        setIsUpdating(true);
        try {
            await documentService.updateDocument(document.id, {
                expiration_date: data.expiration_date || undefined,
                authentication_code: data.authentication_code || undefined,
                status: data.status,
                notes: data.notes || undefined
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
        <FormProvider {...methods}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh]">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                <Edit className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Editar Documento</h2>
                                <p className="text-sm text-slate-500">Atualize metadados ou altere o status de regularidade.</p>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Fechar" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(handleUpdate)} className="p-6 flex-1 overflow-y-auto bg-white flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Ficheiro no Cofre:</p>
                                    <p className="text-sm text-slate-800 font-semibold truncate mt-0.5">{document.title || document.filename}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        id="expiration_date"
                                        type="date"
                                        label="Nova Data de Validade"
                                        className="h-11 rounded-xl"
                                        icon={<Calendar className="h-4 w-4 text-slate-400" />}
                                        {...register('expiration_date')}
                                    />
                                    <Input
                                        id="authentication_code"
                                        type="text"
                                        label="Novo Cód. Autenticação"
                                        placeholder="Ex: ABCD-1234"
                                        className="h-11 rounded-xl"
                                        icon={<Key className="h-4 w-4 text-slate-400" />}
                                        {...register('authentication_code')}
                                    />
                                </div>

                                {currentStatus === 'valid' && document.filename === 'Registro de Pendência' && (
                                    <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs font-medium">
                                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                        <p>Este registo de pendência não possui um anexo em PDF. Se o documento agora está regularizado, recomendamos excluir este registo e fazer um "Novo Documento Oficial" com o ficheiro PDF correto anexado.</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <EmissionLinkDisplay documentTypeId={document.type_id || null} companyId={document.company_id || ""} />
                                <RegularityAnalysis />
                            </div>
                        </div>

                        <div className="pt-6 mt-auto border-t border-slate-100 flex gap-4 shrink-0 bg-white">
                            <Button type="button" variant="ghost" onClick={onClose} className="w-40 rounded-xl h-12">Cancelar</Button>
                            <Button type="submit" isLoading={isUpdating} className="flex-1 bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 text-white rounded-xl h-12 text-lg">
                                Guardar Alterações
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </FormProvider>
    );
}