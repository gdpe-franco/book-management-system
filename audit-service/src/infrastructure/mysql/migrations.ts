import type { Pool, RowDataPacket } from 'mysql2/promise';

const auditLogsMigration = `
  CREATE TABLE audit_logs (
    event_id CHAR(36) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    event_version SMALLINT UNSIGNED NOT NULL,
    occurred_at TIMESTAMP(6) NOT NULL,
    actor_id BIGINT UNSIGNED NOT NULL,
    book_snapshot JSON NOT NULL,
    changes JSON NOT NULL,
    persisted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (event_id),
    CONSTRAINT audit_logs_event_version_positive CHECK (event_version > 0)
  )
`;

export async function applyMigrations(pool: Pick<Pool, 'execute'>): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS audit_schema_migrations (
      version VARCHAR(64) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    )
  `);

  const [applied] = await pool.execute<RowDataPacket[]>(
    'SELECT version FROM audit_schema_migrations WHERE version = ?',
    ['001_create_audit_logs'],
  );

  if (applied.length > 0) {
    return;
  }

  await pool.execute(auditLogsMigration);
  await pool.execute('INSERT INTO audit_schema_migrations (version) VALUES (?)', ['001_create_audit_logs']);
}
