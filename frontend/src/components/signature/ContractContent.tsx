/**
 * Componente que armazena o texto estático e as cláusulas do Contrato de Prestação de Serviços.
 * Atua como Fonte Única de Verdade (Single Source of Truth) para as minutas.
 * É consumido tanto na visualização prévia (Onboarding) quanto na geração do documento final.
 */
import { APP_CONFIG } from '../../config/app.config';

export function ContractContent() {
    return (
        <>
            <h3 className="font-bold mt-6 mb-2 bg-slate-100 p-1">CLÁUSULA 1ª – DO OBJETO E ESCOPO DO SERVIÇO</h3>
            <p><strong>1.1. Da Licença de Uso (SaaS):</strong> O presente instrumento tem por objeto a concessão, pela CONTRATADA à CONTRATANTE, de uma licença de uso temporária, revogável, não exclusiva e intransferível do software web denominado <strong>{APP_CONFIG.name}</strong>, disponibilizado na modalidade <em>Software as a Service</em> (SaaS).</p>
            <p><strong>1.1.1.</strong> A licença ora concedida não confere à CONTRATANTE qualquer direito de propriedade intelectual sobre o código-fonte, banco de dados, marcas, identidade visual ou arquitetura do sistema.</p>
            <p><strong>1.2. Da Funcionalidade da Plataforma:</strong> O escopo principal da plataforma compreende a automação da rotina de captação, organização, monitoramento e disponibilização em cofre digital de certidões de regularidade (fiscal, trabalhista, previdenciária e econômico-financeira) e demais documentos de habilitação, visando atender primordialmente aos requisitos estipulados pela Nova Lei de Licitações e Contratos Administrativos (Lei nº 14.133/2021).</p>
            <p><strong>1.3. Da Limitação por CNPJ:</strong> A licença de uso e a respectiva automação de buscas contratadas estão estritamente vinculadas ao monitoramento de <strong>1 (um) único CNPJ</strong> (matriz ou filial), previamente cadastrado no momento da assinatura.</p>

            <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 2ª – DOS LIMITES DE ATUAÇÃO E OBRIGAÇÃO DE MEIO</h3>
            <p><strong>2.1. Da Natureza do Serviço:</strong> A CONTRATADA atua exclusivamente como ferramenta de tecnologia. A execução da rotina de extração caracteriza-se estritamente como <strong>obrigação de meio</strong>, uma vez que a emissão das certidões depende da estabilidade, disponibilidade e processamento dos portais governamentais de terceiros.</p>
            <p><strong>2.2. Da Inexistência de Assessoria:</strong> Em caso de identificação de pendências, débitos ou irregularidades vinculadas ao CNPJ da CONTRATANTE, a CONTRATADA <strong>não</strong> prestará serviços de despachante, contabilidade, assessoria jurídica ou regularização de passivos.</p>

            <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 3ª – DAS OBRIGAÇÕES DA CONTRATANTE</h3>
            <p><strong>3.1.</strong> Manter atualizados os dados cadastrais da empresa e de seus representantes legais na plataforma.</p>
            <p><strong>3.2.</strong> Outorgar, sempre que requisitado, o Instrumento de Procuração específico necessário para o acesso da CONTRATADA aos sistemas restritos (ex: e-CAC, Conectividade Social), sob pena de paralisação técnica da coleta de certidões bloqueadas, sem que isso configure falha na prestação do serviço.</p>

            <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 4ª – DA PROTEÇÃO DE DADOS (LGPD)</h3>
            <p><strong>4.1.</strong> As Partes comprometem-se a cumprir integralmente as disposições da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais).</p>
            <p><strong>4.2.</strong> A CONTRATANTE autoriza expressamente o tratamento de dados pessoais de seus sócios e administradores para a exclusiva finalidade de execução deste contrato e emissão dos instrumentos de procuração necessários.</p>

            <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 5ª – DOS NÍVEIS DE SERVIÇO (SLA)</h3>
            <p><strong>5.1.</strong> A CONTRATADA garante uma disponibilidade de acesso à plataforma (Uptime) de <strong>99% (noventa e nove por cento)</strong> ao mês.</p>
            <p><strong>5.2.</strong> As manutenções preventivas serão comunicadas com antecedência e realizadas, preferencialmente, em horários de menor tráfego.</p>

            <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 6ª – DA POLÍTICA DE USO JUSTO E LIMITES DE PROCESSAMENTO (FAIR USE)</h3>
            <p><strong>6.1. Limite Diário de Tokens:</strong> Com o objetivo de garantir a estabilidade da plataforma, a integridade da infraestrutura e o controle de custos operacionais, o uso das ferramentas de Inteligência Artificial e processamento avançado integradas ao {APP_CONFIG.name} está sujeito a um limite técnico diário de <strong>30.000 (trinta mil) tokens</strong> por assinatura/CNPJ.</p>
            <p><strong>6.2. Esgotamento da Franquia:</strong> Caso a CONTRATANTE atinja o limite máximo estipulado no item 9.1 dentro de um mesmo ciclo de 24 horas, o acesso às funcionalidades específicas que consomem tokens será automaticamente suspenso ou restringido pelo sistema até a renovação da franquia (às 00h00 do dia seguinte).</p>
            <p><strong>6.3. Ciência e Exclusão de Responsabilidade:</strong> A CONTRATANTE declara ter plena ciência desta limitação técnica no ato da contratação. O bloqueio temporário de recursos por esgotamento do limite diário de tokens não configura falha na prestação do serviço, indisponibilidade do sistema (queda de SLA) ou quebra de contrato, não conferindo à CONTRATANTE qualquer direito a reembolso, desconto ou indenização.</p>

            <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 7ª – DA REMUNERAÇÃO</h3>
            <p><strong>6.1.</strong> Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor correspondente ao plano anual escolhido no momento do cadastro.</p>
            <p><strong>6.2.</strong> Em caso de atraso no pagamento de parcelas (se aplicável), incidirá multa moratória de 2% e juros de 1% ao mês, sujeitando a CONTRATANTE à suspensão temporária do acesso ao cofre digital até a regularização.</p>

            <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 8ª – DO PRAZO E CANCELAMENTO (CHURN)</h3>
            <p><strong>7.1. Da Vigência:</strong> O presente contrato possui validade fixa e ininterrupta de <strong>1 (um) ano (12 meses)</strong>.</p>
            <p><strong>7.2. Do Aviso Prévio:</strong> A plataforma enviará notificações automáticas com <strong>60 (sessenta) dias de antecedência</strong> do vencimento.</p>
            <p><strong>7.3. Da Ausência de Renovação Automática:</strong> Não haverá renovação automática. Caberá à CONTRATANTE providenciar o pagamento de um novo ciclo.</p>
            <p><strong>7.4. Da Rescisão Antecipada:</strong> A CONTRATANTE poderá solicitar o cancelamento voluntário antes do término dos 12 meses. Neste caso, o reembolso do período não utilizado sofrerá deduções proporcionais de taxas (10%) e multa rescisória (50% sobre os meses cheios restantes).</p>

            <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 9ª – DA FORMALIZAÇÃO E FORO</h3>
            <p><strong>8.1. Da Assinatura Digital:</strong> A CONTRATANTE deverá realizar a assinatura eletrônica avançada ou via certificado digital ICP-Brasil para validação deste instrumento.</p>
            <p><strong>8.2. Das Alterações:</strong> A CONTRATADA poderá alterar os termos do serviço para adequações sistêmicas ou legais, comunicando com 15 dias de antecedência.</p>
            <p><strong>8.3. Do Foro de Eleição:</strong> Fica eleito o foro da Comarca de Lisboa para dirimir quaisquer dúvidas, renunciando a qualquer outro por mais privilegiado que seja.</p>
        </>
    );
}