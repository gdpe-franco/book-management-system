import { createClient, type RedisClientType } from 'redis';
import type { BookEventDelivery, BookEventStream } from '../../application/ports/book-event-stream.js';

const streamName = 'book-events';
const groupName = 'audit-service';

export async function connectBookEventStream(prefix = 'REDIS'): Promise<RedisBookEventStream> {
  const client = createClient({ socket: { host: read(prefix, 'HOST'), port: readPort(prefix) }, database: readDatabase(prefix) });

  await client.connect();

  return new RedisBookEventStream(client, consumerName());
}

export class RedisBookEventStream implements BookEventStream {
  constructor(
    private readonly client: RedisClientType,
    private readonly consumer: string,
  ) {}

  async ensureGroup(): Promise<void> {
    try {
      await this.client.xGroupCreate(streamName, groupName, '0-0', { MKSTREAM: true });
    } catch (error) {
      if (!isExistingGroupError(error)) {
        throw error;
      }
    }
  }

  async readNew(count = 10): Promise<BookEventDelivery[]> {
    const result = await this.client.xReadGroup(
      groupName,
      this.consumer,
      [{ key: streamName, id: '>' }],
      { COUNT: count },
    );

    return result?.flatMap((stream) => stream.messages.map((message: { id: string; message: Record<string, string> }) => ({
      id: message.id,
      fields: message.message,
    }))) ?? [];
  }
}

function consumerName(): string {
  return `${process.env.HOSTNAME ?? 'audit-service'}-${process.pid}`;
}

function read(prefix: string, name: string): string {
  const value = process.env[`${prefix}_${name}`];

  if (value === undefined || value === '') {
    throw new Error(`Missing ${prefix}_${name} configuration.`);
  }

  return value;
}

function readPort(prefix: string): number {
  const port = Number(read(prefix, 'PORT'));

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ${prefix}_PORT configuration.`);
  }

  return port;
}

function readDatabase(prefix: string): number {
  const database = Number(read(prefix, 'DB'));

  if (!Number.isInteger(database) || database < 0) {
    throw new Error(`Invalid ${prefix}_DB configuration.`);
  }

  return database;
}

function isExistingGroupError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('BUSYGROUP');
}
