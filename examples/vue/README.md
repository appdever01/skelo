# Vue 3 example

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --dir examples/vue dev
```

Open `http://127.0.0.1:3101`. Requests are simulated. Edit the profile, refresh it, load activity, then fail and retry activity. The profile remains mounted while the activity region changes. The page displays the layout quality report.

Run `pnpm --dir examples/vue build` to compile the example using Skelo's public adapter export.
