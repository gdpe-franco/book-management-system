import type { AuditLogPage, AuditLogQuery } from '../../domain/audit-log.js';
import type { AuditLogReader } from './ports/audit-log-reader.js';

const eventTypes = ['book.created', 'book.updated', 'book.deleted'] as const;

export class ListAuditLogs {
  constructor(private readonly auditLogReader: AuditLogReader) {}

  execute(query: AuditLogQuery = {}): Promise<AuditLogPage> {
    const normalized = {
      ...query,
      page: query.page ?? 1,
      perPage: query.perPage ?? 15,
    };

    validate(normalized);

    return this.auditLogReader.list(normalized);
  }
}

function validate(query: Required<Pick<AuditLogQuery, 'page' | 'perPage'>> & Omit<AuditLogQuery, 'page' | 'perPage'>): void {
  if (!Number.isSafeInteger(query.page) || query.page < 1) {
    throw new Error('Audit-log page is invalid.');
  }

  if (!Number.isSafeInteger(query.perPage) || query.perPage < 1 || query.perPage > 100) {
    throw new Error('Audit-log per-page value is invalid.');
  }

  if (query.eventType !== undefined && !eventTypes.includes(query.eventType)) {
    throw new Error('Audit-log event type is invalid.');
  }

  if ((query.occurredFrom !== undefined && Number.isNaN(query.occurredFrom.getTime()))
    || (query.occurredTo !== undefined && Number.isNaN(query.occurredTo.getTime()))) {
    throw new Error('Audit-log occurrence time is invalid.');
  }

  if (query.occurredFrom !== undefined && query.occurredTo !== undefined && query.occurredFrom > query.occurredTo) {
    throw new Error('Audit-log occurrence range is invalid.');
  }
}
