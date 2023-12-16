const fs = require('node:fs');
const path = require('path');
const tmpPath = require('os').tmpdir();
const { cookieToJson } = require('./util');

/** @type {Record<string, any>} */
let obj = {};

fs.readdirSync(path.join(__dirname, 'module'))
  .reverse()
  .forEach((file) => {
    if (!file.endsWith('.js')) return;
    let fileModule = require(path.join(__dirname, 'module', file));
    let fn = file.split('.').shift() || '';
    obj[fn] = (data = {}) => {
      if (typeof data.cookie === 'string') data.cookie = cookieToJson(data.cookie);
    };

    return fileModule({ ...data, cookie: data.cookie ? data.cookie : {} }, (...args) => {
      const request = require('./util/request');
      return request(...args);
    });
  });

/**
 * @type {Record<string, any> & import("./server")}
 */

module.exports = { ...require('./server'), ...obj };
