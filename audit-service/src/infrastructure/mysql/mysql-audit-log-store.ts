import type { ResultSetHeader, Pool, RowDataPacket } from 'mysql2/promise';
import type { AuditLogStore, PersistResult } from '../../application/audit-logs/ports/audit-log-store.js';
import type { AuditEvent } from '../../domain/audit-event.js';
import type { AuditLog } from '../../domain/audit-log.js';

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

      if (result.affectedRows !== 1) {
        return { status: 'already_exists' };
      }

      const [rows] = await this.pool.execute<RowDataPacket[]>(`
        SELECT persisted_at
        FROM audit_logs
        WHERE event_id = ?
      `, [event.eventId]);
      const row = rows[0];

      if (row === undefined) {
        throw new Error('Persisted Audit log could not be read.');
      }

      return { status: 'created', auditLog: toAuditLog(event, row.persisted_at) };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return { status: 'already_exists' };
      }

      throw error;
    }
  }
}

function toAuditLog(event: AuditEvent, persistedAt: unknown): AuditLog {
  return {
    eventId: event.eventId,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    occurredAt: event.occurredAt,
    actorId: event.actorId,
    bookSnapshot: event.bookSnapshot,
    changes: event.changes,
    persistedAt: toDate(persistedAt),
  };
}

function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'ER_DUP_ENTRY';
}
