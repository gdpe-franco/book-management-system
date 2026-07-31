import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import { startServer } from '../../src/bootstrap.js';
import { createHealthServer } from '../../src/http/audit-server.js';

test('starts the health server after storage initialization', async () => {
  let initialized = false;
  let consumptionInitialized = false;
  const server = await startServer(0, async () => {
    initialized = true;
  }, async () => {
    consumptionInitialized = true;
  });
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);

    assert.equal(initialized, true);
    assert.equal(consumptionInitialized, true);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error === undefined ? resolve() : reject(error)));
  }
});

test('does not start the server when storage initialization fails', async () => {
  await assert.rejects(
    () => startServer(0, async () => { throw new Error('password must stay private'); }),
    { message: 'Audit service initialization failed.' },
  );
});

test('creates delivery before consumption starts', async () => {
  const calls: string[] = [];
  const server = await startServer(
    0,
    async () => { calls.push('storage'); },
    async () => { calls.push('consumption'); },
    () => {
      calls.push('delivery');

      return createHealthServer();
    },
  );

  try {
    assert.deepEqual(calls, ['storage', 'delivery', 'consumption']);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error === undefined ? resolve() : reject(error)));
  }
});
