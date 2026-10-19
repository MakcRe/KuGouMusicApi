const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');

const source = fs.readFileSync(path.join(__dirname, '../module/user_listen_report.js'), 'utf8');
const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 1024 });
const md5 = (value) => crypto.createHash('md5').update(value).digest('hex');

// All requests are injected mocks. Decode the actual encrypted event rather
// than testing a duplicate field builder or sending real listening records.
function fixture(post = { status: 1, errcode: 0 }) {
  const module = { exports: {} };
  const calls = [];
  const events = [];
  const grades = [];
  const uuid = '0123456789abcdef'.repeat(2);
  let field2;
  vm.runInNewContext(source, {
    module, Buffer, process: { env: {} }, Date,
    require: (name) => {
      if (name === '../util') return { publicLiteRasKey: keys.publicKey.export({ type: 'pkcs1', format: 'pem' }) };
      if (name === './user_grade_info') return async (params) => {
        grades.push(params);
        return { status: 200, body: { status: 1, error_code: 0 }, cookie: [], headers: {} };
      };
      return require(name);
    },
  });
  const input = {
    event: 'start', mixsongid: 123,
    cookie: { userid: 101, token: 'synthetic-token', KUGOU_API_MID: 'fixture-mid', KUGOU_API_GUID: uuid },
  };
  const useAxios = async (request) => {
    calls.push(request);
    assert.equal(request.baseURL, 'http://d.kugou.com');
    if (request.url === '/v3/qrydid') return { status: 200, body: { status: 1, data: { deviceid: 'fixture-device' } } };
    if (request.url === '/v2/gen') {
      const padded = crypto.privateDecrypt({ key: keys.privateKey, padding: crypto.constants.RSA_NO_PADDING },
        Buffer.from(request.params.s, 'base64'));
      field2 = padded.subarray(padded.indexOf(0, 2) + 1).toString().split('\t')[1];
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(field2), Buffer.from(uuid.slice(0, 16)));
      const plain = Buffer.from(JSON.stringify({ cookie: 'fixture-session', clienttime: 123, serverstr: 'fixture' }));
      const data = Buffer.concat([cipher.update(plain), cipher.final()]).toString('base64');
      return { status: 200, body: { status: 1, data } };
    }
    assert.equal(request.url, '/v2/post');
    assert.deepEqual(Object.keys(request.params).sort(), ['_t', 'appid', 'cookie', 'length', 'sign']);
    const query = request.params;
    const signed = Object.keys(query).filter((key) => key !== 'sign').sort().map((key) => key + query[key]).join('');
    assert.equal(query.sign, md5(Buffer.concat([Buffer.from(signed + 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA'), request.data])));
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(md5(uuid + 123 + field2 + 'fixture')), Buffer.from(uuid.slice(0, 16)));
    const plain = zlib.inflateSync(Buffer.concat([decipher.update(request.data), decipher.final()]));
    assert.equal(String(plain.length), query.length);
    const line = plain.indexOf('\r\n') + 2;
    const begin = plain.indexOf('\r\n', line) + 2;
    const payload = zlib.inflateSync(plain.subarray(begin));
    assert.equal(Number(plain.subarray(line, begin - 2).toString().split('\t')[0]), payload.length);
    events.push(Object.fromEntries(payload.toString().split('&').map((value) => {
      const index = value.indexOf('=');
      return [value.slice(0, index), value.slice(index + 1)];
    })));
    if (post instanceof Error) throw post;
    return { status: 200, body: post };
  };
  return { calls, events, grades, run: (changes = {}) => module.exports({ ...input, ...changes }, useAxios) };
}

test('optional context is omitted instead of inventing a page, mode or experiment group', async () => {
  const f = fixture();
  const result = await f.run();
  assert.equal(result.body.status, 1);
  assert.equal(result.body.data, undefined);
  assert.equal(f.events.length, 1);
  assert.equal(f.events[0].type_id, '20431');
  assert.equal(f.events[0].mixsongid, '123');
  for (const key of ['source', 'fo', 'fo3', 'spt', 'sty', 'fs', 'state', 'gitversion', 'ss1', 'ss2', 'svar2', 'svar3', 'ivar1', 'ivar3']) {
    assert.equal(f.events[0][key], undefined, key);
  }
  assert.equal(f.grades.length, 0);
});

test('JSON context is encoded in the submitted start and end, using one transport session', async () => {
  const f = fixture();
  await f.run({ song_duration: 60000, automatic: false, source: 46, fo: '/真实页面' });
  await f.run({ event: 'end', song_duration: 60000, automatic: true, source: '46', fo: '/真实页面',
    duration: 5240, state: '被终止', rate: 2 });
  assert.equal(f.calls.length, 4);
  const [start, end] = f.events;
  assert.equal(start.spt, '60000');
  assert.equal(start.sty, '手动');
  assert.equal(start.source, '46');
  assert.equal(start.fo, undefined);
  assert.equal(end.type_id, '4');
  assert.equal(end.spt, '60000');
  assert.equal(end.sty, '自动');
  assert.equal(end.fo, '/真实页面');
  assert.equal(end.duration, '5240');
  assert.equal(end.state, '被终止');
  assert.equal(end.fs, '2.0');
  assert.equal(f.grades.length, 0);
});

test('HTTP string parameters and empty attribution are supported without rounding the rate', async () => {
  const f = fixture();
  await f.run({ event: 'end', song_duration: '60000', automatic: 'false', rate: '1.25',
    duration: '100', state: '播放错误', source: '', fo: '' });
  const [event] = f.events;
  assert.equal(event.spt, '60000');
  assert.equal(event.sty, '手动');
  assert.equal(event.fs, '1.25');
  assert.equal(event.source, undefined);
  assert.equal(event.fo, undefined);
  await f.run({ automatic: 'true', source: 0 });
  assert.equal(f.events[1].sty, '自动');
  assert.equal(f.events[1].source, '0');
});

test('API does not impose player limits, infer completion, pair events or deduplicate calls', async () => {
  const f = fixture();
  const end = { event: 'end', duration: 100000000, song_duration: 200000000, rate: 32, state: '调用者提供的状态' };
  await f.run(end); // No preceding start in this process is required.
  await f.run(end); // A second API call is a second event, not a player instance.
  assert.equal(f.events.length, 2);
  assert.equal(f.events[0].duration, '100000000');
  assert.equal(f.events[0].fs, '32.0');
  assert.equal(f.events[0].state, end.state);
});

test('malformed parameters fail before device, session or event I/O', async () => {
  for (const change of [
    { event: 'end', duration: 100 }, { event: 'end', duration: 100, state: '' },
    { event: 'end', duration: 100, state: '完整播放&fake=1' }, { event: 'end', duration: 100, state: '播放\u0000错误' },
    { source: '46&fake=yes' }, { source: {} }, { source: -1 }, { fo: '/album\n' }, { fo: [] },
    { automatic: '0' }, { automatic: 1 }, { rate: 0 }, { rate: -1 }, { rate: Infinity },
    { rate: 'NaN' }, { rate: '' }, { rate: [] }, { song_duration: 0 }, { song_duration: '1.5' },
    { song_duration: [] }, { cookie: {} }, { event: 'unknown' },
  ]) {
    const f = fixture();
    await assert.rejects(f.run(change), (error) => error.status === 400);
    assert.equal(f.calls.length, 0);
    assert.equal(f.grades.length, 0);
  }
});

test('only status=1 without an error confirms CSCC; a data array is not required', async () => {
  for (const body of [{}, { status: 0 }, { status: '1' }, { status: 1, errcode: 1201 },
    { status: 1, error_code: 1202 }, { data: ['anything'] }, new Error('synthetic timeout')]) {
    const f = fixture(body);
    await assert.rejects(f.run());
    assert.equal(f.events.length, 1); // No automatic retry after an ambiguous result.
    assert.equal(f.grades.length, 0);
  }
});

test('existing grade synchronization remains explicit and independent of playback acceptance', async () => {
  const f = fixture({ status: 0, errcode: 1201 });
  const result = await f.run({ event: 'end', duration: 5000, state: '被终止', d_sec: 100, diff_sec: 5 });
  assert.equal(f.events.length, 1);
  assert.equal(f.grades.length, 1);
  assert.equal(result.body.data.playback_accepted, false);
  assert.equal(result.body.data.grade_synced, true);
});
