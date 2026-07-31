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

test('rejects an invalid Audit-history query before reading', () => {
  const reader: AuditLogReader = { async list() { throw new Error('must not read'); } };

  assert.throws(
    () => new ListAuditLogs(reader).execute({ occurredFrom: new Date('2026-07-31T00:00:00Z'), occurredTo: new Date('2026-07-30T00:00:00Z') }),
    /occurrence range is invalid/,
  );
});

function page() {
  return { data: [], currentPage: 1, lastPage: 1, perPage: 15, total: 0 };
}
