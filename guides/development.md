# Development, checks and limits

## Try it

Use Node 22.13 or newer and pnpm 11.7:

```sh
git clone https://github.com/appdever01/skelo.git
cd skelo
pnpm install --frozen-lockfile
pnpm dev
```

Open the HTTP address printed by Vite, normally `http://127.0.0.1:5173/`.
The `examples/react/index.html` file is a source entry that needs the development
server to compile and serve the React application.

The local example has independent profile and activity requests, refresh and
error controls, longer content, a right-to-left layout toggle and quality reports.
All example data and requests are simulated. Each stack has its own folder in
[examples/](https://github.com/appdever01/skelo/blob/main/examples/README.md).

Install the JavaScript package with `npm install skelo@0.2.1` or
`pnpm add skelo@0.2.1`. Import the CSS once in your web app.

For local package development, run `pnpm build` and
`pnpm pack --pack-destination .local`, then install `.local/skelo-0.2.1.tgz`
in a separate project.

## Verification and limits

```sh
pnpm check
pnpm smoke:package
pnpm smoke:packed
pnpm check:flutter
```

JavaScript tests cover independent regions, retained content, scoped errors and
retries, lazy pending content, SSR/hydration, scan budgets, measurement failures,
observer cleanup and comparison failures. Test workers are capped at two.
`pnpm check` also builds the Next.js, Vue and Svelte examples and exports the
Expo example for iOS and Android. Flutter checks run separately and require
Flutter installed; they include the package and example widget workflows.

Desktop browser checks exercised the Next.js production server and the Vue and
Svelte examples: independent loading, matching layouts, retained profile edits,
local errors and retry. Next.js produced no hydration warnings. A shared web
margin-containment fix was verified in these examples. DOM unit tests use jsdom
and cannot prove browser geometry on their own.

Expo Go 57.0.9 and Flutter 3.44.2 were also tested on an iPhone 17 Pro simulator
running iOS 26.5 and an Android 15 / API 35 emulator. Both adapters captured a
registered box at `8,8` with size `160×32`, reported matching loading/loaded
geometry, retained profile edits during refresh, kept errors and retries within
the activity region, and rejected unavailable measurements. Expo uses a
[Maestro flow](https://github.com/appdever01/skelo/blob/main/examples/expo/.maestro/native.yaml); Flutter uses a real-engine
[integration test](https://github.com/appdever01/skelo/blob/main/examples/flutter/integration_test/native_test.dart) that also
asserts retained input element identity.

Native test-renderer checks mock host measurement, and Metro exports only prove
bundle compatibility. The simulator checks above exercise native measurement.
Hardware devices, VoiceOver, TalkBack, responsive layouts and broad visual
audits remain unverified, so the native and Flutter adapters remain previews.

Named providers remain part of the React API. Other adapters receive direct
resources, with `combineResources` available to JavaScript consumers. There is
no automatic inference of data dependencies, route capture, screenshot
comparison or virtualized-list support. Web layouts with transforms, clipping,
closed shadow roots or portals need application-specific checks. Web wrappers
are `div` elements and must be used where that markup is valid. Native and Flutter use their own rendering and accessibility properties.
