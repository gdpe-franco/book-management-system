import assert from 'node:assert/strict';
import test from 'node:test';
import { createMysqlPool, mysqlConfigFromEnvironment } from '../../../../src/infrastructure/mysql/connection.js';
import { applyMigrations } from '../../../../src/infrastructure/mysql/migrations.js';
import { MysqlAuditLogReader } from '../../../../src/infrastructure/mysql/mysql-audit-log-reader.js';
import { assertMysqlTestEnvironment } from '../../test-environment.js';

assertMysqlTestEnvironment();

const pool = createMysqlPool(mysqlConfigFromEnvironment('MYSQL_TEST'));
const reader = new MysqlAuditLogReader(pool);

test.before(async () => {
  await pool.execute('DROP TABLE IF EXISTS audit_logs');
  await pool.execute('DROP TABLE IF EXISTS audit_schema_migrations');
  await applyMigrations(pool);
  await pool.execute(`
    INSERT INTO audit_logs (event_id, event_type, event_version, occurred_at, actor_id, book_snapshot, changes)
    VALUES
      ('00000000-0000-4000-8000-000000000001', 'book.created', 1, '2026-07-27 10:00:00', 1, '{"id": 1}', '{}'),
      ('00000000-0000-4000-8000-000000000002', 'book.updated', 1, '2026-07-28 10:00:00', 1, '{"id": 2}', '{}'),
      ('00000000-0000-4000-8000-000000000003', 'book.deleted', 1, '2026-07-29 10:00:00', 2, '{"id": 3}', '{}')
  `);
});

test.after(async () => {
  await pool.execute('DROP TABLE IF EXISTS audit_logs');
  await pool.execute('DROP TABLE IF EXISTS audit_schema_migrations');
  await pool.end();
});

test('returns ordered pages with event-type and occurrence filters', async () => {
  const page = await reader.list({ page: 1, perPage: 2 });
  const filtered = await reader.list({
    page: 1,
    perPage: 15,
    eventType: 'book.updated',
    occurredFrom: new Date('2026-07-28T00:00:00Z'),
    occurredTo: new Date('2026-07-28T23:59:59Z'),
  });

  assert.deepEqual(page.data.map((log) => log.eventId), [
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000002',
  ]);
  assert.deepEqual(
    { currentPage: page.currentPage, lastPage: page.lastPage, perPage: page.perPage, total: page.total },
    { currentPage: 1, lastPage: 2, perPage: 2, total: 3 },
  );
  assert.deepEqual(filtered.data.map((log) => log.eventId), ['00000000-0000-4000-8000-000000000002']);
  assert.equal(filtered.total, 1);
});
