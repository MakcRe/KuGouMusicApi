#!/usr/bin/env node
// import { startService } from './server';
// async function  start () {
//   await startService();
// }
//
// start().then(() => {}).catch(e => console.log(e));

async function start() {
  require('./server').startService();
}

start();