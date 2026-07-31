import type { AuditLogNotifier } from '../../application/audit-logs/ports/audit-log-notifier.js';
import { auditLogPayload } from '../../application/audit-logs/audit-log-payload.js';
import type { AuditLog } from '../../domain/audit-log.js';
import type { Server as SocketServer } from 'socket.io';

export class SocketIoAuditLogNotifier implements AuditLogNotifier {
  constructor(private readonly socketServer: SocketServer) {}

  async notify(auditLog: AuditLog): Promise<void> {
    this.socketServer.emit('audit.log.created', auditLogPayload(auditLog));
  }
}
