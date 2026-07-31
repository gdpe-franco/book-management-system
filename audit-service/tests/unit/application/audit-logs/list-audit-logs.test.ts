import assert from 'node:assert/strict';
import test from 'node:test';
import { ListAuditLogs } from '../../../../src/application/audit-logs/list-audit-logs.js';
import type { AuditLogReader } from '../../../../src/application/audit-logs/ports/audit-log-reader.js';

test('uses Book-style pagination defaults', async () => {
  let query: unknown;
  const reader: AuditLogReader = { async list(input) { query = input; return page(); } };

  await new ListAuditLogs(reader).execute();

  assert.deepEqual(query, { page: 1, perPage: 15 });
});

test('trims search and rejects invalid Audit-history queries before reading', async () => {
  let query: unknown;
  const reader: AuditLogReader = { async list(input) { query = input; return page(); } };

  await new ListAuditLogs(reader).execute({ search: '  book.updated  ', sortBy: 'event_type', sortDirection: 'desc' });

  assert.deepEqual(query, { page: 1, perPage: 15, search: 'book.updated', sortBy: 'event_type', sortDirection: 'desc' });
  const failingReader: AuditLogReader = { async list() { throw new Error('must not read'); } };

  assert.throws(
    () => new ListAuditLogs(failingReader).execute({ sortBy: 'id' as never }),
    /sort field is invalid/,
  );
});

function page() {
  return { data: [], currentPage: 1, lastPage: 1, perPage: 15, total: 0 };
}
