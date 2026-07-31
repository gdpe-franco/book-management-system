import type { AuditLogPage, AuditLogQuery } from '../../domain/audit-log.js';
import type { AuditLogReader } from './ports/audit-log-reader.js';

const sortFields = ['event_type', 'event_id', 'actor_id', 'occurred_at'] as const;
const sortDirections = ['asc', 'desc'] as const;

export class InvalidAuditLogQuery extends Error {}

export class ListAuditLogs {
  constructor(private readonly auditLogReader: AuditLogReader) {}

  execute(query: AuditLogQuery = {}): Promise<AuditLogPage> {
    const { search: rawSearch, ...rest } = query;
    const search = rawSearch?.trim();
    const normalized = {
      ...rest,
      ...(search === undefined || search === '' ? {} : { search }),
      page: query.page ?? 1,
      perPage: query.perPage ?? 15,
    };

    validate(normalized);

    return this.auditLogReader.list(normalized);
  }
}

function validate(query: Required<Pick<AuditLogQuery, 'page' | 'perPage'>> & Omit<AuditLogQuery, 'page' | 'perPage'>): void {
  if (!Number.isSafeInteger(query.page) || query.page < 1) {
    throw new InvalidAuditLogQuery('Audit-log page is invalid.');
  }

  if (!Number.isSafeInteger(query.perPage) || query.perPage < 1 || query.perPage > 100) {
    throw new InvalidAuditLogQuery('Audit-log per-page value is invalid.');
  }

  if (query.search !== undefined && query.search.length > 255) {
    throw new InvalidAuditLogQuery('Audit-log search is invalid.');
  }

  if (query.sortBy !== undefined && !sortFields.includes(query.sortBy)) {
    throw new InvalidAuditLogQuery('Audit-log sort field is invalid.');
  }

  if (query.sortDirection !== undefined && !sortDirections.includes(query.sortDirection)) {
    throw new InvalidAuditLogQuery('Audit-log sort direction is invalid.');
  }
}
