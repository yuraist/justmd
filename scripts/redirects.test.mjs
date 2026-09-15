import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

const request = (path, init) => new Request(`https://justmd.nuta.life${path}`, init);
function env() {
  const points = [];
  return { points, DOWNLOADS: { writeDataPoint: p => points.push(p) }, ASSETS: { fetch: async () => new Response('asset') } };
}

test('each CTA reaches its fixed destination and records only destination and placement', async () => {
  for (const [target, destination] of [['app-store', 'https://apps.apple.com/app/id6779422717'], ['dmg', 'https://github.com/yuraist/justmd/releases/latest/download/JustMD-1.0.dmg']]) {
    for (const source of ['hero', 'footer']) {
      const bindings = env();
      const response = await worker.fetch(request(`/go/${target}?source=${source}`, { headers: { 'CF-Connecting-IP': '192.0.2.1', Referer: 'https://example.com/private' } }), bindings);
      assert.equal(response.status, 302);
      assert.equal(response.headers.get('Location'), destination);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.deepEqual(bindings.points, [{ indexes: ['justmd'], blobs: [target === 'app-store' ? 'app_store' : 'dmg', source], doubles: [1] }]);
    }
  }
});
test('untrusted query parameters cannot change destinations or enter the dataset', async () => {
  const bindings = env();
  const response = await worker.fetch(request('/go/app-store?source=private-value&url=https://example.com'), bindings);
  assert.equal(response.headers.get('Location'), 'https://apps.apple.com/app/id6779422717');
  assert.equal(bindings.points[0].blobs[1], 'other');
});
test('analytics failure does not break downloads', async () => {
  const bindings = env();
  bindings.DOWNLOADS.writeDataPoint = () => { throw new Error('unavailable'); };
  assert.equal((await worker.fetch(request('/go/dmg'), bindings)).status, 302);
});
test('HEAD, prefetch and unsupported methods do not record clicks', async () => {
  for (const [init, status] of [[{ method: 'HEAD' }, 302], [{ headers: { 'Sec-Purpose': 'prefetch' } }, 302], [{ method: 'POST' }, 405]]) {
    const bindings = env();
    assert.equal((await worker.fetch(request('/go/dmg', init), bindings)).status, status);
    assert.equal(bindings.points.length, 0);
  }
});
test('other paths go to the static asset service', async () => {
  const bindings = env();
  assert.equal(await (await worker.fetch(request('/privacy'), bindings)).text(), 'asset');
  assert.equal(bindings.points.length, 0);
});
