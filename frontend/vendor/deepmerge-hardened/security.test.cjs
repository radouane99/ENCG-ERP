const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const resolveRequire = createRequire(require.resolve('@rollup/plugin-node-resolve'));
const merge = resolveRequire('deepmerge');
const payload = () => JSON.parse('{"__proto__":{"isAdmin":true},"safe":1}');
function safe(object) {
  assert.equal(Object.getPrototypeOf(object), Object.prototype);
  assert.equal(object.isAdmin, undefined);
  assert.equal(Object.prototype.isAdmin, undefined);
  assert.equal(Object.hasOwn(object, '__proto__'), false);
}

test('the installed Rollup dependency resolves to the reviewed local fork', () => {
  assert.equal(readFileSync(resolveRequire.resolve('deepmerge'), 'utf8'), readFileSync(path.join(__dirname, 'index.cjs'), 'utf8'));
  assert.equal(resolveRequire('deepmerge/package.json').name, '@encg/deepmerge-hardened');
});
test('blocks source poisoning with a null-prototype target', () => {
  const result = merge(Object.create(null), payload());
  safe(result);
  assert.equal(result.safe, 1);
});
test('blocks poisoned target keys during target cloning', () => {
  safe(merge(payload(), {}));
});
test('blocks a source attack when the target owns __proto__', () => {
  safe(merge(JSON.parse('{"__proto__":{}}'), payload()));
});
test('blocks nested poisoning behind a null or undefined placeholder', () => {
  for (const placeholder of [null, undefined, false, 0, '']) {
    const result = merge({ session: placeholder }, { session: payload() });
    safe(result.session);
    assert.equal(result.session.safe, 1);
  }
});
test('blocks constructor and prototype keys from both sides', () => {
  const attack = JSON.parse('{"constructor":{"prototype":{"isAdmin":true}},"prototype":{"isAdmin":true},"safe":1}');
  for (const result of [merge({}, attack), merge(attack, {})]) {
    safe(result);
    assert.equal(Object.hasOwn(result, 'constructor'), false);
    assert.equal(Object.hasOwn(result, 'prototype'), false);
    assert.equal(result.safe, 1);
  }
});
test('protects nested values in concatenated arrays', () => {
  const result = merge({ items: [payload()] }, { items: [payload()] });
  assert.equal(result.items.length, 2);
  result.items.forEach(safe);
});
test('fails closed when a proxy throws in the membership guard', () => {
  const target = new Proxy({}, { has() { throw new Error('trap'); } });
  const result = merge(target, { isAdmin: true });
  safe(result);
});
test('does not invoke forbidden getters on either operand', () => {
  const target = {};
  Object.defineProperty(target, '__proto__', { enumerable: true, get() { throw new Error('must not read'); } });
  safe(merge(target, {}));
  safe(merge({}, target));
});
test('preserves normal defaults, deep cloning, arrays, dates and regular expressions', () => {
  const date = new Date('2026-01-01');
  const regex = /test/;
  const original = { nested: { a: 1 }, items: [{ x: 1 }], date, regex };
  const result = merge(original, { nested: { b: 2 }, items: [{ y: 2 }] });
  assert.deepEqual(result.nested, { a: 1, b: 2 });
  assert.deepEqual(result.items, [{ x: 1 }, { y: 2 }]);
  assert.notEqual(result.nested, original.nested);
  assert.notEqual(result.items[0], original.items[0]);
  assert.equal(result.date, date);
  assert.equal(result.regex, regex);
  assert.deepEqual(original.nested, { a: 1 });
});
test('keeps symbols, customMerge, arrayMerge, clone:false and merge.all compatible', () => {
  const key = Symbol('option');
  assert.deepEqual(merge({ [key]: { a: 1 } }, { [key]: { b: 2 } })[key], { a: 1, b: 2 });
  assert.deepEqual(merge({ list: [1] }, { list: [2] }, { arrayMerge: (_a, b) => b }), { list: [2] });
  assert.deepEqual(merge({ count: 1 }, { count: { value: 3 } }, { customMerge: key => key === 'count' ? () => 7 : undefined }), { count: 7 });
  const reference = { value: 1 };
  assert.equal(merge({}, { reference }, { clone: false }).reference, reference);
  assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }]), { a: 1, b: 2 });
  assert.throws(() => merge.all({}), /array/);
});
