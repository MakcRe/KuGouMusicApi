#!/usr/bin/env node

async function start() {
  require('./util/proxy').applyProxyFromArgs();
  require('./server').startService();
}

start();
