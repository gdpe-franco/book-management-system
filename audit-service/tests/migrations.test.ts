import assert from 'node:assert/strict';
import test from 'node:test';
import type { RowDataPacket } from 'mysql2/promise';
import { createMysqlPool, mysqlConfigFromEnvironment } from '../src/infrastructure/mysql/connection.js';
import { applyMigrations } from '../src/infrastructure/mysql/migrations.js';

const pool = createMysqlPool(mysqlConfigFromEnvironment('MYSQL_TEST'));

test.before(async () => {
  await pool.execute('DROP TABLE IF EXISTS audit_logs');
  await pool.execute('DROP TABLE IF EXISTS audit_schema_migrations');
});

test.after(async () => {
  await pool.execute('DROP TABLE IF EXISTS audit_logs');
  await pool.execute('DROP TABLE IF EXISTS audit_schema_migrations');
  await pool.end();
});

test('creates the documented append-only audit-log schema and can be rerun', async () => {
  await applyMigrations(pool);
  await applyMigrations(pool);

  const [columns] = await pool.execute<RowDataPacket[]>(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'audit_logs'
    ORDER BY ORDINAL_POSITION
  `);

  assert.deepEqual(
    columns.map((column) => [column.COLUMN_NAME, column.COLUMN_TYPE, column.IS_NULLABLE]),
    [
      ['event_id', 'char(36)', 'NO'],
      ['event_type', 'varchar(64)', 'NO'],
      ['event_version', 'smallint unsigned', 'NO'],
      ['occurred_at', 'timestamp(6)', 'NO'],
      ['actor_id', 'bigint unsigned', 'NO'],
      ['book_snapshot', 'json', 'NO'],
      ['changes', 'json', 'NO'],
      ['persisted_at', 'timestamp(6)', 'NO'],
    ],
  );
  assert.match(String(columns.at(-1)?.COLUMN_DEFAULT), /CURRENT_TIMESTAMP\(6\)/i);
  assert.equal(columns.some((column) => column.COLUMN_NAME === 'updated_at'), false);

  const [constraints] = await pool.execute<RowDataPacket[]>(`
    SELECT CONSTRAINT_NAME
    FROM information_schema.table_constraints
    WHERE table_schema = DATABASE() AND table_name = 'audit_logs'
  `);

  assert.deepEqual(
    constraints.map((constraint) => constraint.CONSTRAINT_NAME).sort(), [
      'PRIMARY',
      'audit_logs_event_version_positive',
    ]);

  const [migrations] = await pool.execute<RowDataPacket[]>(
    'SELECT version FROM audit_schema_migrations WHERE version = ?',
    ['001_create_audit_logs'],
  );

  assert.equal(migrations.length, 1);
});
