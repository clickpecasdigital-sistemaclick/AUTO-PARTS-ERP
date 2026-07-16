import { Injectable } from '@nestjs/common';

/**
 * Gerador de XML NF-e/NFC-e conforme leiaute 4.00 (PL_009v4.00_NT2016.002_v1.80).
 * Estratégia: gera o XML como string (eficiente e sem dependência de
 * biblioteca de DOM/XMLBuilder) — a mesma abordagem usada pelos principais
 * emissores de NF-e do mercado. A assinatura digital real (XAdES/xmldsig)
 * exigiria o certificado A1 plugado e a biblioteca `xml-crypto` — a
 * estrutura do elemento `<Signature>` é deixada como placeholder para a
 * integração com PSP ou com o SEFAZ direto (como o `webhookPayload` do
 * PIX, Sprint 10, e o `xmlPath` do BankSlip). O XML não assinado já é
 * suficiente para validar a estrutura e os totais antes de qualquer
 * integração real.
 */
@Injectable()
export class NfeXmlBuilderService {
  /**
   * Monta o XML da NF-e modelo 55 completo (sem assinatura).
   * `data` é o objeto já hydratado com todos os campos necessários —
   * quem chama é o `FiscalIssuanceService`, que busca e valida cada campo
   * antes de passar aqui.
   */
  buildNfeXml(data: NfeData): string {
    const det = data.items.map((item, index) => this.buildDetElement(item, index + 1)).join('');
    const totICMS = this.calculateTotals(data.items);
    const infNFe = `<infNFe versao="4.00" Id="NFe${data.accessKey}">
      <ide>
        <cUF>${data.cuf}</cUF>
        <cNF>${data.cnf}</cNF>
        <natOp>${esc(data.naturezaOperacao)}</natOp>
        <mod>55</mod>
        <serie>${data.serie}</serie>
        <nNF>${data.number}</nNF>
        <dhEmi>${data.issueDate}</dhEmi>
        <tpNF>${data.tpNF}</tpNF>
        <idDest>${data.idDest}</idDest>
        <cMunFG>${data.cMunFG}</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>${data.tpEmis}</tpEmis>
        <cDV>${data.cDV}</cDV>
        <tpAmb>${data.environment === 'production' ? '1' : '2'}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>${data.indFinal}</indFinal>
        <indPres>${data.indPres}</indPres>
        <procEmi>3</procEmi>
        <verProc>Auto Parts ERP 12.0</verProc>
      </ide>
      ${this.buildEmitenteElement(data.emitente)}
      ${this.buildDestinatarioElement(data.destinatario)}
      ${det}
      <total>
        <ICMSTot>
          <vBC>${fmt(totICMS.vBC)}</vBC>
          <vICMS>${fmt(totICMS.vICMS)}</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>${fmt(totICMS.vFCP)}</vFCP>
          <vBCST>${fmt(totICMS.vBCST)}</vBCST>
          <vST>${fmt(totICMS.vST)}</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${fmt(totICMS.vProd)}</vProd>
          <vFrete>${fmt(data.totalFreight ?? 0)}</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>${fmt(totICMS.vDesc)}</vDesc>
          <vII>0.00</vII>
          <vIPI>${fmt(totICMS.vIPI)}</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>${fmt(totICMS.vPIS)}</vPIS>
          <vCOFINS>${fmt(totICMS.vCOFINS)}</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${fmt(totICMS.vNF)}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <cobr>
        <fat>
          <nFat>${data.number}</nFat>
          <vOrig>${fmt(totICMS.vNF)}</vOrig>
          <vDesc>0.00</vDesc>
          <vLiq>${fmt(totICMS.vNF)}</vLiq>
        </fat>
      </cobr>
      <infAdic>
        ${data.additionalInfo ? `<infCpl>${esc(data.additionalInfo)}</infCpl>` : ''}
      </infAdic>
    </infNFe>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    ${infNFe}
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><!-- PLACEHOLDER: assinatura digital real via certificado A1 --></Signature>
  </NFe>
</nfeProc>`;
  }

  /** Monta o XML da NFC-e modelo 65 (cupom fiscal eletrônico). */
  buildNfceXml(data: NfceData): string {
    const det = data.items.map((item, index) => this.buildDetElement(item, index + 1)).join('');
    const totICMS = this.calculateTotals(data.items);
    const infNFe = `<infNFe versao="4.00" Id="NFe${data.accessKey}">
      <ide>
        <cUF>${data.cuf}</cUF>
        <cNF>${data.cnf}</cNF>
        <natOp>${esc(data.naturezaOperacao)}</natOp>
        <mod>65</mod>
        <serie>${data.serie}</serie>
        <nNF>${data.number}</nNF>
        <dhEmi>${data.issueDate}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>${data.cMunFG}</cMunFG>
        <tpImp>4</tpImp>
        <tpEmis>${data.tpEmis}</tpEmis>
        <cDV>${data.cDV}</cDV>
        <tpAmb>${data.environment === 'production' ? '1' : '2'}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>3</procEmi>
        <verProc>Auto Parts ERP 12.0</verProc>
      </ide>
      ${this.buildEmitenteElement(data.emitente)}
      ${data.cpfCnpjConsumidor ? `<dest><CPF>${data.cpfCnpjConsumidor}</CPF></dest>` : ''}
      ${det}
      <total>
        <ICMSTot>
          <vBC>${fmt(totICMS.vBC)}</vBC>
          <vICMS>${fmt(totICMS.vICMS)}</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>${fmt(totICMS.vFCP)}</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${fmt(totICMS.vProd)}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>${fmt(totICMS.vDesc)}</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>${fmt(totICMS.vPIS)}</vPIS>
          <vCOFINS>${fmt(totICMS.vCOFINS)}</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${fmt(totICMS.vNF)}</vNF>
        </ICMSTot>
      </total>
      <transp><modFrete>9</modFrete></transp>
      <pag>
        ${(data.payments ?? []).map((p) => `<detPag><tPag>${p.type}</tPag><vPag>${fmt(p.value)}</vPag></detPag>`).join('')}
      </pag>
      <infNFeSupl>
        <qrCode>${data.qrCodeUrl ?? ''}</qrCode>
        <urlChave>http://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx</urlChave>
      </infNFeSupl>
    </infNFe>`;

    return `<?xml version="1.0" encoding="UTF-8"?><nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe xmlns="http://www.portalfiscal.inf.br/nfe">${infNFe}<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><!-- PLACEHOLDER --></Signature></NFe></nfeProc>`;
  }

  /** Monta o XML de cancelamento de NF-e. */
  buildCancellationXml(data: { accessKey: string; protocol: string; justification: string; environment: string }): string {
    return `<?xml version="1.0" encoding="UTF-8"?><envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00"><idLote>1</idLote><evento versao="1.00"><infEvento Id="ID11010100000000000000000000000000000000000000001"><cOrgao>91</cOrgao><tpAmb>${data.environment === 'production' ? '1' : '2'}</tpAmb><chNFe>${data.accessKey}</chNFe><dhEvento>${new Date().toISOString()}</dhEvento><tpEvento>110111</tpEvento><nSeqEvento>1</nSeqEvento><verEvento>1.00</verEvento><detEvento versao="1.00"><descEvento>Cancelamento</descEvento><nProt>${data.protocol}</nProt><xJust>${esc(data.justification)}</xJust></detEvento></infEvento><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><!-- PLACEHOLDER --></Signature></evento></envEvento>`;
  }

  /** Monta o XML de Carta de Correção (CC-e). */
  buildCorrectionLetterXml(data: { accessKey: string; correction: string; sequence: number; environment: string }): string {
    return `<?xml version="1.0" encoding="UTF-8"?><envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00"><idLote>1</idLote><evento versao="1.00"><infEvento Id="ID110110${data.accessKey}0${String(data.sequence).padStart(2, '0')}"><cOrgao>91</cOrgao><tpAmb>${data.environment === 'production' ? '1' : '2'}</tpAmb><chNFe>${data.accessKey}</chNFe><dhEvento>${new Date().toISOString()}</dhEvento><tpEvento>110110</tpEvento><nSeqEvento>${data.sequence}</nSeqEvento><verEvento>1.00</verEvento><detEvento versao="1.00"><descEvento>Carta de Correcao</descEvento><xCorrecao>${esc(data.correction)}</xCorrecao><xCondUso>A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.</xCondUso></detEvento></infEvento><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><!-- PLACEHOLDER --></Signature></evento></envEvento>`;
  }

  /** Monta o XML de inutilização de numeração. */
  buildVoidingXml(data: { branchCnpj: string; model: string; serie: number; numberFrom: number; numberTo: number; year: number; justification: string; environment: string }): string {
    const id = `ID${String(data.model).padStart(2, '0')}${data.branchCnpj}${data.year}${String(data.serie).padStart(3, '0')}${String(data.numberFrom).padStart(9, '0')}${String(data.numberTo).padStart(9, '0')}`;
    return `<?xml version="1.0" encoding="UTF-8"?><enviNFe2Inut xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><infInut Id="${id}"><tpAmb>${data.environment === 'production' ? '1' : '2'}</tpAmb><xServ>INUTILIZAR</xServ><cUF>43</cUF><ano>${data.year}</ano><CNPJ>${data.branchCnpj}</CNPJ><mod>${data.model}</mod><serie>${data.serie}</serie><nNFIni>${data.numberFrom}</nNFIni><nNFFin>${data.numberTo}</nNFFin><xJust>${esc(data.justification)}</xJust></infInut><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><!-- PLACEHOLDER --></Signature></enviNFe2Inut>`;
  }

  private buildEmitenteElement(e: NfeEmitente): string {
    return `<emit><CNPJ>${e.cnpj}</CNPJ><xNome>${esc(e.name)}</xNome>${e.tradeName ? `<xFant>${esc(e.tradeName)}</xFant>` : ''}<enderEmit><xLgr>${esc(e.street)}</xLgr><nro>${esc(e.number)}</nro><xBairro>${esc(e.neighborhood)}</xBairro><cMun>${e.ibgeCode}</cMun><xMun>${esc(e.city)}</xMun><UF>${e.uf}</UF><CEP>${e.cep}</CEP><cPais>1058</cPais><xPais>Brasil</xPais>${e.phone ? `<fone>${e.phone}</fone>` : ''}</enderEmit><IE>${e.ie}</IE><CRT>${e.crt}</CRT></emit>`;
  }

  private buildDestinatarioElement(d: NfeDestinatario): string {
    return `<dest>${d.cnpj ? `<CNPJ>${d.cnpj}</CNPJ>` : `<CPF>${d.cpf}</CPF>`}<xNome>${esc(d.name)}</xNome><enderDest><xLgr>${esc(d.street)}</xLgr><nro>${esc(d.number)}</nro><xBairro>${esc(d.neighborhood)}</xBairro><cMun>${d.ibgeCode}</cMun><xMun>${esc(d.city)}</xMun><UF>${d.uf}</UF><CEP>${d.cep}</CEP><cPais>1058</cPais><xPais>Brasil</xPais></enderDest><indIEDest>${d.indIEDest}</indIEDest>${d.ie ? `<IE>${d.ie}</IE>` : ''}<email>${d.email ?? ''}</email></dest>`;
  }

  private buildDetElement(item: NfeItem, seq: number): string {
    const icmsGroup = item.csosnIcms
      ? `<CSOSN>${item.csosnIcms}</CSOSN>`
      : `<CST>${item.cstIcms ?? '00'}</CST><modBC>3</modBC><vBC>${fmt(item.icmsBcAmount)}</vBC><pICMS>${fmt(item.icmsRate)}</pICMS><vICMS>${fmt(item.icmsAmount)}</vICMS>`;

    return `<det nItem="${seq}"><prod><cProd>${esc(item.productCode)}</cProd><cEAN>${item.ean ?? 'SEM GTIN'}</cEAN><xProd>${esc(item.description)}</xProd><NCM>${item.ncm ?? '00000000'}</NCM>${item.cest ? `<CEST>${item.cest}</CEST>` : ''}<CFOP>${item.cfop}</CFOP><uCom>${esc(item.unit)}</uCom><qCom>${item.quantity.toFixed(4)}</qCom><vUnCom>${item.unitPrice.toFixed(4)}</vUnCom><vProd>${fmt(item.productValue)}</vProd><cEANTrib>${item.ean ?? 'SEM GTIN'}</cEANTrib><uTrib>${esc(item.unit)}</uTrib><qTrib>${item.quantity.toFixed(4)}</qTrib><vUnTrib>${item.unitPrice.toFixed(4)}</vUnTrib><indTot>1</indTot></prod><imposto><ICMS><ICMS${item.csosnIcms ? 'SNT900' : '00'}><orig>${item.icmsOrigin ?? '0'}</orig>${icmsGroup}</ICMS${item.csosnIcms ? 'SNT900' : '00'}></ICMS><PIS><PISAliq><CST>${item.cstPis ?? '01'}</CST><vBC>${fmt(item.productValue)}</vBC><pPIS>${fmt(item.pisRate)}</pPIS><vPIS>${fmt(item.pisAmount)}</vPIS></PISAliq></PIS><COFINS><COFINSAliq><CST>${item.cstCofins ?? '01'}</CST><vBC>${fmt(item.productValue)}</vBC><pCOFINS>${fmt(item.cofinsRate)}</pCOFINS><vCOFINS>${fmt(item.cofinsAmount)}</vCOFINS></COFINSAliq></COFINS></imposto></det>`;
  }

  private calculateTotals(items: NfeItem[]) {
    return items.reduce(
      (acc, item) => ({
        vBC: acc.vBC + item.icmsBcAmount,
        vICMS: acc.vICMS + item.icmsAmount,
        vFCP: acc.vFCP + item.fcpAmount,
        vBCST: acc.vBCST + item.icmsStBcAmount,
        vST: acc.vST + item.icmsStAmount,
        vProd: acc.vProd + item.productValue,
        vDesc: acc.vDesc + item.discountAmount,
        vIPI: acc.vIPI + item.ipiAmount,
        vPIS: acc.vPIS + item.pisAmount,
        vCOFINS: acc.vCOFINS + item.cofinsAmount,
        vNF: acc.vNF + item.totalAmount,
      }),
      { vBC: 0, vICMS: 0, vFCP: 0, vBCST: 0, vST: 0, vProd: 0, vDesc: 0, vIPI: 0, vPIS: 0, vCOFINS: 0, vNF: 0 },
    );
  }
}

function fmt(value: number): string {
  return value.toFixed(2);
}

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// ---- Tipos auxiliares --------------------------------------------------------

export interface NfeEmitente {
  cnpj: string; ie: string; name: string; tradeName?: string; crt: number;
  street: string; number: string; neighborhood: string; city: string; uf: string; cep: string; ibgeCode: string; phone?: string;
}

export interface NfeDestinatario {
  cnpj?: string; cpf?: string; ie?: string; indIEDest: string; name: string; email?: string;
  street: string; number: string; neighborhood: string; city: string; uf: string; cep: string; ibgeCode: string;
}

export interface NfeItem {
  productCode: string; ean?: string; description: string; ncm?: string; cest?: string; cfop: string; unit: string;
  quantity: number; unitPrice: number; productValue: number; discountAmount: number; totalAmount: number;
  cstIcms?: string; csosnIcms?: string; icmsOrigin?: string; icmsRate: number; icmsBcAmount: number; icmsAmount: number;
  icmsStBcAmount: number; icmsStAmount: number; fcpAmount: number;
  cstIpi?: string; ipiRate: number; ipiAmount: number;
  cstPis?: string; pisRate: number; pisAmount: number;
  cstCofins?: string; cofinsRate: number; cofinsAmount: number;
}

export interface NfeData {
  accessKey: string; cuf: string; cnf: string; cDV: string; naturezaOperacao: string;
  serie: number; number: number; issueDate: string; tpNF: string; idDest: string; cMunFG: string;
  indFinal: string; indPres: string; tpEmis: string; environment: string;
  emitente: NfeEmitente; destinatario: NfeDestinatario; items: NfeItem[];
  totalFreight?: number; additionalInfo?: string;
}

export interface NfceData extends Omit<NfeData, 'destinatario' | 'idDest' | 'tpNF'> {
  cpfCnpjConsumidor?: string; qrCodeUrl?: string;
  payments?: { type: string; value: number }[];
}
