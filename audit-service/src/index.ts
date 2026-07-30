import { startServer } from './bootstrap.js';
import { initializeStorage } from './infrastructure/mysql/initialize-storage.js';
import { connectBookEventStream } from './infrastructure/redis/redis-book-event-stream.js';

const port = Number(process.env.PORT ?? 3000);

void startServer(port, initializeStorage, async () => {
  const stream = await connectBookEventStream();

  await stream.ensureGroup();
}).catch(() => {
  console.error('Audit service startup failed.');
  process.exitCode = 1;
});
