import type { Pool } from 'mysql2/promise';
import { createMysqlPool, mysqlConfigFromEnvironment } from './connection.js';
import { applyMigrations } from './migrations.js';

export async function initializeStorage(prefix = 'MYSQL'): Promise<Pool> {
  const pool = createMysqlPool(mysqlConfigFromEnvironment(prefix));

  try {
    await applyMigrations(pool);

    return pool;
  } catch {
    await pool.end();
    throw new Error('Audit storage initialization failed.');
  }
}
