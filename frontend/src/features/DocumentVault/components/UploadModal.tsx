import { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { X, UploadCloud, FileText, Calendar, Key, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { documentService } from '../../../services/documentService';
import type { DocumentCategoryDTO } from '../../../services/documentService';

import { EmissionLinkDisplay } from './EmissionLinkDisplay';
import { RegularityAnalysis } from './RegularityAnalysis';

/**
 * Propriedades para o modal de Upload.
 * @interface UploadModalProps
 */
interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    targetCompanyId: string;
}

/** Estrutura do formulário de upload */
interface UploadForm {
    typeId: string;
    file: FileList;
    expiration_date: string;
    authenticationCode: string;
    status: string;
    notes: string;
}

/**
 * Modal inteligente de envio de documentos para o cofre.
 * Integra-se com o catálogo de tipos, links de emissão e análise de regularidade.
 */
export function UploadModal({ isOpen, onClose, onSuccess, targetCompanyId }: UploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [categories, setCategories] = useState<DocumentCategoryDTO[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);

    const methods = useForm<UploadForm>({ defaultValues: { status: 'valid' } });

    const selectedTypeId = methods.watch('typeId');
    const currentStatus = methods.watch('status');

    const selectedType = useMemo(() => {
        if (!selectedTypeId) return null;
        for (const cat of categories) {
            const found = cat.types.find(t => t.id === selectedTypeId);
            if (found) return found;
        }
        return null;
    }, [selectedTypeId, categories]);

    useEffect(() => {
        if (selectedType && isOpen) {
            if (selectedType.validity_days_default > 0) {
                const expDate = new Date();
                expDate.setDate(expDate.getDate() + selectedType.validity_days_default);
                methods.setValue('expiration_date', expDate.toISOString().split('T')[0]);
            } else {
                methods.setValue('expiration_date', '');
            }
        }
    }, [selectedType, methods.setValue, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setIsLoadingTypes(true);
            documentService.getTypes()
                .then((data) => setCategories(data))
                .catch(() => toast.error("Falha ao carregar catálogo."))
                .finally(() => setIsLoadingTypes(false));
        } else {
            methods.reset();
        }
    }, [isOpen, methods.reset]);

    if (!isOpen) return null;

    async function handleUpload(data: UploadForm) {
        const isFileRequired = data.status === 'valid';

        if (isFileRequired && (!data.file || data.file.length === 0)) {
            toast.error("Anexo Obrigatório", { description: "O arquivo PDF é obrigatório para documentos válidos." });
            return;
        }

        if (!isFileRequired && (!data.notes || data.notes.trim() === '')) {
            toast.error("Observação Obrigatória", { description: "Justifique o motivo da irregularidade ou do erro de emissão nas observações." });
            return;
        }

        if (!data.typeId) {
            toast.error("O tipo de documento é obrigatório.");
            return;
        }

        setIsUploading(true);
        try {
            const fileObj = data.file?.[0] || null;
            await documentService.upload(
                fileObj as unknown as File,
                targetCompanyId,
                {
                    typeId: data.typeId,
                    expirationDate: data.expiration_date || undefined,
                    authenticationCode: data.authenticationCode || undefined,
                    status: data.status,
                    notes: data.notes || undefined
                }
            );

            toast.success(isFileRequired ? "Documento enviado com sucesso!" : "Aviso de pendência registado no cofre!");
            methods.reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao salvar informações no cofre.");
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <FormProvider {...methods}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh]">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Centro de Upload Inteligente</h2>
                                <p className="text-sm text-slate-500">Configure e envie documentos para o cofre da empresa.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={methods.handleSubmit(handleUpload)} className="p-6 flex-1 overflow-y-auto bg-white flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label htmlFor="file-upload" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        Arquivo PDF / Imagem {currentStatus === 'valid' ? '*' : '(Opcional)'}
                                    </label>

                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".pdf,image/*"
                                        className={`w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${currentStatus === 'valid' ? 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100' : 'file:bg-slate-100 file:text-slate-500'} border border-slate-200 rounded-xl p-1.5 bg-white`}
                                        {...methods.register('file')}
                                    />

                                    {currentStatus !== 'valid' && (
                                        <div className="flex items-start gap-1.5 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-[11px] leading-tight text-amber-700 font-medium">Como está a registar uma irregularidade ou erro, o anexo deixou de ser obrigatório.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Tipo de Documento *</label>
                                    <select
                                        className="w-full h-12 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                                        {...methods.register('typeId')}
                                    >
                                        <option value="">{isLoadingTypes ? "A carregar catálogo..." : "Selecione o tipo de documento..."}</option>
                                        {categories.map((category) => (
                                            <optgroup key={category.id} label={category.name}>
                                                {category.types.map((type) => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        id="expiration_date"
                                        type="date"
                                        label="Data de Validade"
                                        className="h-11 rounded-xl"
                                        icon={<Calendar className="h-4 w-4 text-slate-400" />}
                                        {...methods.register('expiration_date')}
                                    />
                                    <Input
                                        id="authenticationCode"
                                        type="text"
                                        label="Cód. Autenticação"
                                        placeholder="Ex: ABCD-1234"
                                        className="h-11 rounded-xl"
                                        icon={<Key className="h-4 w-4 text-slate-400" />}
                                        {...methods.register('authenticationCode')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <EmissionLinkDisplay documentTypeId={selectedTypeId} companyId={targetCompanyId} />
                                <RegularityAnalysis />
                            </div>
                        </div>

                        <div className="pt-6 mt-auto border-t border-slate-100 flex gap-4 shrink-0 bg-white">
                            <Button type="button" variant="ghost" onClick={onClose} className="w-40 rounded-xl h-12">Cancelar</Button>
                            <Button type="submit" isLoading={isUploading} className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-lg">
                                {currentStatus === 'valid' ? 'Enviar para o Cofre' : 'Salvar Registo de Pendência'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </FormProvider>
    );
}