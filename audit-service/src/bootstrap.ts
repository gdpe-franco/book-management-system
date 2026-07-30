import type { Server } from 'node:http';
import { createHealthServer } from './http/health-server.js';

export type StorageInitializer = () => Promise<unknown>;

export async function startServer(port: number, initializeStorage: StorageInitializer): Promise<Server> {
  try {
    await initializeStorage();
  } catch {
    throw new Error('Audit storage initialization failed.');
  }

  const server = createHealthServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '0.0.0.0', resolve);
  });

  return server;
}
