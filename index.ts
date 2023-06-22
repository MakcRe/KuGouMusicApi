import { startService } from './server';

async function  start () {
  await startService();
}

start().then(() => {});