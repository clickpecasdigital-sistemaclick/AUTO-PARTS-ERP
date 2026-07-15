/**
 * Catálogo de rejeições SEFAZ — mapeamento de código numérico para
 * explicação amigável + causa + sugestão de correção + link interno.
 * Exportado como constante mutável para que futuras atualizações de
 * legislação ou novos estados possam ser adicionados sem alterar o motor
 * (basta estender este mapa ou carregar de banco via `FiscalRejectionLog`).
 */
export interface RejectionEntry {
  message: string;
  explanation: string;
  possibleCause: string;
  suggestedFix: string;
  internalLink?: string;
}

export const REJECTION_CATALOG: Record<string, RejectionEntry> = {
  '204': { message: 'Duplicidade de NF-e', explanation: 'Já existe uma NF-e com esta chave de acesso na SEFAZ.', possibleCause: 'Tentativa de reenvio de uma nota já autorizada.', suggestedFix: 'Consulte a nota pelo Monitor Fiscal antes de emitir novamente.', internalLink: '/fiscal/monitor' },
  '205': { message: 'NF-e está denegada na base de dados da SEFAZ', explanation: 'A NF-e foi negada pela SEFAZ e não pode ser utilizada.', possibleCause: 'Irregularidade fiscal do emitente ou destinatário.', suggestedFix: 'Regularize a situação cadastral da empresa junto à SEFAZ.', internalLink: '/fiscal/config' },
  '206': { message: 'NF-e já está cancelada na base de dados da SEFAZ', explanation: 'A nota já foi cancelada anteriormente.', possibleCause: 'Tentativa de cancelar uma nota que já foi cancelada.', suggestedFix: 'Verifique o status da nota no Monitor Fiscal.', internalLink: '/fiscal/monitor' },
  '207': { message: 'Emitente não habilitado para emissão de NF-e', explanation: 'O CNPJ emitente não está habilitado para emissão de NF-e neste estado.', possibleCause: 'Empresa não cadastrada ou com habilitação expirada na SEFAZ.', suggestedFix: 'Solicite a habilitação junto à SEFAZ do estado.', internalLink: '/fiscal/config' },
  '214': { message: 'Tamanho da mensagem excedeu o limite estabelecido', explanation: 'O XML enviado ultrapassa o limite de tamanho permitido pela SEFAZ.', possibleCause: 'Nota com muitos itens ou observações muito longas.', suggestedFix: 'Reduza o número de itens ou o tamanho das observações.' },
  '225': { message: 'Falha no Schema XML', explanation: 'O XML gerado não está em conformidade com o schema XSD da SEFAZ.', possibleCause: 'Campo obrigatório vazio, tipo de dado incorreto ou versão de schema desatualizada.', suggestedFix: 'Verifique a configuração fiscal e atualize os dados do produto/empresa.', internalLink: '/fiscal/config' },
  '227': { message: 'Erro de Assinatura: chave de acesso difere do calculado', explanation: 'A chave de acesso no XML não corresponde ao cálculo da SEFAZ.', possibleCause: 'Erro de geração da chave de acesso.', suggestedFix: 'Descarte o draft e emita uma nova nota.' },
  '228': { message: 'Data de emissão muito antiga', explanation: 'A data de emissão está fora do prazo permitido para transmissão.', possibleCause: 'Nota criada há mais de 24 horas antes de ser transmitida.', suggestedFix: 'Corrija a data de emissão para a data atual.' },
  '230': { message: 'IE do emitente inválida', explanation: 'A Inscrição Estadual informada não é válida para o estado emitente.', possibleCause: 'IE em branco, incorreta ou com dígito verificador errado.', suggestedFix: 'Corrija a IE no cadastro da empresa.', internalLink: '/configuracoes/empresa' },
  '233': { message: 'IE do destinatário inválida', explanation: 'A Inscrição Estadual do cliente não é válida.', possibleCause: 'IE em branco, incorreta ou cliente isento sem indicação correta.', suggestedFix: 'Corrija a IE no cadastro do cliente.', internalLink: '/clientes' },
  '243': { message: 'CNPJ do emitente inválido', explanation: 'O CNPJ do emitente não passou na validação do dígito verificador.', possibleCause: 'CNPJ digitado incorretamente no cadastro da empresa.', suggestedFix: 'Corrija o CNPJ no cadastro da empresa.', internalLink: '/configuracoes/empresa' },
  '244': { message: 'CNPJ do destinatário inválido', explanation: 'O CNPJ do cliente/destinatário não é válido.', possibleCause: 'CNPJ digitado incorretamente no cadastro do cliente.', suggestedFix: 'Corrija o CNPJ no cadastro do cliente.', internalLink: '/clientes' },
  '301': { message: 'Uso de Ambiente de Homologação. Chave de acesso com série inválida', explanation: 'Em homologação só é permitido usar a série 1.', possibleCause: 'Configuração de série diferente de 1 no ambiente de homologação.', suggestedFix: 'Use a série 1 ou troque para o ambiente de produção.', internalLink: '/fiscal/config' },
  '302': { message: 'Uso de Ambiente de Produção. Chave de acesso com série inválida em homologação', explanation: 'A série configurada é de produção mas o ambiente é de homologação.', possibleCause: 'Ambiente incorreto na configuração fiscal.', suggestedFix: 'Verifique o ambiente na configuração fiscal.', internalLink: '/fiscal/config' },
  '401': { message: 'Prazo de Cancelamento Superior ao Previsto', explanation: 'O prazo para cancelamento desta nota já expirou.', possibleCause: 'Tentativa de cancelar uma nota além do prazo (geralmente 24 horas após autorização).', suggestedFix: 'Emita uma nota de devolução ou carta de correção, conforme o caso.' },
  '402': { message: 'Cancelamento/Inutilização fora do prazo', explanation: 'O prazo para esta operação já expirou.', possibleCause: 'Operação realizada após o prazo permitido pela SEFAZ.', suggestedFix: 'Para cancelamentos fora do prazo, consulte sua contabilidade.' },
  '539': { message: 'CFOP incompatível com a operação', explanation: 'O CFOP informado não é compatível com o tipo de operação (entrada/saída, interestadual/estadual).', possibleCause: 'CFOP de entrada usado em nota de saída ou vice-versa.', suggestedFix: 'Verifique e corrija o CFOP na configuração fiscal ou no produto.', internalLink: '/fiscal/config' },
  '540': { message: 'CST inválido', explanation: 'O Código de Situação Tributária informado não é válido para o regime tributário utilizado.', possibleCause: 'CST de Lucro Real/Presumido usado em empresa do Simples Nacional (deve usar CSOSN).', suggestedFix: 'Verifique o CRT na configuração fiscal e ajuste o motor de tributação.', internalLink: '/fiscal/tributacao' },
  '541': { message: 'CSOSN inválido', explanation: 'O Código de Situação de Operação do Simples Nacional informado não é válido.', possibleCause: 'CSOSN de Simples Nacional usado em empresa de Lucro Real/Presumido.', suggestedFix: 'Verifique o CRT na configuração fiscal e ajuste o motor de tributação.', internalLink: '/fiscal/tributacao' },
  '542': { message: 'NCM inválido', explanation: 'O NCM informado não existe na tabela TIPI.', possibleCause: 'NCM incorreto ou desatualizado no cadastro do produto.', suggestedFix: 'Corrija o NCM no cadastro do produto.', internalLink: '/produtos' },
  '543': { message: 'CEP inválido', explanation: 'O CEP informado não é válido para o estado.', possibleCause: 'CEP incorreto no endereço do emitente ou destinatário.', suggestedFix: 'Corrija o CEP no cadastro.' },
  '999': { message: 'Erro interno da SEFAZ', explanation: 'A SEFAZ retornou um erro interno não específico.', possibleCause: 'Instabilidade no serviço da SEFAZ.', suggestedFix: 'Aguarde alguns minutos e tente novamente. Se o erro persistir, entre em contingência.' },
};

/** Resolve a entrada do catálogo pelo código de rejeição SEFAZ. */
export function resolveRejection(code: string): RejectionEntry {
  return (
    REJECTION_CATALOG[code] ?? {
      message: `Rejeição SEFAZ código ${code}`,
      explanation: 'Código de rejeição não catalogado.',
      possibleCause: 'Consulte a documentação técnica da SEFAZ para o código informado.',
      suggestedFix: 'Verifique o XML gerado e os dados da nota.',
    }
  );
}
