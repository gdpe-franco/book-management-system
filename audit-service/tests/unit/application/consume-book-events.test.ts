import assert from 'node:assert/strict';
import test from 'node:test';
import { ConsumeBookEvents } from '../../../src/application/consume-book-events.js';
import { PersistAuditEvent } from '../../../src/application/persist-audit-event.js';
import type { BookEventStream } from '../../../src/application/ports/book-event-stream.js';
import type { AuditLogStore } from '../../../src/application/ports/audit-log-store.js';

test('persists a delivery before acknowledging it', async () => {
  const calls: string[] = [];
  const stream: BookEventStream = {
    async ensureGroup() {},
    async readNew() { return [{ id: '1-0', event: sampleEvent() }]; },
    async claimStale() { return []; },
    async acknowledge() { calls.push('acknowledge'); },
  };
  const store: AuditLogStore = {
    async persist() {
      calls.push('persist');
      return 'created';
    },
  };

  assert.equal(await new ConsumeBookEvents(stream, new PersistAuditEvent(store)).execute(), 0);

  assert.deepEqual(calls, ['persist', 'acknowledge']);
});

test('does not acknowledge a delivery when persistence fails', async () => {
  let acknowledged = false;
  const stream: BookEventStream = {
    async ensureGroup() {},
    async readNew() { return [{ id: '1-0', event: sampleEvent() }]; },
    async claimStale() { return []; },
    async acknowledge() { acknowledged = true; },
  };
  const store: AuditLogStore = { async persist() { throw new Error('database unavailable'); } };

  await assert.rejects(() => new ConsumeBookEvents(stream, new PersistAuditEvent(store)).execute());

  assert.equal(acknowledged, false);
});

function sampleEvent(): Record<string, unknown> {
  return {
    event_id: '0f4e5655-2e70-4381-b0b6-c6903b0e1bb2',
    event_type: 'book.created',
    event_version: 1,
    occurred_at: '2026-07-27T12:00:00Z',
    actor: { id: 1 },
    book: { id: 42 },
    changes: {},
  };
}
