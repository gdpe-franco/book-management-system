import assert from 'node:assert/strict';
import test from 'node:test';
import { PersistAuditEvent } from '../../../../src/application/audit-logs/persist-audit-event.js';
import type { AuditLogStore } from '../../../../src/application/audit-logs/ports/audit-log-store.js';
import type { AuditEvent } from '../../../../src/domain/audit-event.js';

test('validates and sends a v1 event to the persistence port', async () => {
  const events: AuditEvent[] = [];
  const auditLogStore: AuditLogStore = {
    async persist(event) {
      events.push(event);

      return createdAuditLog(event);
    },
  };
  const useCase = new PersistAuditEvent(auditLogStore);

  await assert.doesNotReject(() => useCase.execute(sampleEvent()));
  assert.equal(events.length, 1);
  assert.equal(events[0]?.eventType, 'book.created');
  assert.equal(events[0]?.occurredAt.toISOString(), '2026-07-27T12:00:00.000Z');
});

test('rejects an event outside the v1 contract before persistence', () => {
  const auditLogStore: AuditLogStore = { async persist(event) { return createdAuditLog(event); } };
  const useCase = new PersistAuditEvent(auditLogStore);

  assert.throws(
    () => useCase.execute({ ...sampleEvent(), event_version: 2 }),
    /version is unsupported/,
  );
});

function sampleEvent(): Record<string, unknown> {
  return {
    event_id: '0f4e5655-2e70-4381-b0b6-c6903b0e1bb2',
    event_type: 'book.created',
    event_version: 1,
    occurred_at: '2026-07-27T12:00:00Z',
    actor: { id: 1 },
    book: { id: 42, title: 'Example title', author: 'Example author', isbn: '9780000000000', published_year: 2026 },
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
