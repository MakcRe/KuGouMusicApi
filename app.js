#!/usr/bin/env node
// import { startService } from './server';
async function start() {
  // await startService();
  require('./server').startService();
}

start();
