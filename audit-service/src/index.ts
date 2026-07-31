import { startServer } from './bootstrap.js';
import { ConsumeBookEvents } from './application/book-events/consume-book-events.js';
import { PersistAuditEvent } from './application/audit-logs/persist-audit-event.js';
import { createMysqlPool, mysqlConfigFromEnvironment } from './infrastructure/mysql/connection.js';
import { initializeStorage } from './infrastructure/mysql/initialize-storage.js';
import { MysqlAuditLogStore } from './infrastructure/mysql/mysql-audit-log-store.js';
import { connectBookEventStream } from './infrastructure/redis/redis-book-event-stream.js';

const port = Number(process.env.PORT ?? 3000);
const staleEntryIdleMs = 60_000;

void startServer(port, initializeStorage, async () => {
  const stream = await connectBookEventStream();

  await stream.ensureGroup();
  void consumeNewEvents(stream);
}).catch(() => {
  console.error('Audit service startup failed.');
  process.exitCode = 1;
});

async function consumeNewEvents(stream: Awaited<ReturnType<typeof connectBookEventStream>>): Promise<void> {
  const consumer = new ConsumeBookEvents(
    stream,
    new PersistAuditEvent(new MysqlAuditLogStore(createMysqlPool(mysqlConfigFromEnvironment()))),
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
