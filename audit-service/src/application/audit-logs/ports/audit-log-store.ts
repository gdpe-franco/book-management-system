import type { AuditEvent } from '../../../domain/audit-event.js';
import type { AuditLog } from '../../../domain/audit-log.js';

export type PersistResult =
  | { status: 'created'; auditLog: AuditLog }
  | { status: 'already_exists' };

export interface AuditLogStore {
  persist(event: AuditEvent): Promise<PersistResult>;
}
