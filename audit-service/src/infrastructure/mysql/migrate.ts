import { createMysqlPool, mysqlConfigFromEnvironment } from './connection.js';
import { applyMigrations } from './migrations.js';

const pool = createMysqlPool(mysqlConfigFromEnvironment());

try {
  await applyMigrations(pool);
} finally {
  await pool.end();
}
