# JJSMade Personal Deployment (Vercel + Convex)

This project deploys as:
- `Frontend`: Vercel static hosting (`dist`)
- `Backend`: Convex production deployment

No API or schema changes are required for deployment.

## Other compatible hosts

If you want to switch later, these are also viable:
1. Netlify + Convex
2. Cloudflare Pages + Convex
3. Render Static Site + Convex
4. GitHub Pages + Convex

## One-time setup

1. Ensure local app builds.

```bash
npm run build
```

2. Deploy Convex once from local machine (creates/updates production deployment).

```bash
npx convex deploy
```

3. Open Convex dashboard and create a deploy key for CI/CD.

```bash
npx convex dashboard
```

4. Import this repository into Vercel.

5. In Vercel project settings, add environment variable:
- `CONVEX_DEPLOY_KEY` = your Convex production deploy key
- Scope: `Production` (required)
- Scope: `Preview` (optional, if you also create a preview deploy key)

6. Confirm Vercel uses repo config from `vercel.json`:
- Build Command: `npx convex deploy --cmd "npm run build:app"`
- Output Directory: `dist`

7. Push to `main` to trigger the full pipeline.

The Vercel build runs Convex deploy first, and Convex injects `VITE_CONVEX_URL` for the frontend build command.

## Protected access (recommended for personal use)

Use Cloudflare Access in front of your Vercel custom domain.

1. Add a custom domain to Vercel.
2. Move DNS for that domain/subdomain to Cloudflare (proxied through Cloudflare).
3. In Cloudflare Zero Trust, create an Access application for your app hostname.
4. Create an allow policy for only your email identity.
5. Test in private/incognito mode:
- Not signed in as you: blocked
- Signed in as you: allowed

## Verification checklist

1. Push to `main` triggers a Vercel build.
2. Build logs include Convex deploy and frontend build.
3. App loads without `VITE_CONVEX_URL` client errors.
4. Core flows work on production: item create/edit, status updates, seller views, dashboard analytics.
5. Anonymous access is blocked by Access policy.

## Troubleshooting

- `VITE_CONVEX_URL` missing at runtime:
  - Confirm Vercel build command is `npx convex deploy --cmd "npm run build:app"`.
  - Confirm `CONVEX_DEPLOY_KEY` exists in Vercel environment variables.
- Convex deploy fails in Vercel:
  - Recreate deploy key in Convex dashboard and update Vercel env var.
  - Confirm key environment scope matches the deployment environment.
