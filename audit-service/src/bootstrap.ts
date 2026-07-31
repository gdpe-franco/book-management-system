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
  let server: Server | undefined;

  try {
    await initializeStorage();
    const currentServer = createServer();
    server = currentServer;
    await initializeConsumption();

    await new Promise<void>((resolve, reject) => {
      currentServer.once('error', reject);
      currentServer.listen(port, '0.0.0.0', resolve);
    });

    return currentServer;
  } catch {
    server?.close();

    throw new Error('Audit service initialization failed.');
  }
}
