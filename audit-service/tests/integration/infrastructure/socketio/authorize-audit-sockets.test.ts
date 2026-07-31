import assert from 'node:assert/strict';
import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { io, type Socket } from 'socket.io-client';
import { ValidateAuditAccess } from '../../../../src/application/authentication/validate-audit-access.js';
import type { TokenValidation, TokenValidator } from '../../../../src/application/authentication/ports/token-validator.js';
import { attachAuditSocketServer } from '../../../../src/infrastructure/socketio/audit-socket-server.js';
import { authorizeAuditSockets } from '../../../../src/infrastructure/socketio/authorize-audit-sockets.js';

test('accepts a Laravel-confirmed handshake unchanged', async () => {
  let authorization: string | undefined;
  const server = await start((value) => {
    authorization = value;

    return 'valid';
  });
  const client = connect(server.origin, 'Bearer unchanged-token');

  try {
    await once(client, 'connect');

    assert.equal(authorization, 'Bearer unchanged-token');
  } finally {
    await stop(server.httpServer, client);
  }
});

test('rejects missing, invalid, and unavailable handshakes', async () => {
  const server = await start((authorization) => authorization === 'Bearer unavailable' ? 'unavailable' : 'invalid');

  try {
    for (const authorization of [undefined, 'Bearer invalid', 'Bearer unavailable']) {
      const client = connect(server.origin, authorization);
      const [error] = await once<Error>(client, 'connect_error');

      assert.equal(error.message, 'Unauthorized');
      client.close();
    }
  } finally {
    await stop(server.httpServer);
  }
});

test('disconnects an accepted socket after its lifetime', async () => {
  const server = await start(() => 'valid', 20);
  const client = connect(server.origin, 'Bearer valid-token');

  try {
    await once(client, 'connect');
    const [reason] = await once<string>(client, 'disconnect');

    assert.equal(reason, 'io server disconnect');
  } finally {
    await stop(server.httpServer, client);
  }
});

async function start(result: (authorization: string | undefined) => TokenValidation, lifetimeMs = 60_000): Promise<{ httpServer: HttpServer; origin: string }> {
  const httpServer = createServer();
  const socketServer = attachAuditSocketServer(httpServer, 'http://localhost:5174');
  const validator: TokenValidator = { async validate(authorization) { return result(authorization); } };
  authorizeAuditSockets(socketServer, new ValidateAuditAccess(validator), lifetimeMs);
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address() as AddressInfo;

  return { httpServer, origin: `http://127.0.0.1:${port}` };
}

function connect(origin: string, authorization: string | undefined): Socket {
  return io(origin, {
    auth: authorization === undefined ? {} : { authorization },
    reconnection: false,
    transports: ['websocket'],
  });
}

function once<T>(socket: Socket, event: string): Promise<T[]> {
  return new Promise((resolve) => socket.once(event, (...values: T[]) => resolve(values)));
}

async function stop(httpServer: HttpServer, client?: Socket): Promise<void> {
  client?.close();
  await new Promise<void>((resolve, reject) => httpServer.close((error) => error === undefined ? resolve() : reject(error)));
}
