import assert from 'node:assert/strict';
import test from 'node:test';
import type { RowDataPacket } from 'mysql2/promise';
import { createClient } from 'redis';
import { ConsumeBookEvents } from '../../../src/application/consume-book-events.js';
import { PersistAuditEvent } from '../../../src/application/persist-audit-event.js';
import { createMysqlPool, mysqlConfigFromEnvironment } from '../../../src/infrastructure/mysql/connection.js';
import { applyMigrations } from '../../../src/infrastructure/mysql/migrations.js';
import { MysqlAuditLogStore } from '../../../src/infrastructure/mysql/mysql-audit-log-store.js';
import { RedisBookEventStream } from '../../../src/infrastructure/redis/redis-book-event-stream.js';
import { assertMysqlTestEnvironment, assertRedisTestEnvironment } from '../test-environment.js';

assertMysqlTestEnvironment();
assertRedisTestEnvironment();

const mysql = createMysqlPool(mysqlConfigFromEnvironment('MYSQL_TEST'));
const redis = createClient({
  socket: { host: process.env.REDIS_TEST_HOST, port: Number(process.env.REDIS_TEST_PORT) },
  database: Number(process.env.REDIS_TEST_DB),
});
const stream = new RedisBookEventStream(redis, 'audit-consumption-test');
const consumer = new ConsumeBookEvents(stream, new PersistAuditEvent(new MysqlAuditLogStore(mysql)));

test.before(async () => {
  await redis.connect();
});

test.beforeEach(async () => {
  await redis.del('book-events');
  await mysql.execute('DROP TABLE IF EXISTS audit_logs');
  await mysql.execute('DROP TABLE IF EXISTS audit_schema_migrations');
  await applyMigrations(mysql);
  await stream.ensureGroup();
});

test.after(async () => {
  await redis.del('book-events');
  await redis.close();
  await mysql.end();
});

test('persists and acknowledges new and duplicate event deliveries', async () => {
  await redis.xAdd('book-events', '*', sampleFields());

  await consumer.execute();

  await redis.xAdd('book-events', '*', sampleFields());
  await consumer.execute();

  const [rows] = await mysql.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM audit_logs');

  assert.equal(rows[0]?.total, 1);
  assert.deepEqual(await redis.xPendingRange('book-events', 'audit-service', '-', '+', 10), []);
});

test('leaves an invalid delivery pending', async () => {
  await redis.xAdd('book-events', '*', { ...sampleFields(), actor: '{' });

  await assert.rejects(() => consumer.execute());

  assert.equal((await redis.xPendingRange('book-events', 'audit-service', '-', '+', 10)).length, 1);
});

function sampleFields(): Record<string, string> {
  return {
    event_id: '0f4e5655-2e70-4381-b0b6-c6903b0e1bb2',
    event_type: 'book.created',
    event_version: '1',
    occurred_at: '2026-07-27T12:00:00Z',
    actor: JSON.stringify({ id: 1 }),
    book: JSON.stringify({ id: 42, title: 'Example title' }),
    changes: JSON.stringify({}),
  };
}
