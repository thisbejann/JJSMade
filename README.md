# JJSMade

Single-user business management app for replica item reselling operations.

## Stack

- React + Vite + TypeScript
- Convex (database + backend functions)
- Tailwind CSS + Recharts + Framer Motion

## Local development

Run both processes:

```bash
npm run dev
```

```bash
npx convex dev
```

## Build

```bash
npm run build
```

## Deployment (personal use)

Primary deployment target is **Vercel + Convex**.

- Repo deployment config: `vercel.json`
- Detailed setup guide: `docs/deployment/personal-vercel-convex.md`

One-command deploy script (when `CONVEX_DEPLOY_KEY` is present):

```bash
npm run deploy:convex:prod
```
