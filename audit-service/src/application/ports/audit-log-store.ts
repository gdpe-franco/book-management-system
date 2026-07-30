import type { AuditEvent } from '../../domain/audit-event.js';

export type PersistResult = 'created' | 'already_exists';

export interface AuditLogStore {
  persist(event: AuditEvent): Promise<PersistResult>;
}
