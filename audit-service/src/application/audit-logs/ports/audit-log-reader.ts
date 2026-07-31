import type { AuditLogPage, AuditLogQuery } from '../../../domain/audit-log.js';

export interface AuditLogReader {
  list(query: Required<Pick<AuditLogQuery, 'page' | 'perPage'>> & Omit<AuditLogQuery, 'page' | 'perPage'>): Promise<AuditLogPage>;
}
