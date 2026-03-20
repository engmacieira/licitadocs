import { RulesOrchestrator } from '../../../features/EmissionRules/RulesOrchestrator';

/**
 * Página do Painel Administrativo para Gestão de Diretórios de Emissão.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de carregamento de regras, integração com IBGE e modais
 * está isolada na feature 'EmissionRules'.
 */
export function AdminEmissionRulesPage() {
    return <RulesOrchestrator />;
}