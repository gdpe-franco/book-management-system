import type { AuditLog } from '../../domain/audit-log.js';

export interface AuditLogPayload {
  event_id: string;
  event_type: string;
  event_version: number;
  occurred_at: string;
  actor_id: number;
  book_snapshot: Record<string, unknown>;
  changes: Record<string, unknown>;
  persisted_at: string;
}

export function auditLogPayload(log: AuditLog): AuditLogPayload {
  return {
    event_id: log.eventId,
    event_type: log.eventType,
    event_version: log.eventVersion,
    occurred_at: utcSeconds(log.occurredAt),
    actor_id: log.actorId,
    book_snapshot: log.bookSnapshot,
    changes: log.changes,
    persisted_at: utcSeconds(log.persistedAt),
  };
}

function utcSeconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
