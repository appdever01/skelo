# Examples

Each stack has its own runnable app. All data is simulated, and the apps use the local Skelo packages.

From the repository root, run `pnpm install --frozen-lockfile` and `pnpm build` before starting a JavaScript example. Use Node 22.13+ and pnpm 11.7. Flutter uses its separate Dart package and requires Flutter 3.44.2+.

| Stack | Folder | Start from the repository root |
| --- | --- | --- |
| React | [react](react) | `pnpm --dir examples/react dev` |
| Next.js App Router | [next](next) | `pnpm --dir examples/next dev` |
| Vue 3 | [vue](vue) | `pnpm --dir examples/vue dev` |
| Svelte 5 | [svelte](svelte) | `pnpm --dir examples/svelte dev` |
| React Native / Expo | [expo](expo) | `pnpm --dir examples/expo start` |
| Flutter | [flutter](flutter) | `cd examples/flutter && flutter pub get && flutter run -d <device-id>` |

Use the buttons to load activity, refresh the profile, fail activity and retry it. Edit the profile first to check that refresh keeps the input mounted. The native apps also show measured bounds, layout comparisons and rejection of unavailable measurements. Each folder explains its checks and requirements.

`pnpm check` runs the JavaScript checks and builds/exports every JavaScript example. `pnpm check:flutter` checks the Dart package, example widgets and web build. Simulator checks are documented in the Expo and Flutter folders and run separately, one device at a time.
