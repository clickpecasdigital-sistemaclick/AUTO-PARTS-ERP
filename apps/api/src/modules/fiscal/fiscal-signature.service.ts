import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { SupabaseStorageService } from '@/common/storage/supabase-storage.service';

const FISCAL_CERT_BUCKET = 'fiscal-certificates';

/**
 * Assinatura digital de NF-e — o pedaço que faltava para a emissão real
 * funcionar. Duas responsabilidades:
 *
 * 1. Criptografar/descriptografar a senha do certificado .pfx em repouso
 *    (AES-256-GCM, mesmo padrão de `security.service.ts`). Antes desta
 *    revisão, a senha "nunca era enviada ao servidor" — o que parecia
 *    seguro, mas na prática significa que o servidor NUNCA teria como
 *    usar o certificado pra assinar nada. A senha precisa chegar
 *    (uma vez, no upload) e ficar guardada de forma segura — não em
 *    texto puro, mas de um jeito que o próprio servidor consiga reverter
 *    na hora de assinar um XML.
 *
 * 2. Extrair a chave privada + certificado de dentro do .pfx (node-forge,
 *    já que Node não lê PKCS#12 nativamente) e assinar o XML da NF-e
 *    (xml-crypto, padrão XML-DSig exigido pela SEFAZ).
 *
 * O que este serviço NÃO faz (propositalmente, escopo separado): chamada
 * SOAP para o webservice da SEFAZ de cada UF, tratamento de contingência,
 * validação contra o XSD oficial. Isso depende de testar com um
 * certificado real, e cada UF tem endpoint/particularidades próprias —
 * fica pronto para ser plugado assim que houver um certificado real para
 * validar contra o ambiente de homologação da SEFAZ.
 */
@Injectable()
export class FiscalSignatureService {
  constructor(private readonly storage: SupabaseStorageService) {}

  private deriveKey(): Buffer {
    const secret = process.env.AES_256_KEY;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException('AES_256_KEY não configurada — obrigatória em produção.');
      }
      return crypto.scryptSync('dev-only-insecure-placeholder-key', 'autocore-erp-salt', 32);
    }
    return crypto.scryptSync(secret, 'autocore-erp-salt', 32);
  }

  encryptPassword(plainPassword: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.deriveKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainPassword, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  private decryptPassword(encryptedPassword: string): string {
    const raw = Buffer.from(encryptedPassword, 'base64');
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.deriveKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  /**
   * Valida um .pfx recém-enviado: confirma que a senha abre o arquivo e
   * devolve os metadados (validade, número de série, titular) que o
   * upload precisa gravar. Lança erro claro se a senha estiver errada ou
   * o arquivo não for um PKCS#12 válido — evita salvar um certificado
   * "quebrado" que só vai falhar na hora de emitir a primeira nota.
   */
  inspectCertificate(pfxBuffer: Buffer, password: string) {
    let p12: forge.pkcs12.Pkcs12Pfx;
    try {
      const p12Der = forge.util.createBuffer(pfxBuffer.toString('binary'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch {
      throw new BadRequestException('Não foi possível abrir o certificado — senha incorreta ou arquivo .pfx inválido/corrompido.');
    }

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
    const cert = certBags[0]?.cert;
    if (!cert) throw new BadRequestException('Certificado não contém um certificado X.509 válido.');

    return {
      subjectCN: cert.subject.getField('CN')?.value ?? null,
      serialNumber: cert.serialNumber,
      validFrom: cert.validity.notBefore,
      validUntil: cert.validity.notAfter,
    };
  }

  /** Baixa o .pfx do Storage e assina um XML de NF-e com a chave privada dele. */
  async signXml(params: { storageRef: string; encryptedPassword: string; xml: string; referenceId: string }): Promise<string> {
    const pfxBuffer = await this.storage.download(FISCAL_CERT_BUCKET, params.storageRef);
    const password = this.decryptPassword(params.encryptedPassword);

    const p12Der = forge.util.createBuffer(pfxBuffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ?? [];
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
    const privateKey = keyBags[0]?.key;
    const cert = certBags[0]?.cert;
    if (!privateKey || !cert) throw new InternalServerErrorException('Certificado inválido: chave privada ou certificado ausente.');

    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    const certPem = forge.pki.certificateToPem(cert);

    // Padrão XML-DSig exigido pela SEFAZ: assinatura enveloped sobre o
    // elemento identificado por `Id="${referenceId}"` (a tag <infNFe Id="...">).
    const sig = new SignedXml({
      privateKey: privateKeyPem,
      publicCert: certPem,
    });
    sig.addReference({
      xpath: `//*[@Id='${params.referenceId}']`,
      transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    });
    sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
    sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
    sig.computeSignature(params.xml, { location: { reference: `//*[@Id='${params.referenceId}']`, action: 'append' } });

    return sig.getSignedXml();
  }
}
