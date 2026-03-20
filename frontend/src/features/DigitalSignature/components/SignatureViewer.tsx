import { Printer, FileText, FileSignature } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

// Componentes Reutilizáveis de Documentos (Ajusta o caminho se a tua pasta base for diferente)
import { ContractDocument } from '../../../components/signature/ContractDocument';
import { ProxyDocument } from '../../../components/signature/ProxyDocument';

/**
 * Propriedades do componente SignatureViewer.
 * @interface SignatureViewerProps
 */
interface SignatureViewerProps {
    activeTab: 'contract' | 'proxy';
    setActiveTab: (tab: 'contract' | 'proxy') => void;
    handlePrint: () => void;
    contractRef: React.RefObject<HTMLDivElement | null>;
    proxyRef: React.RefObject<HTMLDivElement | null>;
    companyData: any;
}

/**
 * Componente visual que exibe as minutas geradas dinamicamente.
 * Permite alternar entre o Contrato SaaS e a Procuração, e efetuar a 
 * "impressão" (geração de PDF) do documento ativo.
 */
export function SignatureViewer({ activeTab, setActiveTab, handlePrint, contractRef, proxyRef, companyData }: SignatureViewerProps) {
    return (
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">

                {/* Header e Abas */}
                <div className="bg-slate-50 border-b border-slate-200">
                    <div className="p-4 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Pré-visualização</h3>
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Salvar {activeTab === 'contract' ? 'Contrato' : 'Procuração'} (PDF)
                        </Button>
                    </div>

                    <div className="flex px-4 gap-4">
                        <button
                            onClick={() => setActiveTab('contract')}
                            className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'contract' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <FileText className="h-4 w-4" /> Contrato SaaS
                        </button>
                        <button
                            onClick={() => setActiveTab('proxy')}
                            className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'proxy' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <FileSignature className="h-4 w-4" /> Procuração
                        </button>
                    </div>
                </div>

                {/* Área do Documento (A4 simulado) */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-200/50 flex justify-center custom-scrollbar">
                    <div className={activeTab === 'contract' ? 'block w-full' : 'hidden'}>
                        <ContractDocument ref={contractRef} {...companyData} />
                    </div>

                    <div className={activeTab === 'proxy' ? 'block w-full' : 'hidden'}>
                        <ProxyDocument ref={proxyRef} {...companyData} />
                    </div>
                </div>
            </div>
        </div>
    );
}