#!/usr/bin/env node
const { applyProxyFromArgs, applyPlatformFromArgs } = require('./util/proxy');

async function start() {
  applyProxyFromArgs();
  applyPlatformFromArgs();
  require('./server').startService();
}

start();
