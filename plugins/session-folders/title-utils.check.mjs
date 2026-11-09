import assert from 'node:assert/strict';
import { parseLlmOutput, resolveModelChain, isEffortRejection } from './lib/index.js';

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
console.log('title-utils check ok');
