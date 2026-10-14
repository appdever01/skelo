# Next.js example

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --dir examples/next dev
```

Open `http://127.0.0.1:3100`. The App Router page is a Server Component. It passes serializable initial resources to `client-demo.tsx`, which owns the interactive state and imports `skelo/next`. Server code imports resource helpers from `/core`.

The requests are simulated. Edit the profile, refresh it, load activity, then fail and retry activity. The profile remains available throughout. `pnpm --dir examples/next build` verifies the server/client boundary; `pnpm --dir examples/next start` serves that production build.
