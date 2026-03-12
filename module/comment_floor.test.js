const test = require('node:test');
const assert = require('node:assert/strict');

const commentFloor = require('./comment_floor');

test('song floor comments keep using the song endpoint and mixsongid', () => {
  const config = commentFloor.resolveFloorCommentRequestConfig({
    special_id: '100285259',
    mixsongid: '302362878',
    tid: '678433417',
  });

  assert.equal(config.url, '/mcomment/v1/hot_replylist');
  assert.equal(config.params.childrenid, '100285259');
  assert.equal(config.params.mixsongid, '302362878');
  assert.equal(config.params.code, 'fc4be23b4e972707f36b8a828a93ba8a');
});

test('playlist floor comments switch to service endpoint and playlist code', () => {
  const config = commentFloor.resolveFloorCommentRequestConfig({
    special_id: 'collection_3_1373407643_366_0',
    tid: '9380261',
    resource_type: 'playlist',
  });

  assert.equal(config.url, '/m.comment.service/v1/hot_replylist');
  assert.equal(config.params.childrenid, 'collection_3_1373407643_366_0');
  assert.equal(config.params.tid, '9380261');
  assert.equal(config.params.code, 'ca53b96fe5a1d9c22d71c8f522ef7c4f');
  assert.ok(!('mixsongid' in config.params));
});

test('album floor comments can be resolved from album comment code alone', () => {
  const config = commentFloor.resolveFloorCommentRequestConfig({
    special_id: '179005522',
    tid: '13712359',
    code: '94f1792ced1df89aa68a7939eaf2efca',
  });

  assert.equal(config.url, '/m.comment.service/v1/hot_replylist');
  assert.equal(config.params.childrenid, '179005522');
  assert.equal(config.params.tid, '13712359');
  assert.equal(config.params.code, '94f1792ced1df89aa68a7939eaf2efca');
});