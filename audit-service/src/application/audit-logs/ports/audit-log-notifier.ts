import type { AuditLog } from '../../../domain/audit-log.js';

export interface AuditLogNotifier {
  notify(auditLog: AuditLog): Promise<void>;
}
