import type { PersistAuditEvent } from '../audit-logs/persist-audit-event.js';
import type { AuditLogNotifier } from '../audit-logs/ports/audit-log-notifier.js';
import type { BookEventStream } from './ports/book-event-stream.js';

export class ConsumeBookEvents {
  constructor(
    private readonly stream: BookEventStream,
    private readonly persistAuditEvent: PersistAuditEvent,
    private readonly auditLogNotifier: AuditLogNotifier,
  ) {}

  async execute(): Promise<number> {
    return this.process(await this.stream.readNew(10, 5000));
  }

  async reclaimStale(minIdleMs: number): Promise<number> {
    return this.process(await this.stream.claimStale(minIdleMs, 10));
  }

  private async process(deliveries: Awaited<ReturnType<BookEventStream['readNew']>>): Promise<number> {
    let duplicates = 0;

    for (const delivery of deliveries) {
      const result = await this.persistAuditEvent.execute(delivery.event);

      if (result.status === 'already_exists') {
        duplicates += 1;
      } else {
        try {
          await this.auditLogNotifier.notify(result.auditLog);
        } catch {
          // Notifications are best-effort; the persisted event must still be acknowledged.
        }
      }

      await this.stream.acknowledge(delivery.id);
    }

    return duplicates;
  }
}
