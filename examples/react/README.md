# React example

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --dir examples/react dev
```

Open the Vite HTTP address, normally `http://127.0.0.1:5173`. This app includes independent requests, refresh and retry controls, editable content, layout quality reports and a right-to-left toggle. Requests are simulated.

Run `pnpm demo:build` from the root to build it into `.local/demo-dist`. Do not open the source HTML as a file; Vite compiles the TypeScript and package imports.
