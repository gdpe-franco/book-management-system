export type BookEventType = 'book.created' | 'book.updated' | 'book.deleted';

export interface AuditEvent {
  eventId: string;
  eventType: BookEventType;
  eventVersion: 1;
  occurredAt: Date;
  actorId: number;
  bookSnapshot: Record<string, unknown>;
  changes: Record<string, unknown>;
}

export function parseAuditEvent(input: unknown): AuditEvent {
  if (!isRecord(input)) {
    throw new Error('Audit event must be an object.');
  }

  const eventId = input.event_id;
  const eventType = input.event_type;
  const eventVersion = input.event_version;
  const occurredAt = input.occurred_at;
  const actor = input.actor;
  const book = input.book;
  const changes = input.changes;

  if (typeof eventId !== 'string' || !isUuid(eventId)) {
    throw new Error('Audit event ID must be a UUID.');
  }

  if (!isBookEventType(eventType)) {
    throw new Error('Audit event type is unsupported.');
  }

  if (eventVersion !== 1) {
    throw new Error('Audit event version is unsupported.');
  }

  if (typeof occurredAt !== 'string' || Number.isNaN(Date.parse(occurredAt))) {
    throw new Error('Audit event occurrence time is invalid.');
  }

  if (!isRecord(actor) || !isPositiveInteger(actor.id)) {
    throw new Error('Audit event actor ID is invalid.');
  }

  if (!isRecord(book) || !isRecord(changes)) {
    throw new Error('Audit event book and changes must be objects.');
  }

  return {
    eventId,
    eventType,
    eventVersion,
    occurredAt: new Date(occurredAt),
    actorId: actor.id,
    bookSnapshot: book,
    changes,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBookEventType(value: unknown): value is BookEventType {
  return value === 'book.created' || value === 'book.updated' || value === 'book.deleted';
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isUuid(value: string): boolean {
  return /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);
}
