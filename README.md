# justmd.nuta.life

Static site for JustMD (landing + privacy policy), served by a Cloudflare Worker
with static assets on the same account as nuta.life.

- Content lives in `public/` (`index.html`, `privacy.html`, `assets/`).
- Deploy: `CLOUDFLARE_API_TOKEN=… npx wrangler@4 deploy` (config in `wrangler.jsonc`;
  the custom domain `justmd.nuta.life` is attached to the Worker `justmd-site`).

## Landing and download analytics

**Activation pending:** Analytics Engine is not enabled on the Cloudflare account.
The live landing and all download redirects work; clicks are not recorded yet.
After enabling Analytics Engine in the dashboard, add the following binding to
`wrangler.jsonc`, update the website privacy section, and redeploy:

```json
"analytics_engine_datasets": [
  { "binding": "DOWNLOADS", "dataset": "justmd_downloads" }
]
```

The description below documents the prepared analytics implementation.

The page stays buildless. `src/worker.mjs` handles only `/go/*`; other files
are served by Workers Static Assets. The App Store and DMG links use fixed
302 redirects with `Cache-Control: no-store`, so each request can be counted.
Analytics failure never blocks navigation. HEAD and prefetch requests do not
count. There are no tracking cookies, browser event scripts, or identifiers.

`justmd_downloads` in Cloudflare Analytics Engine stores:

- `blob1`: `app_store` or `dmg`.
- `blob2`: `hero`, `footer`, or `other`.
- `double1`: `1`.
- `index1`: `justmd`.

Use the Analytics Engine SQL API or Cloudflare's query interface:

```sql
SELECT blob1 AS destination, blob2 AS placement,
       SUM(_sample_interval * double1) AS clicks
FROM justmd_downloads
WHERE timestamp > NOW() - INTERVAL '30' DAY
GROUP BY destination, placement
ORDER BY clicks DESC
```

These are download-link requests, not unique visitors or installs; crawlers
and repeated clicks can contribute. Analytics Engine retains data for three
months. Queries may be sampled, so use `_sample_interval` when aggregating.
The dataset is created by the first recorded request after deployment.

Validate redirect behavior with `node --test scripts/redirects.test.mjs`.
Preview the complete site with `npx wrangler@4 dev`.
