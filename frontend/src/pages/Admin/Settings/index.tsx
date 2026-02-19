import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Folder, FileText, Plus, Edit2, Trash2, X, Settings as SettingsIcon } from 'lucide-react';

import { documentService } from '../../../services/documentService';
import type {
    DocumentCategoryDTO, DocumentTypeDTO,
    DocumentCategoryCreateDTO, DocumentCategoryUpdateDTO,
    DocumentTypeCreateDTO, DocumentTypeUpdateDTO
} from '../../../services/documentService';

export function SettingsPage() {
    const [categories, setCategories] = useState<DocumentCategoryDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Controle de Modais
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<DocumentCategoryDTO | null>(null);

    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<DocumentTypeDTO | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await documentService.getTypes();
            setCategories(data);
        } catch (error) {
            toast.error("Erro ao carregar o catálogo de documentos.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Handlers de Exclusão (Com confirmação visual) ---
    const handleDeleteCategory = async (id: string, name: string) => {
        if (!window.confirm(`Tem certeza que deseja apagar a categoria "${name}"? Isso só será possível se ela estiver vazia.`)) return;

        try {
            await documentService.deleteCategory(id);
            toast.success("Categoria apagada com sucesso!");
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao apagar categoria.");
        }
    };

    const handleDeleteType = async (id: string, name: string) => {
        if (!window.confirm(`Tem certeza que deseja apagar o documento "${name}"? Isso só será possível se nenhum cliente tiver enviado este arquivo.`)) return;

        try {
            await documentService.deleteType(id);
            toast.success("Tipo de documento apagado com sucesso!");
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao apagar tipo de documento.");
        }
    };

    // --- Abertura de Modais ---
    const openNewCategory = () => { setEditingCategory(null); setIsCatModalOpen(true); };
    const openEditCategory = (cat: DocumentCategoryDTO) => { setEditingCategory(cat); setIsCatModalOpen(true); };

    const openNewType = (categoryId: string) => {
        setSelectedCategoryId(categoryId); setEditingType(null); setIsTypeModalOpen(true);
    };
    const openEditType = (type: DocumentTypeDTO, categoryId: string) => {
        setSelectedCategoryId(categoryId); setEditingType(type); setIsTypeModalOpen(true);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Catálogo de Documentos</h1>
                        <p className="text-sm text-slate-500">Gerencie as categorias e tipos de certidões exigidas pelo sistema.</p>
                    </div>
                </div>
                <button
                    onClick={openNewCategory}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                    <Plus size={18} />
                    Nova Categoria
                </button>
            </div>

            {/* Content / Lista */}
            {isLoading ? (
                <div className="text-center py-10 text-slate-500">A carregar catálogo...</div>
            ) : categories.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
                    <Folder className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">Nenhuma categoria cadastrada.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {categories.map((cat) => (
                        <div key={cat.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Header da Categoria */}
                            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Folder className="text-blue-500" size={20} />
                                    <div>
                                        <h2 className="font-semibold text-slate-800 text-lg">{cat.name}</h2>
                                        <p className="text-xs text-slate-400 font-mono">slug: {cat.slug} | ordem: {cat.order}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEditCategory(cat)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Categoria">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Apagar Categoria">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Lista de Tipos de Documentos */}
                            <div className="p-4">
                                {cat.types.length === 0 ? (
                                    <div className="text-center py-6 text-sm text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                        Nenhum documento cadastrado nesta categoria.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cat.types.map(type => (
                                            <div key={type.id} className="flex items-start justify-between p-3 border border-slate-100 bg-white rounded-lg hover:border-blue-200 transition-colors group shadow-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 p-1.5 bg-slate-100 text-slate-500 rounded-md">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-slate-800">{type.name}</p>
                                                        <div className="flex gap-3 text-xs text-slate-400 mt-1">
                                                            <span>Validade: {type.validity_days_default === 0 ? 'Permanente' : `${type.validity_days_default} dias`}</span>
                                                        </div>
                                                        {type.description && <p className="text-xs text-slate-500 mt-2 line-clamp-1">{type.description}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditType(type, cat.id)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteType(type.id, type.name)} className="p-1.5 text-slate-400 hover:text-red-600 rounded">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Botão Adicionar Tipo */}
                                <button
                                    onClick={() => openNewType(cat.id)}
                                    className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto"
                                >
                                    <Plus size={16} />
                                    Adicionar Documento à {cat.name}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Renderização dos Modais */}
            {isCatModalOpen && (
                <CategoryModal
                    isOpen={isCatModalOpen}
                    onClose={() => setIsCatModalOpen(false)}
                    onSuccess={loadData}
                    initialData={editingCategory}
                />
            )}

            {isTypeModalOpen && selectedCategoryId && (
                <TypeModal
                    isOpen={isTypeModalOpen}
                    onClose={() => setIsTypeModalOpen(false)}
                    onSuccess={loadData}
                    categoryId={selectedCategoryId}
                    initialData={editingType}
                />
            )}
        </div>
    );
}

// ============================================================================
// MODAL DE CATEGORIA (Interno)
// ============================================================================
function CategoryModal({ isOpen, onClose, onSuccess, initialData }: any) {
    const { register, handleSubmit, formState: { errors } } = useForm<DocumentCategoryCreateDTO>({
        defaultValues: initialData || { order: 0 }
    });
    const [isSaving, setIsSaving] = useState(false);
    const isEdit = !!initialData;

    const onSubmit = async (data: DocumentCategoryCreateDTO) => {
        setIsSaving(true);
        try {
            if (isEdit) {
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

// ============================================================================
// MODAL DE TIPO DE DOCUMENTO (Interno)
// ============================================================================
function TypeModal({ isOpen, onClose, onSuccess, categoryId, initialData }: any) {
    const { register, handleSubmit, formState: { errors } } = useForm<DocumentTypeCreateDTO>({
        defaultValues: initialData ? { ...initialData } : { category_id: categoryId, validity_days_default: 30 }
    });
    const [isSaving, setIsSaving] = useState(false);
    const isEdit = !!initialData;

    const onSubmit = async (data: DocumentTypeCreateDTO) => {
        setIsSaving(true);
        try {
            if (isEdit) {
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-semibold text-slate-800">{isEdit ? 'Editar Documento' : 'Novo Documento'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dias de Validade Padrão</label>
                        <input type="number" {...register('validity_days_default', { required: true, valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        <p className="text-xs text-slate-400 mt-1">Coloque 0 se o documento não tiver validade (Permanente).</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Instruções / Descrição (Opcional)</label>
                        <textarea {...register('description')} rows={3} placeholder="Instruções para o uploader..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
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