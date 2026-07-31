import type { PersistAuditEvent } from './persist-audit-event.js';
import type { BookEventStream } from './ports/book-event-stream.js';

export class ConsumeBookEvents {
  constructor(
    private readonly stream: BookEventStream,
    private readonly persistAuditEvent: PersistAuditEvent,
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
      if (await this.persistAuditEvent.execute(delivery.event) === 'already_exists') {
        duplicates += 1;
      }

      await this.stream.acknowledge(delivery.id);
    }

    return duplicates;
  }
}
