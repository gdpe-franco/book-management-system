import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from 'redis';
import { RedisBookEventStream } from '../../../../src/infrastructure/redis/redis-book-event-stream.js';
import { assertRedisTestEnvironment } from '../../test-environment.js';

assertRedisTestEnvironment();

const client = createClient({
  socket: { host: process.env.REDIS_TEST_HOST, port: Number(process.env.REDIS_TEST_PORT) },
  database: Number(process.env.REDIS_TEST_DB),
});
const consumer = new RedisBookEventStream(client, 'audit-test-consumer');

test.before(async () => {
  await client.connect();
});

test.after(async () => {
  await client.del('book-events');
  await client.close();
});

test('creates the Audit consumer group at the first retained event and reads deliveries', async () => {
  const id = await client.xAdd('book-events', '*', sampleFields());

  await consumer.ensureGroup();
  await consumer.ensureGroup();

  assert.deepEqual(await consumer.readNew(), [
    {
      id,
      event: {
        event_id: '0f4e5655-2e70-4381-b0b6-c6903b0e1bb2',
        event_type: 'book.created',
        event_version: 1,
        occurred_at: '2026-07-27T12:00:00Z',
        actor: { id: 1 },
        book: { id: 42 },
        changes: {},
      },
    },
  ]);
});

function sampleFields(): Record<string, string> {
  return {
    event_id: '0f4e5655-2e70-4381-b0b6-c6903b0e1bb2',
    event_type: 'book.created',
    event_version: '1',
    occurred_at: '2026-07-27T12:00:00Z',
    actor: JSON.stringify({ id: 1 }),
    book: JSON.stringify({ id: 42 }),
    changes: JSON.stringify({}),
  };
}
