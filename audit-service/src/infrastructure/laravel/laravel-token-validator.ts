import type { TokenValidation, TokenValidator } from '../../application/authentication/ports/token-validator.js';

export class LaravelTokenValidator implements TokenValidator {
  constructor(
    private readonly baseUrl: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  async validate(authorization: string): Promise<TokenValidation> {
    try {
      const response = await this.request(new URL('/api/v1/me', this.baseUrl), {
        headers: { authorization },
      });

      if (response.status === 200) {
        return 'valid';
      }

      return response.status >= 400 && response.status < 500 ? 'invalid' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }
}
