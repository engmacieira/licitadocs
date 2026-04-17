/**
 * Componente que armazena o texto estático do Termo de Aceite Prévio.
 * Atua como Fonte Única de Verdade para as regras iniciais de utilização do sistema.
 * Mantido separado do orquestrador para facilitar atualizações jurídicas e manter o código limpo.
 */
import { APP_CONFIG } from '../../config/app.config';

export function TermsOfAcceptanceContent() {
    return (
        <div className="space-y-5 max-w-2xl mx-auto text-justify">
            <h2 className="text-center font-bold text-slate-900 text-lg mb-8 uppercase">
                Termo de Aceite e Condições Prévias de Uso - {APP_CONFIG.name}
            </h2>

            <p>
                Pelo presente <strong>Termo de Aceite</strong>, a empresa contratante ("CONTRATANTE"), ao clicar no botão correspondente a "Li e Aceito" e prosseguir com a assinatura da plataforma, declara estar ciente e de pleno acordo com as condições prévias para a utilização do sistema <strong>{APP_CONFIG.name}</strong>, plataforma web especializada na gestão, busca e disponibilização de certidões de regularidade e documentos atinentes à Lei nº 14.133/2021 ("CONTRATADA").
            </p>

            <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">1. NATUREZA DO SERVIÇO E OBRIGAÇÃO DE MEIO</h3>
            <p><strong>1.1.</strong> A CONTRATANTE compreende que o serviço prestado consiste na automação e facilitação da captação de certidões de regularidade (fiscal, trabalhista, previdenciária, entre outras) em bases de dados públicas e sua respectiva disponibilização no cofre digital da plataforma.</p>
            <p><strong>1.2.</strong> Fica expressamente acordado que a prestação do serviço configura <strong>obrigação de meio</strong>, uma vez que a emissão dos referidos documentos depende exclusivamente da disponibilidade, estabilidade e processamento dos portais e sistemas dos respectivos órgãos emissores (Federais, Estaduais e Municipais).</p>
            <p><strong>1.3.</strong> A CONTRATADA não poderá ser responsabilizada por atrasos, falhas ou impossibilidade de emissão de certidões decorrentes de indisponibilidade técnica dos sistemas governamentais ou de pendências atreladas ao CNPJ da CONTRATANTE.</p>

            <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">2. CONSTATAÇÃO DE IRREGULARIDADES E LIMITAÇÃO DE ESCOPO</h3>
            <p><strong>2.1.</strong> Caso seja constatada qualquer pendência, débito ou irregularidade em nome da CONTRATANTE que impeça a emissão da respectiva certidão de regularidade, a CONTRATADA <strong>não</strong> realizará serviços de despachante, contabilidade, advocacia ou assessoria para a regularização do passivo.</p>
            <p><strong>2.2.</strong> A obrigação da plataforma nestes cenários limitar-se-á a notificar a CONTRATANTE, por meio dos canais oficiais de comunicação cadastrados no sistema, informando a natureza da irregularidade encontrada e, quando viável, fornecendo um resumo informativo dos passos gerais a serem seguidos pela CONTRATANTE para a regularização perante o órgão competente.</p>

            <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">3. NECESSIDADE DE OUTORGA DE PROCURAÇÃO</h3>
            <p><strong>3.1.</strong> A CONTRATANTE declara ciência de que determinados órgãos públicos exigem representação formal para a emissão de certidões específicas ou acesso a sistemas restritos.</p>
            <p><strong>3.2.</strong> Nesses casos, a plena execução dos serviços de captação documental estará estritamente condicionada à assinatura e entrega (física ou digital) de um <strong>Instrumento de Procuração</strong> outorgando poderes específicos à equipe da CONTRATADA, conforme minuta previamente disponibilizada.</p>

            <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">4. TRATAMENTO DE DADOS (LGPD)</h3>
            <p><strong>4.1.</strong> A CONTRATANTE autoriza a CONTRATADA a coletar, armazenar e processar seus dados corporativos (CNPJ, Razão Social, Inscrições, etc.), bem como os <strong>dados pessoais dos seus sócios e administradores legais</strong> (tais como CPF, RG, endereço e estado civil, conforme qualificação no Contrato Social), com a finalidade exclusiva de executar a busca documental, a gestão do cofre digital e a elaboração dos instrumentos de representação necessários.</p>
            <p><strong>4.2.</strong> O tratamento destes dados dar-se-á em estrita observância à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), garantindo-se o sigilo e a segurança das informações.</p>

            <h3 className="font-bold text-slate-900 pt-4 border-t border-slate-100">5. CIÊNCIA PRÉVIA DOS INSTRUMENTOS CONTRATUAIS</h3>
            <p><strong>5.1.</strong> A CONTRATANTE declara expressamente, neste ato e antes de realizar qualquer pagamento, que teve amplo acesso e efetuou a leitura das minutas do <strong>Contrato Principal de Prestação de Serviços</strong> e do <strong>Instrumento de Procuração</strong>, cujos links foram disponibilizados e acessados nesta mesma página de cadastro.</p>
            <p><strong>5.2.</strong> A CONTRATANTE reconhece que a liberação do aceite final deste termo foi condicionada tecnicamente pelo sistema à abertura, navegação completa (<em>scroll</em>) e confirmação individualizada de leitura das referidas minutas.</p>
            <p><strong>5.3.</strong> A conclusão da assinatura da plataforma implica na concordância integral com os termos apresentados, comprometendo-se a CONTRATANTE a formalizar a assinatura definitiva de ambos os documentos no prazo estipulado pela CONTRATADA, sob pena de suspensão imediata dos serviços e ausência de reembolso do valor inicial pago.</p>

            <div className="py-20 text-center text-slate-300 italic">[ Fim do Documento ]</div>
        </div>
    );
}