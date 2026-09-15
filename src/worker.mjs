const destinations = new Map([
  ['/go/app-store', 'https://apps.apple.com/app/id6779422717'],
  ['/go/dmg', 'https://github.com/yuraist/justmd/releases/latest/download/JustMD-1.0.dmg'],
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const destination = destinations.get(url.pathname);
    if (!destination) return env.ASSETS.fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const source = url.searchParams.get('source');
    const purpose = `${request.headers.get('Purpose') || ''} ${request.headers.get('Sec-Purpose') || ''}`;
    // Record only the button and its position. Never store IPs, user agents, or referrers.
    // HEAD checks and speculative prefetches should not inflate download intent.
    if (env.DOWNLOADS && request.method === 'GET' && !purpose.includes('prefetch')) {
      try {
        env.DOWNLOADS.writeDataPoint({
          indexes: ['justmd'],
          blobs: [url.pathname === '/go/app-store' ? 'app_store' : 'dmg', ['hero', 'footer'].includes(source) ? source : 'other'],
          doubles: [1],
        });
      } catch {
        // Download navigation must still work if analytics is unavailable.
        console.error('download_analytics_write_failed');
      }
    }
    return new Response(null, {
      status: 302,
      headers: { Location: destination, 'Cache-Control': 'no-store' },
    });
  },
};
