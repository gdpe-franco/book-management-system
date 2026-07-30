import type { ResultSetHeader, Pool } from 'mysql2/promise';
import type { AuditLogStore, PersistResult } from '../../application/ports/audit-log-store.js';
import type { AuditEvent } from '../../domain/audit-event.js';

export class MysqlAuditLogStore implements AuditLogStore {
  constructor(private readonly pool: Pick<Pool, 'execute'>) {}

  async persist(event: AuditEvent): Promise<PersistResult> {
    try {
      const [result] = await this.pool.execute<ResultSetHeader>(
        `INSERT INTO audit_logs
          (event_id, event_type, event_version, occurred_at, actor_id, book_snapshot, changes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          event.eventId,
          event.eventType,
          event.eventVersion,
          event.occurredAt,
          event.actorId,
          JSON.stringify(event.bookSnapshot),
          JSON.stringify(event.changes),
        ],
      );

      return result.affectedRows === 1 ? 'created' : 'already_exists';
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return 'already_exists';
      }

      throw error;
    }
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'ER_DUP_ENTRY';
}
