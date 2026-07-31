import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { attachAuditSocketServer } from '../../../../src/infrastructure/socketio/audit-socket-server.js';

test('attaches Socket.IO to the Audit HTTP server and closes with it', async () => {
  const httpServer = createServer();
  const socketServer = attachAuditSocketServer(httpServer, 'http://localhost:5174');
  let socketClosed = false;
  const close = socketServer.close.bind(socketServer);
  socketServer.close = async () => {
    socketClosed = true;

    await close();
  };

  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address() as AddressInfo;

  try {
    assert.equal(socketServer.httpServer, httpServer);
    assert.equal(port > 0, true);
  } finally {
    await new Promise<void>((resolve, reject) => httpServer.close((error) => error === undefined ? resolve() : reject(error)));
  }

  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(socketClosed, true);
});
