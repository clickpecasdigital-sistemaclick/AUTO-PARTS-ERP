import { Injectable, type PipeTransform, type ArgumentMetadata } from '@nestjs/common';

/**
 * Roda ANTES do `ValidationPipe`, em toda requisição. Resolve uma classe
 * inteira de bugs "silenciosos" encontrados nesta revisão: campos
 * opcionais no formulário (e-mail, UUID de outra tabela, URL) que, quando
 * deixados em branco, chegam na API como string vazia (`""`) — não como
 * `undefined`. `@IsOptional()` do class-validator só pula a validação
 * quando o valor é `undefined`/`null`; uma string vazia passa direto pro
 * validador de formato (`@IsEmail()`, `@IsUUID()`...), que rejeita `""`
 * como inválido. O sintoma pro usuário: "não foi possível salvar" com uma
 * mensagem técnica tipo "email must be an email" — mesmo o campo estando
 * em branco, do jeito que era pra ser permitido.
 *
 * Em vez de caçar e corrigir isso DTO por DTO (achamos o mesmo padrão em
 * 15+ arquivos), esse pipe global limpa qualquer string vazia do corpo
 * da requisição antes da validação rodar — resolve todos de uma vez, e
 * qualquer DTO novo já nasce protegido.
 */
@Injectable()
export class EmptyStringToUndefinedPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || value === null || typeof value !== 'object') return value;
    return this.clean(value);
  }

  private clean(input: unknown): unknown {
    if (input === '') return undefined;
    if (Array.isArray(input)) return input.map((item) => this.clean(item));
    if (input !== null && typeof input === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(input)) {
        result[key] = this.clean(val);
      }
      return result;
    }
    return input;
  }
}
