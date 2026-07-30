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
  const id = await client.xAdd('book-events', '*', { event_id: 'event-1', event_type: 'book.created' });

  await consumer.ensureGroup();
  await consumer.ensureGroup();

  assert.deepEqual(await consumer.readNew(), [
    {
      id,
      fields: { event_id: 'event-1', event_type: 'book.created' },
    },
  ]);
});
