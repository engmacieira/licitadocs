import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, UploadCloud, FileText, Calendar, Key } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { documentService } from '../../services/documentService';
import type { DocumentCategoryDTO } from '../../services/documentService';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    targetCompanyId: string;
}

interface UploadForm {
    typeId: string; // Mudou: De 'title' solto para 'typeId' estruturado
    file: FileList;
    expiration_date: string;
    authenticationCode: string; // Novo campo da Sprint 17
}

export function UploadModal({ isOpen, onClose, onSuccess, targetCompanyId }: UploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [categories, setCategories] = useState<DocumentCategoryDTO[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadForm>();

    // NOVO: Busca o catálogo dinâmico quando o modal abre
    useEffect(() => {
        if (isOpen) {
            setIsLoadingTypes(true);
            documentService.getTypes()
                .then((data) => setCategories(data))
                .catch(() => toast.error("Falha ao carregar catálogo de documentos."))
                .finally(() => setIsLoadingTypes(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    async function handleUpload(data: UploadForm) {
        if (!data.file?.[0]) {
            toast.error("Selecione um arquivo PDF ou Imagem.");
            return;
        }

        if (!data.typeId) {
            toast.error("Selecione um Tipo de Documento válido.");
            return;
        }

        setIsUploading(true);
        try {
            // NOVO: Chamada usando a nova assinatura estruturada do documentService
            await documentService.upload(
                data.file[0],
                targetCompanyId,
                {
                    typeId: data.typeId,
                    expirationDate: data.expiration_date || undefined,
                    authenticationCode: data.authenticationCode || undefined
                }
            );

            toast.success("Documento enviado com sucesso para o Cofre!");
            reset();
            onSuccess(); // Recarrega a lista lá no pai
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao enviar o arquivo. Tente novamente.");
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-full">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <UploadCloud className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Novo Upload</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleUpload)} className="p-6 flex flex-col gap-5 overflow-y-auto">
                    {/* File Input */}
                    <div className="space-y-1">
                        <label
                            htmlFor="file-upload"
                            className="text-sm font-medium text-slate-700 flex items-center gap-2"
                        >
                            <FileText className="h-4 w-4 text-slate-400" />
                            Arquivo PDF
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".pdf,image/*"
                            className="w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                border border-slate-200 rounded-lg p-1"
                            {...register('file', { required: true })}
                        />
                        {errors.file && <span className="text-xs text-red-500">Arquivo é obrigatório</span>}
                    </div>

                    {/* Catálogo Dinâmico */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Tipo de Documento</label>
                        <select
                            className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            {...register('typeId', { required: true })}
                            disabled={isLoadingTypes}
                        >
                            <option value="">
                                {isLoadingTypes ? "A carregar catálogo..." : "Selecione o tipo de documento..."}
                            </option>

                            {/* Renderização dinâmica com OptGroup para organizar por Categorias */}
                            {categories.map((category) => (
                                <optgroup key={category.id} label={category.name}>
                                    {category.types.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {errors.typeId && <span className="text-xs text-red-500">Tipo é obrigatório</span>}
                    </div>

                    {/* Campos Opcionais */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Data de Validade"
                            icon={<Calendar className="h-4 w-4 text-slate-400" />}
                            {...register('expiration_date')}
                        />

                        <Input
                            type="text"
                            label="Cód. Autenticação"
                            placeholder="Ex: ABCD-1234"
                            icon={<Key className="h-4 w-4 text-slate-400" />}
                            {...register('authenticationCode')}
                        />

                        <Input
                            id="expiration_date"      // 👈 ADICIONADO AQUI
                            type="date"
                            label="Data de Validade"
                            icon={<Calendar className="h-4 w-4 text-slate-400" />}
                            {...register('expiration_date')}
                        />

                        <Input
                            id="authenticationCode"   // 👈 ADICIONADO AQUI
                            type="text"
                            label="Cód. Autenticação"
                            placeholder="Ex: ABCD-1234"
                            icon={<Key className="h-4 w-4 text-slate-400" />}
                            {...register('authenticationCode')}
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3 shrink-0">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isUploading} className="flex-1">
                            Enviar para o Cofre
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}