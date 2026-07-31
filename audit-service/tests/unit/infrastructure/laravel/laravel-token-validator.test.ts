import assert from 'node:assert/strict';
import test from 'node:test';
import { LaravelTokenValidator } from '../../../../src/infrastructure/laravel/laravel-token-validator.js';

test('forwards Authorization unchanged to Laravel', async () => {
  let url: URL | undefined;
  let authorization: string | null | undefined;
  const request: typeof fetch = async (input, init) => {
    url = new URL(String(input));
    authorization = new Headers(init?.headers).get('authorization');

    return new Response(null, { status: 200 });
  };

  const result = await new LaravelTokenValidator('http://backend:8000', request).validate('Bearer unchanged-token');

  assert.equal(result, 'valid');
  assert.equal(url?.toString(), 'http://backend:8000/api/v1/me');
  assert.equal(authorization, 'Bearer unchanged-token');
});

test('returns invalid for rejected Laravel tokens', async () => {
  const request: typeof fetch = async () => new Response(null, { status: 401 });

  assert.equal(await new LaravelTokenValidator('http://backend:8000', request).validate('Bearer rejected-token'), 'invalid');
});

test('returns unavailable when Laravel cannot validate', async () => {
  const unavailableResponse: typeof fetch = async () => new Response(null, { status: 500 });
  const unavailableRequest: typeof fetch = async () => { throw new Error('Laravel unavailable'); };

  assert.equal(await new LaravelTokenValidator('http://backend:8000', unavailableResponse).validate('Bearer token'), 'unavailable');
  assert.equal(await new LaravelTokenValidator('http://backend:8000', unavailableRequest).validate('Bearer token'), 'unavailable');
});
