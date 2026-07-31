import type { BookEventType } from './audit-event.js';

export interface AuditLog {
  eventId: string;
  eventType: BookEventType;
  eventVersion: number;
  occurredAt: Date;
  actorId: number;
  bookSnapshot: Record<string, unknown>;
  changes: Record<string, unknown>;
  persistedAt: Date;
}

export interface AuditLogQuery {
  page?: number;
  perPage?: number;
  eventType?: BookEventType;
  occurredFrom?: Date;
  occurredTo?: Date;
}

export interface AuditLogPage {
  data: AuditLog[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}
