# justmd.nuta.life

Static site for JustMD (landing + privacy policy), served by a Cloudflare Worker
with static assets on the same account as nuta.life.

- Content lives in `public/` (`index.html`, `privacy.html`, `assets/`).
- Deploy: `CLOUDFLARE_API_TOKEN=… npx wrangler@4 deploy` (config in `wrangler.jsonc`;
  the custom domain `justmd.nuta.life` is attached to the Worker `justmd-site`).
