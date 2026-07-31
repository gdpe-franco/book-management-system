import assert from 'node:assert/strict';
import test from 'node:test';
import { ConsumeBookEvents } from '../../../../src/application/book-events/consume-book-events.js';
import { PersistAuditEvent } from '../../../../src/application/audit-logs/persist-audit-event.js';
import type { BookEventStream } from '../../../../src/application/book-events/ports/book-event-stream.js';
import type { AuditLogStore } from '../../../../src/application/audit-logs/ports/audit-log-store.js';
import type { AuditLogNotifier } from '../../../../src/application/audit-logs/ports/audit-log-notifier.js';
import type { AuditEvent } from '../../../../src/domain/audit-event.js';

test('persists a delivery before acknowledging it', async () => {
  const calls: string[] = [];
  const stream: BookEventStream = {
    async ensureGroup() {},
    async readNew() { return [{ id: '1-0', event: sampleEvent() }]; },
    async claimStale() { return []; },
    async acknowledge() { calls.push('acknowledge'); },
  };
  const store: AuditLogStore = {
    async persist(event) {
      calls.push('persist');
      return createdAuditLog(event);
    },
  };
  const notifier: AuditLogNotifier = { async notify() { calls.push('notify'); } };

  assert.equal(await new ConsumeBookEvents(stream, new PersistAuditEvent(store), notifier).execute(), 0);

  assert.deepEqual(calls, ['persist', 'notify', 'acknowledge']);
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
  const notifier: AuditLogNotifier = { async notify() {} };

  await assert.rejects(() => new ConsumeBookEvents(stream, new PersistAuditEvent(store), notifier).execute());

  assert.equal(acknowledged, false);
});

test('acknowledges a persisted delivery when notification fails', async () => {
  let acknowledged = false;
  const stream: BookEventStream = {
    async ensureGroup() {},
    async readNew() { return [{ id: '1-0', event: sampleEvent() }]; },
    async claimStale() { return []; },
    async acknowledge() { acknowledged = true; },
  };
  const store: AuditLogStore = { async persist(event) { return createdAuditLog(event); } };
  const notifier: AuditLogNotifier = { async notify() { throw new Error('Socket.IO unavailable'); } };

  await new ConsumeBookEvents(stream, new PersistAuditEvent(store), notifier).execute();

  assert.equal(acknowledged, true);
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

function createdAuditLog(event: AuditEvent) {
  return {
    status: 'created' as const,
    auditLog: {
      eventId: event.eventId,
      eventType: event.eventType,
      eventVersion: event.eventVersion,
      occurredAt: event.occurredAt,
      actorId: event.actorId,
      bookSnapshot: event.bookSnapshot,
      changes: event.changes,
      persistedAt: new Date('2026-07-27T12:00:01Z'),
    },
  };
}
