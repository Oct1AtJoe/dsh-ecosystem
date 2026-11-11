import assert from 'node:assert/strict';
import { parseLlmOutput, resolveModelChain, isEffortRejection, buildTitleInput } from './lib/index.js';

assert.deepEqual(parseLlmOutput('功能|快速排序算法'), { type: '功能', topic: '快速排序算法' });
assert.deepEqual(parseLlmOutput('输出：修复：登录500报错'), { type: '修复', topic: '登录500报错' });
assert.deepEqual(parseLlmOutput('【优化】批次文字显示'), { type: '优化', topic: '批次文字显示' });
assert.throws(() => parseLlmOutput('随便一段话'));

const chain = resolveModelChain({ models: [{ id: '1', provider: 'a', model: 'b', reasoningEffort: 'off' }, { id: '2', provider: 'c', model: 'd' }] });
assert.equal(chain.length, 2);
assert.equal(chain[0].provider, 'a');
const legacy = resolveModelChain({ provider: 'deepseek-account', model: 'deepseek-flash', reasoningEffort: 'off' });
assert.equal(legacy[0].provider, 'deepseek-account');
assert.equal(legacy[0].model, 'deepseek-flash');
const fallback = resolveModelChain({});
assert.equal(fallback[0].provider, 'deepseek-official');

assert.equal(isEffortRejection('reasoning effort not supported'), true);
assert.equal(isEffortRejection('insufficient balance'), false);

// buildTitleInput: 首条 + 最近 N-1 条（N=5）
const msgs = Array.from({ length: 8 }, (_, i) => ({ seq: i + 1, text: 'm' + i }));
const built = buildTitleInput(msgs, 5, 4000);
assert.deepEqual(built.usedMessages.map(m => m.seq), [1, 5, 6, 7, 8]);
assert.equal(built.text.split('\n\n').length, 5);
// length <= N 全取
const short = buildTitleInput(msgs.slice(0, 3), 5, 4000);
assert.deepEqual(short.usedMessages.map(m => m.seq), [1, 2, 3]);
// budget 紧张：从最旧非首条开始丢，保首条 + 最近
const tight = buildTitleInput(msgs, 5, 7);
assert.deepEqual(tight.usedMessages.map(m => m.seq), [1, 8]);
// 首条自身超预算 -> 截断
const trunc = buildTitleInput([{ seq: 1, text: 'abcdefghij' }], 5, 3);
assert.equal(trunc.text, 'abc');
console.log('title-utils check ok');
