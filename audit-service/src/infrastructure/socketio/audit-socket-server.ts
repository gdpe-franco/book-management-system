import type { Server as HttpServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';

export function attachAuditSocketServer(httpServer: HttpServer, frontendOrigin: string): SocketServer {
  const socketServer = new SocketServer(httpServer, {
    cors: { origin: frontendOrigin },
  });

  httpServer.once('close', () => socketServer.close());

  return socketServer;
}
