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
  search?: string;
  sortBy?: AuditLogSortBy;
  sortDirection?: AuditLogSortDirection;
}

export type AuditLogSortBy = 'event_type' | 'event_id' | 'actor_id' | 'occurred_at';
export type AuditLogSortDirection = 'asc' | 'desc';

export interface AuditLogPage {
  data: AuditLog[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}
