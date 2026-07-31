import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { ListAuditLogs } from '../../../src/application/audit-logs/list-audit-logs.js';
import type { AuditLogReader } from '../../../src/application/audit-logs/ports/audit-log-reader.js';
import { ValidateAuditAccess } from '../../../src/application/authentication/validate-audit-access.js';
import type { TokenValidation, TokenValidator } from '../../../src/application/authentication/ports/token-validator.js';
import { createAuditServer } from '../../../src/http/audit-server.js';

test('returns authenticated Audit history and health', async () => {
  let query: Parameters<AuditLogReader['list']>[0] | undefined;
  const server = createAuditServer(
    validator('valid'),
    new ListAuditLogs({
      async list(input) {
        query = input;

        return {
          data: [{
            eventId: '00000000-0000-4000-8000-000000000001',
            eventType: 'book.updated',
            eventVersion: 1,
            occurredAt: new Date('2026-07-28T10:00:00Z'),
            actorId: 1,
            bookSnapshot: { id: 42 },
            changes: { title: { before: 'Before', after: 'After' } },
            persistedAt: new Date('2026-07-28T10:00:01Z'),
          }],
          currentPage: 2,
          lastPage: 3,
          perPage: 10,
          total: 21,
        };
      },
    }),
  );
  const origin = await listen(server);

  try {
    const health = await fetch(`${origin}/health`);
    const response = await fetch(`${origin}/api/v1/audit-logs?page=2&per_page=10&search=book.updated&sort_by=event_type&sort_direction=desc`, {
      headers: { authorization: 'Bearer valid-token' },
    });

    assert.deepEqual(await health.json(), { status: 'ok' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5174');
    assert.deepEqual(await response.json(), {
      data: [{
        event_id: '00000000-0000-4000-8000-000000000001',
        event_type: 'book.updated',
        event_version: 1,
        occurred_at: '2026-07-28T10:00:00Z',
        actor_id: 1,
        book_snapshot: { id: 42 },
        changes: { title: { before: 'Before', after: 'After' } },
        persisted_at: '2026-07-28T10:00:01Z',
      }],
      meta: { current_page: 2, last_page: 3, per_page: 10, total: 21 },
    });
    assert.deepEqual(query, {
      page: 2,
      perPage: 10,
      search: 'book.updated',
      sortBy: 'event_type',
      sortDirection: 'desc',
    });
  } finally {
    await close(server);
  }
});

test('answers Audit-history authorization preflight requests', async () => {
  const server = createAuditServer(
    validator('valid'),
    new ListAuditLogs({ async list() { return emptyPage(); } }),
    'http://localhost:5174',
  );
  const origin = await listen(server);

  try {
    const response = await fetch(`${origin}/api/v1/audit-logs`, { method: 'OPTIONS' });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5174');
    assert.equal(response.headers.get('access-control-allow-headers'), 'Authorization');
  } finally {
    await close(server);
  }
});

test('rejects invalid and unavailable authentication before querying', async () => {
  let reads = 0;
  const tokenValidator: TokenValidator = {
    async validate(authorization) {
      return authorization === 'Bearer unavailable' ? 'unavailable' : 'invalid';
    },
  };
  const server = createAuditServer(
    new ValidateAuditAccess(tokenValidator),
    new ListAuditLogs({ async list() { reads += 1; return emptyPage(); } }),
  );
  const origin = await listen(server);

  try {
    const invalid = await fetch(`${origin}/api/v1/audit-logs`, { headers: { authorization: 'Bearer invalid' } });
    const unavailable = await fetch(`${origin}/api/v1/audit-logs`, { headers: { authorization: 'Bearer unavailable' } });

    assert.deepEqual(await invalid.json(), { message: 'Unauthenticated.' });
    assert.equal(unavailable.status, 500);
    assert.deepEqual(await unavailable.json(), { message: 'Server error.' });
    assert.equal(reads, 0);
  } finally {
    await close(server);
  }
});

test('returns validation errors for invalid Audit-history queries', async () => {
  const server = createAuditServer(validator('valid'), new ListAuditLogs({ async list() { return emptyPage(); } }));
  const origin = await listen(server);

  try {
    const response = await fetch(`${origin}/api/v1/audit-logs?sort_by=id`, { headers: { authorization: 'Bearer valid-token' } });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
      message: 'The given data was invalid.',
      errors: { query: ['Invalid Audit-history query.'] },
    });
  } finally {
    await close(server);
  }
});

function validator(result: TokenValidation): ValidateAuditAccess {
  return new ValidateAuditAccess({ async validate() { return result; } });
}

function emptyPage() {
  return { data: [], currentPage: 1, lastPage: 1, perPage: 15, total: 0 };
}

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return `http://127.0.0.1:${port}`;
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => error === undefined ? resolve() : reject(error)));
}
