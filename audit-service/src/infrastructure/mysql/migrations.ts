import type { Pool, RowDataPacket } from 'mysql2/promise';

const auditLogsMigration = `
  CREATE TABLE audit_logs (
    event_id CHAR(36) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    event_version SMALLINT UNSIGNED NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    actor_id BIGINT UNSIGNED NOT NULL,
    book_snapshot JSON NOT NULL,
    changes JSON NOT NULL,
    persisted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    CONSTRAINT audit_logs_event_version_positive CHECK (event_version > 0)
  )
`;

const migrations = [
  ['001_create_audit_logs', auditLogsMigration],
  ['002_normalize_audit_timestamps', `
    ALTER TABLE audit_logs
      MODIFY occurred_at TIMESTAMP NOT NULL,
      MODIFY persisted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `],
] as const;

export async function applyMigrations(pool: Pick<Pool, 'execute'>): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS audit_schema_migrations (
      version VARCHAR(64) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    )
  `);

  for (const [version, migration] of migrations) {
    const [applied] = await pool.execute<RowDataPacket[]>(
      'SELECT version FROM audit_schema_migrations WHERE version = ?',
      [version],
    );

    if (applied.length === 0) {
      await pool.execute(migration);
      await pool.execute('INSERT INTO audit_schema_migrations (version) VALUES (?)', [version]);
    }
  }
}
