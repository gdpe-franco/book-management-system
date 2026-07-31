import type { Server } from 'node:http';
import { createHealthServer } from './http/audit-server.js';

export type StorageInitializer = () => Promise<unknown>;
export type ConsumptionInitializer = () => Promise<unknown>;
export type ServerFactory = () => Server;

export async function startServer(
  port: number,
  initializeStorage: StorageInitializer,
  initializeConsumption: ConsumptionInitializer = async () => undefined,
  createServer: ServerFactory = createHealthServer,
): Promise<Server> {
  try {
    await initializeStorage();
    await initializeConsumption();
    const server = createServer();

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '0.0.0.0', resolve);
    });

    return server;
  } catch {
    throw new Error('Audit service initialization failed.');
  }
}
