import { startServer } from './bootstrap.js';
import { initializeStorage } from './infrastructure/mysql/initialize-storage.js';

const port = Number(process.env.PORT ?? 3000);

void startServer(port, initializeStorage).catch(() => {
  console.error('Audit service startup failed.');
  process.exitCode = 1;
});
