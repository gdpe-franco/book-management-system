import type { TokenValidation, TokenValidator } from './ports/token-validator.js';

export class ValidateAuditAccess {
  constructor(private readonly tokenValidator: TokenValidator) {}

  execute(authorization: string | undefined): Promise<TokenValidation> {
    return authorization === undefined ? Promise.resolve('invalid') : this.tokenValidator.validate(authorization);
  }
}
