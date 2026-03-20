
/**
 * Componente que armazena as cláusulas e poderes específicos da Procuração.
 * Atua como Fonte Única de Verdade (Single Source of Truth) para o escopo de poderes
 * que o cliente outorga à plataforma.
 */
export function ProxyContent() {
    return (
        <>
            <h3 className="font-bold mt-6 mb-2">1. DOS PODERES ESPECÍFICOS</h3>
            <p>
                Pelo presente instrumento particular, a <strong>OUTORGANTE</strong> nomeia e constitui a <strong>OUTORGADA</strong> como sua bastante procuradora, conferindo-lhe poderes específicos, restritos e limitados para representá-la perante órgãos da Administração Pública Direta e Indireta (Federal, Estadual e Municipal), Autarquias, Fundações, Empresas Públicas, Conselhos de Fiscalização Profissional, Receita Federal do Brasil (RFB), Procuradoria-Geral da Fazenda Nacional (PGFN), Caixa Econômica Federal (CEF), Justiça do Trabalho, Justiça Federal, Justiça Estadual e demais entidades competentes.
            </p>

            <h3 className="font-bold mt-6 mb-2">2. DA FINALIDADE EXCLUSIVA</h3>
            <p>
                Os poderes ora outorgados destinam-se <strong>única e exclusivamente</strong> à consulta, solicitação, acompanhamento, emissão e extração de certidões, atestados e declarações comprobatórias de:
            </p>
            <ul className="list-[lower-alpha] pl-6 space-y-1">
                <li>Regularidade Fiscal e Tributária (âmbito federal, estadual e municipal);</li>
                <li>Regularidade Trabalhista (CNDT) e Previdenciária;</li>
                <li>Regularidade relativa ao Fundo de Garantia do Tempo de Serviço (CRF/FGTS);</li>
                <li>Regularidade Econômico-Financeira (Certidão de Falência e Concordata).</li>
            </ul>
            <p className="mt-2">
                Todos os documentos extraídos destinam-se a compor o acervo probatório do cofre digital da OUTORGANTE na plataforma LicitaDocs, visando à habilitação em procedimentos licitatórios (Lei 14.133/2021).
            </p>

            <h3 className="font-bold mt-6 mb-2 text-red-700">3. DA VEDAÇÃO ABSOLUTA (CLÁUSULA RESTRITIVA)</h3>
            <p>
                Fica <strong>expressamente vedado</strong> à OUTORGADA, sob pena de responsabilização civil e criminal:
            </p>
            <ul className="list-none space-y-2">
                <li><strong>3.1.</strong> Praticar quaisquer atos que importem em assunção de obrigações financeiras, alienação, oneração ou renúncia de direitos em nome da OUTORGANTE;</li>
                <li><strong>3.2.</strong> Confessar dívidas, firmar acordos, transigir, dar quitação, emitir cheques, movimentar contas bancárias ou assinar contratos em nome da OUTORGANTE;</li>
                <li><strong>3.3.</strong> Substabelecer os poderes aqui conferidos a terceiros estranhos ao quadro societário ou operacional da OUTORGADA.</li>
            </ul>

            <h3 className="font-bold mt-6 mb-2">4. DA VALIDADE E DA RENOVAÇÃO</h3>
            <ul className="list-none space-y-2">
                <li><strong>4.1.</strong> O presente instrumento entra em vigor na data de sua assinatura e possui prazo de validade fixo e improrrogável de <strong>1 (um) ano</strong> (12 meses).</li>
                <li><strong>4.2.</strong> Em caso de renovação da assinatura anual da plataforma, a continuidade dos serviços ficará condicionada à emissão de um novo Instrumento.</li>
                <li><strong>4.3.</strong> Os poderes serão revogados automaticamente em caso de cancelamento ou distrato do Contrato Principal.</li>
            </ul>
        </>
    );
}