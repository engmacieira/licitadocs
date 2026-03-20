import { TemplatesOrchestrator } from '../../../features/DocumentTemplates/TemplatesOrchestrator';

/**
 * Página de Modelos de Documentos (Geração Automática).
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de extração de dados da empresa e geração de PDFs/DOCXs
 * está isolada na feature 'DocumentTemplates'.
 */
export function DocumentTemplatesPage() {
    return <TemplatesOrchestrator />;
}