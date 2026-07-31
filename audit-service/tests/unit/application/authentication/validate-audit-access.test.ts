import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidateAuditAccess } from '../../../../src/application/authentication/validate-audit-access.js';
import type { TokenValidation, TokenValidator } from '../../../../src/application/authentication/ports/token-validator.js';

test('returns the Laravel validation result', async () => {
  const results: TokenValidation[] = ['valid', 'invalid', 'unavailable'];
  let authorization: string | undefined;
  const validator: TokenValidator = {
    async validate(value) {
      authorization = value;

      return results.shift() ?? 'unavailable';
    },
  };
  const useCase = new ValidateAuditAccess(validator);

  assert.equal(await useCase.execute('Bearer unchanged-token'), 'valid');
  assert.equal(await useCase.execute('Bearer unchanged-token'), 'invalid');
  assert.equal(await useCase.execute('Bearer unchanged-token'), 'unavailable');
  assert.equal(authorization, 'Bearer unchanged-token');
});

test('rejects a missing Authorization header without validation', async () => {
  const validator: TokenValidator = { async validate() { throw new Error('must not validate'); } };

  assert.equal(await new ValidateAuditAccess(validator).execute(undefined), 'invalid');
});
