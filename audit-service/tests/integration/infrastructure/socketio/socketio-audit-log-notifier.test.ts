import assert from 'node:assert/strict';
import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { io, type Socket } from 'socket.io-client';
import { attachAuditSocketServer } from '../../../../src/infrastructure/socketio/audit-socket-server.js';
import { SocketIoAuditLogNotifier } from '../../../../src/infrastructure/socketio/socketio-audit-log-notifier.js';

test('broadcasts the persisted Audit-log payload to connected clients', async () => {
  const httpServer = createServer();
  const socketServer = attachAuditSocketServer(httpServer, 'http://localhost:5174');
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address() as AddressInfo;
  const client = io(`http://127.0.0.1:${port}`, { transports: ['websocket'], reconnection: false });

  try {
    await once(client, 'connect');
    const payload = once<Record<string, unknown>>(client, 'audit.log.created');

    await new SocketIoAuditLogNotifier(socketServer).notify({
      eventId: '00000000-0000-4000-8000-000000000001',
      eventType: 'book.updated',
      eventVersion: 1,
      occurredAt: new Date('2026-07-28T10:00:00Z'),
      actorId: 1,
      bookSnapshot: { id: 42 },
      changes: { title: { before: 'Before', after: 'After' } },
      persistedAt: new Date('2026-07-28T10:00:01Z'),
    });

    assert.deepEqual(await payload, {
      event_id: '00000000-0000-4000-8000-000000000001',
      event_type: 'book.updated',
      event_version: 1,
      occurred_at: '2026-07-28T10:00:00Z',
      actor_id: 1,
      book_snapshot: { id: 42 },
      changes: { title: { before: 'Before', after: 'After' } },
      persisted_at: '2026-07-28T10:00:01Z',
    });
  } finally {
    client.close();
    await close(httpServer);
  }
});

function once<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, (value: T) => resolve(value)));
}

async function close(httpServer: HttpServer): Promise<void> {
  await new Promise<void>((resolve, reject) => httpServer.close((error) => error === undefined ? resolve() : reject(error)));
}
