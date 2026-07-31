import type { ValidateAuditAccess } from '../../application/authentication/validate-audit-access.js';
import type { Server as SocketServer } from 'socket.io';

export const auditSocketLifetimeMs = 15 * 60 * 1000;

export function authorizeAuditSockets(
  socketServer: SocketServer,
  validateAuditAccess: ValidateAuditAccess,
  lifetimeMs = auditSocketLifetimeMs,
): void {
  socketServer.use(async (socket, next) => {
    const authorization = typeof socket.handshake.auth.authorization === 'string' ? socket.handshake.auth.authorization : undefined;

    try {
      if (await validateAuditAccess.execute(authorization) !== 'valid') {
        next(new Error('Unauthorized'));

        return;
      }
    } catch {
      next(new Error('Unauthorized'));

      return;
    }

    const lifetime = setTimeout(() => socket.disconnect(true), lifetimeMs);
    socket.once('disconnect', () => clearTimeout(lifetime));
    next();
  });
}
