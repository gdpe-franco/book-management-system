export type TokenValidation = 'valid' | 'invalid' | 'unavailable';

export interface TokenValidator {
  validate(authorization: string): Promise<TokenValidation>;
}
