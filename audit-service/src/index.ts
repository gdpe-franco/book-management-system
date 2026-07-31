import { startServer } from './bootstrap.js';
import { ConsumeBookEvents } from './application/book-events/consume-book-events.js';
import { PersistAuditEvent } from './application/audit-logs/persist-audit-event.js';
import { ListAuditLogs } from './application/audit-logs/list-audit-logs.js';
import type { AuditLogNotifier } from './application/audit-logs/ports/audit-log-notifier.js';
import { ValidateAuditAccess } from './application/authentication/validate-audit-access.js';
import { createAuditServer } from './http/audit-server.js';
import { createMysqlPool, mysqlConfigFromEnvironment } from './infrastructure/mysql/connection.js';
import { initializeStorage } from './infrastructure/mysql/initialize-storage.js';
import { MysqlAuditLogReader } from './infrastructure/mysql/mysql-audit-log-reader.js';
import { MysqlAuditLogStore } from './infrastructure/mysql/mysql-audit-log-store.js';
import { LaravelTokenValidator } from './infrastructure/laravel/laravel-token-validator.js';
import { connectBookEventStream } from './infrastructure/redis/redis-book-event-stream.js';
import { attachAuditSocketServer } from './infrastructure/socketio/audit-socket-server.js';
import { authorizeAuditSockets } from './infrastructure/socketio/authorize-audit-sockets.js';
import { SocketIoAuditLogNotifier } from './infrastructure/socketio/socketio-audit-log-notifier.js';

const port = Number(process.env.PORT ?? 3000);
const staleEntryIdleMs = 60_000;
let auditLogNotifier: AuditLogNotifier | undefined;

void startServer(
  port,
  initializeStorage,
  async () => {
    const stream = await connectBookEventStream();

    await stream.ensureGroup();
    if (auditLogNotifier === undefined) {
      throw new Error('Audit notifications are unavailable.');
    }

    void consumeNewEvents(stream, auditLogNotifier);
  },
  () => {
    const validateAuditAccess = new ValidateAuditAccess(new LaravelTokenValidator(requiredEnvironment('LARAVEL_BASE_URL')));
    const server = createAuditServer(
      validateAuditAccess,
      new ListAuditLogs(new MysqlAuditLogReader(createMysqlPool(mysqlConfigFromEnvironment()))),
    );
    const socketServer = attachAuditSocketServer(server, process.env.FRONTEND_ORIGIN ?? 'http://localhost:5174');

    authorizeAuditSockets(socketServer, validateAuditAccess);
    auditLogNotifier = new SocketIoAuditLogNotifier(socketServer);

    return server;
  },
).catch(() => {
  console.error('Audit service startup failed.');
  process.exitCode = 1;
});

function requiredEnvironment(name: string): string {
  const value = process.env[name];

  if (value === undefined || value === '') {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function consumeNewEvents(
  stream: Awaited<ReturnType<typeof connectBookEventStream>>,
  notifier: AuditLogNotifier,
): Promise<void> {
  const consumer = new ConsumeBookEvents(
    stream,
    new PersistAuditEvent(new MysqlAuditLogStore(createMysqlPool(mysqlConfigFromEnvironment()))),
    notifier,
  );

  while (process.exitCode === undefined) {
    try {
      const duplicates = await consumer.reclaimStale(staleEntryIdleMs) + await consumer.execute();

      if (duplicates > 0) {
        console.info(`Acknowledged ${duplicates} duplicate Audit event ${duplicates === 1 ? 'delivery' : 'deliveries'}.`);
      }
    } catch {
      console.error('Audit event consumption failed.');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
