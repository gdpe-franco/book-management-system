import assert from 'node:assert/strict';
import test from 'node:test';
import type { RowDataPacket } from 'mysql2/promise';
import { PersistAuditEvent } from '../../../../src/application/persist-audit-event.js';
import { createMysqlPool, mysqlConfigFromEnvironment } from '../../../../src/infrastructure/mysql/connection.js';
import { applyMigrations } from '../../../../src/infrastructure/mysql/migrations.js';
import { MysqlAuditLogStore } from '../../../../src/infrastructure/mysql/mysql-audit-log-store.js';
import { assertMysqlTestEnvironment } from '../../test-environment.js';

assertMysqlTestEnvironment();

const pool = createMysqlPool(mysqlConfigFromEnvironment('MYSQL_TEST'));

test.before(async () => {
  await pool.execute('DROP TABLE IF EXISTS audit_logs');
  await pool.execute('DROP TABLE IF EXISTS audit_schema_migrations');
  await applyMigrations(pool);
});

test.after(async () => {
  await pool.execute('DROP TABLE IF EXISTS audit_logs');
  await pool.execute('DROP TABLE IF EXISTS audit_schema_migrations');
  await pool.end();
});

test('persists every v1 event field once', async () => {
  const useCase = new PersistAuditEvent(new MysqlAuditLogStore(pool));
  const event = sampleEvent();

  assert.equal(await useCase.execute(event), 'created');

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT event_id, event_type, event_version, DATE_FORMAT(occurred_at, '%Y-%m-%dT%H:%i:%sZ') AS occurred_at,
      actor_id, book_snapshot, changes, persisted_at
    FROM audit_logs
  `);
  const row = rows[0];

  assert.equal(rows.length, 1);
  assert.equal(row?.event_id, event.event_id);
  assert.equal(row?.event_type, event.event_type);
  assert.equal(row?.event_version, event.event_version);
  assert.equal(row?.occurred_at, '2026-07-27T12:00:00Z');
  assert.equal(row?.actor_id, event.actor.id);
  assert.deepEqual(row?.book_snapshot, event.book);
  assert.deepEqual(row?.changes, event.changes);
  assert.ok(row?.persisted_at);
});

function sampleEvent(): {
  event_id: string;
  event_type: string;
  event_version: number;
  occurred_at: string;
  actor: { id: number };
  book: Record<string, unknown>;
  changes: Record<string, unknown>;
} {
  return {
    event_id: '0f4e5655-2e70-4381-b0b6-c6903b0e1bb2',
    event_type: 'book.updated',
    event_version: 1,
    occurred_at: '2026-07-27T12:00:00Z',
    actor: { id: 1 },
    book: { id: 42, title: 'Updated title', author: 'Example author', isbn: '9780000000000', published_year: 2026 },
    changes: { title: { before: 'Example title', after: 'Updated title' } },
  };
}
