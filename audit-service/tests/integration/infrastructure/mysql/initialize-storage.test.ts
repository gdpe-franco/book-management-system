import assert from 'node:assert/strict';
import test from 'node:test';
import type { RowDataPacket } from 'mysql2/promise';
import { initializeStorage } from '../../../../src/infrastructure/mysql/initialize-storage.js';
import { assertMysqlTestEnvironment } from '../../test-environment.js';

assertMysqlTestEnvironment();

test('initializes the Audit test storage before the server starts', async () => {
  const pool = await initializeStorage('MYSQL_TEST');

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT version FROM audit_schema_migrations WHERE version = ?',
      ['001_create_audit_logs'],
    );

    assert.equal(rows.length, 1);
  } finally {
    await pool.end();
  }
});
