import { EmissionOrchestrator } from '../../../features/ManualEmission/EmissionOrchestrator';

/**
 * Página do Painel Administrativo para a Central de Emissão Manual.
 * Funciona estritamente como um ponto de roteamento.
 * Toda a lógica de templates de e-mail, registo de histórico e disparo
 * está isolada na feature 'ManualEmission'.
 */
export function ManualEmissionPage() {
    return <EmissionOrchestrator />;
}