import { parseAuditEvent } from '../domain/audit-event.js';
import type { AuditLogStore, PersistResult } from './ports/audit-log-store.js';

export class PersistAuditEvent {
  constructor(private readonly auditLogStore: AuditLogStore) {}

  execute(input: unknown): Promise<PersistResult> {
    return this.auditLogStore.persist(parseAuditEvent(input));
  }
}
