# Skelo

Load independent parts of an interface and check how their skeletons compare
with the content that arrives.

Skelo has adapters for React, Next.js, React Native/Expo, Vue and Svelte,
and a separate Dart package for Flutter. Neither package is published yet.
The JavaScript package keeps its existing name, `react-loading-regions`, and
its original React API.

## The problem

A profile card and an activity feed can finish loading at different times.
With one loading flag for the whole page, a slow feed can keep a finished
profile hidden. Switching that flag back on during a refresh can also replace
content someone is already using.

Skeletons have a separate problem: the placeholder can look right while the
loaded content is taller, wider or positioned differently. Generating shapes
alone does not tell you how well they match the result.

## Why Skelo is different

[auto-skeleton-react](https://github.com/ShanukJ/auto-skeleton),
[@auto-skeleton/react](https://github.com/riazzahmedm/react-auto-skeleton) and
[react-auto-skeleton-loader](https://github.com/mirzaibtisam41/react-auto-skeleton-loader)
document loading wrappers driven by a boolean. Skelo combines explicit resource
states with a check of each region's loading and loaded layouts.

- Each region declares the data it needs. A profile can become usable while
  the activity feed still shows its skeleton.
- Refreshing keeps existing content mounted. If a refresh fails and the
  resource retains its data, the region shows the error alongside that content.
  Errors and retry controls stay with the affected region.
- The quality checker reports differences in position, size and shape, along
  with overflow and missing elements. Incomplete or unmeasured captures cannot
  pass. Reports are available through React or a JSON command-line check.
- Real pending children stay unmounted during scanning. You can supply an
  inert template or saved geometry instead. Templates must be free of side
  effects; saved geometry can also provide a skeleton during server rendering.

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
[examples/](examples/README.md).

To install the built package in another project:

```sh
pnpm build
pnpm pack --pack-destination .local
```

Install the resulting `.local/react-loading-regions-0.2.0.tgz` with your project's
package manager. Import the CSS once in your app.

## Partial loading

Each region receives its own resource. Pending regions show placeholders while
ready regions remain usable. Refreshing regions keep their existing content.

```tsx
import { LoadingRegion, type Resource } from 'react-loading-regions';
import 'react-loading-regions/styles.css';

function Profile({ name, bio }: {
  name: Resource<string>;
  bio: Resource<string>;
}) {
  return (
    <section>
      <LoadingRegion id="name" resource={name} template={<h2>Alex Morgan</h2>}>
        {value => <h2>{value}</h2>}
      </LoadingRegion>
      <LoadingRegion id="bio" resource={bio} template={<p>Product designer in Lagos</p>}>
        {value => <p>{value}</p>}
      </LoadingRegion>
    </section>
  );
}
```

Create resources with `pending()`, `ready(data)`, `refreshing(data)` or
`failed(error, optionalExistingData)`. Ready values can include `0`, `false`,
an empty string or `undefined`. The caller owns request cancellation and data
retention; the library never saves user data globally or in browser storage.

`fromQuery(query)` accepts the structural state returned by TanStack Query.
`fromSWR(query)` accepts SWR's data, error and validation flags. Neither requires
installing those libraries here.

For shared bindings, wrap regions in `LoadingProvider resources={{ profile,
activity }}` and use `needs="profile"` or `needs={['profile', 'activity']}`.
Named bindings pass a record to the render function, such as `data.profile`.
Direct `resource` bindings preserve the data's TypeScript type. Unknown names
throw a useful error.

## Loading templates

`template` is optional, representative markup used to reserve space and generate
skeleton geometry. Keep it free of requests, subscriptions, portals and other
side effects. It is mounted under an inert, visually hidden wrapper; real
pending children and render functions are never mounted or invoked for scanning.

Without a template or supplied `layout`, the initial placeholder is a simple
block. Use `minHeight` to reserve useful space. With a template, the first frame
uses a block until measurement is available. Pass a geometry-only `layout`
snapshot for a skeleton available during server rendering.

The skeleton respects reduced motion and forced colours. Set `animation` to
`'pulse'`, `'shimmer'` or `'none'`. Set `--lr-base`, `--lr-highlight` and
`--lr-radius` to theme it. Loading, refresh, error and retry labels are props,
so your application can translate them.

Element hints:

| Attribute | Effect |
| --- | --- |
| `data-loading-key="name"` | Stable identity for geometry comparisons. Use unique keys in a region. |
| `data-skeleton-ignore` | Skip the element and its descendants during scanning. |
| `data-skeleton-shape="circle"` or `"rect"` | Treat the element as one shape. |
| `data-skeleton-lines="3"` | Use an explicit text line count. |

Scans accept `maxDepth`, `maxElements`, `maxScanMs`, `minSize` and
`ignoreSelectors`. Defaults are 16 levels, 500 visited elements, 16ms and a 2px
minimum size. A budget is checked between elements, so it is a cooperative
limit rather than a hard execution deadline. Incomplete scans use a simple
placeholder and cannot pass a layout comparison.

## Quality checker

Import development checks separately from the loading components:

```tsx
import { QualityBoundary } from 'react-loading-regions/quality/react';

<QualityBoundary onReport={report => console.log(report)}>
  <Profile name={nameResource} bio={bioResource} />
</QualityBoundary>
```

The boundary captures pending regions, compares them after content arrives,
and reports each completed load once. It also checks for hidden elements left
in the keyboard tab order. It reports incomplete scans, missing or extra shapes,
duplicate IDs or keys, overflow and differences in position, size or radius.
Failed loads report that the loaded layout could not be checked.

The default shape tolerance is 8px. Configure `tolerancePx`,
`heightTolerancePx`, `widthTolerancePx`, `overflowTolerancePx`,
`checkUnexpected` and `scan` through the boundary's `options` prop. Stable
options are recommended. Disable the boundary or leave it out of production
to avoid measurement work.

These checks compare geometry. They are not a CLS measurement, an accessibility
certification or an exhaustive visual comparison. Compare the same container
width in both states and repeat the workflow at the widths, locales, font sizes
and content lengths your app supports. Text is not stored in snapshots.
Dynamic lists may need representative templates or an explicit `fallback`.

For controlled measurements, import `captureLayout`, `compareLayouts`,
`createQualityChecker` or `auditHiddenFocus` from `react-loading-regions/quality`.
`createQualityChecker(root).capture()` stores pending captures and returns
reports on later completion. Call `reset()` when switching scenarios. No
observers or storage are started by the standalone checker.

## Command-line check

Save loading and loaded snapshots from `captureLayout(element)` as JSON, then:

```sh
loading-regions-check loading.json loaded.json --tolerance 8
```

The command outputs a JSON report. Exit code `0` means within tolerance,
`1` means a mismatch or an uncomparable capture, and `2` means invalid input.
Capturing genuine geometry requires a browser; this command only compares
existing snapshots and never launches one.

## Platforms and installation

Build and pack this checkout with `pnpm build` and
`pnpm pack --pack-destination .local`. In another JavaScript project, run:

```sh
pnpm add /absolute/path/to/skelo/.local/react-loading-regions-0.2.0.tgz
```

Install the framework itself in the consuming application. Framework peers are
optional so a Vue or Svelte application does not need React, and a native
application does not need React DOM. Import `react-loading-regions/styles.css`
once for web adapters; native and Flutter adapters do not use it.

| Platform | Import or package | Checked here | Remaining limits |
| --- | --- | --- | --- |
| React 18.3 and 19 | `react-loading-regions` | Packed consumers, types, SSR, loading transitions | Browser smoke checks cover desktop examples, not every layout |
| Next.js 16.4 App Router | `react-loading-regions/next` | Production build, server/client boundaries, SSR, hydration and browser interactions | Other Next.js versions and routers are unverified |
| Vue 3.5 | `react-loading-regions/vue` | Slots, SSR, transitions, production build and browser interactions | Nuxt integration is unverified |
| Svelte 5 | `react-loading-regions/svelte` | Snippets, transitions, declarations, production build and browser interactions | SvelteKit route integration is unverified; Svelte 4 is unsupported |
| React Native 0.86.3 / Expo SDK 57 | `react-loading-regions/native` | Component tests, Metro exports and Expo Go simulator flows on iOS 26.5 / Android 15 | Preview: simulator verified; hardware and screen readers pending |
| Flutter | Dart package in `packages/flutter` | Flutter 3.44.2 / Dart 3.12.2, widget/web checks and native integration on iOS 26.5 / Android 15 | Preview: simulator verified; hardware and screen readers pending |

### Next.js

The `/next` entry preserves `"use client"` in the built package. Server
Components can import resource helpers from `/core`; they must not call helpers
exported from a client entry on the server. Put state, event handlers and render
callbacks inside your own Client Component:

```tsx
'use client';
import { useState } from 'react';
import { LoadingRegion, QualityBoundary } from 'react-loading-regions/next';
import { ready, refreshing, type Resource } from 'react-loading-regions/core';

export default function Profile({ initialName }: { initialName: string }) {
  const [name, setName] = useState<Resource<string>>(ready(initialName));
  return <QualityBoundary onReport={console.log}>
    <LoadingRegion id="profile" resource={name} template={<p>Alex</p>}>
      {value => <p>{value}</p>}
    </LoadingRegion>
    <button onClick={() => setName(refreshing(initialName))}>Refresh</button>
  </QualityBoundary>;
}
```

Import the CSS in `app/layout.tsx`. Pass serializable initial data from the
Server Component, with the same resource state for SSR and initial hydration.
A pending resource never invokes its client render callback. Server Components
passed as children are evaluated by Next.js on the server, so use a client
callback when content must wait for client data. DOM measurement starts after
mount; supplied geometry can render skeletons on the server.

Run `pnpm --dir examples/next dev`. The example includes a Server Component
importing `/core`, direct client boundaries with ready and pending resources,
and a client island with independent loading, refresh, retry and quality checks.
See [Next.js server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components).

### React Native and Expo

```tsx
import { Text } from 'react-native';
import { Geometry, LoadingRegion, type Resource } from 'react-loading-regions/native';

export function Activity({ resource, retry }: { resource: Resource<string>; retry: () => void }) {
  return <LoadingRegion id="activity" resource={resource} onRetry={retry}
    onReport={console.log}
    template={<Geometry boneKey="activity"><Text>Activity ready</Text></Geometry>}>
    {value => <Geometry boneKey="activity"><Text>{value}</Text></Geometry>}
  </LoadingRegion>;
}
```

`Geometry` registers a non-collapsing native `View`. Match its `boneKey`,
`radius` and `kind` between the template and loaded content. The adapter
measures registered host views with `measureInWindow`, after layout. It never
scans a DOM, traverses React internals or mounts the real pending children.
Nested measured layouts and regions have separate registries.

A separate, presentational `template` generates shapes automatically. Supplied
`layout` snapshots also work. Templates must have no effects or interactive
controls. Skeletons disable touch and hide their descendants from native
accessibility; error and retry controls remain available. Native skeletons are
static and use a configurable `color`. Labels are customizable.

`onReport` enables quality capture and compares registered loading and loaded
geometry for that region. Coordinates use native layout units; compare states
within the same platform and viewport.
For controlled captures, use `MeasuredLayout onSnapshot={...}` with `Geometry`
children, or `captureNativeLayout(rootRef.current, targets)`. Missing, zero-sized
or timed-out measurements produce an incomplete snapshot. The default callback
timeout is 100ms. No native accessibility audit is implied by a geometry pass.
Mark every shape you want compared; unregistered content is outside the check.
Use `combineResources` from `/core` if a region needs several resources.

Run `pnpm --dir examples/expo start`, then open it in a compatible Expo Go or
development build. `pnpm --dir examples/expo export` compiles both phone targets
without launching a device. The adapter follows the documented
[React Native measurement APIs](https://reactnative.dev/docs/the-new-architecture/layout-measurements)
and [Expo SDK compatibility table](https://docs.expo.dev/versions/latest/).

### Vue 3.5

```vue
<script setup lang="ts">
import { shallowRef } from 'vue';
import { LoadingRegion, QualityBoundary, pending, ready, type Resource } from 'react-loading-regions/vue';
import 'react-loading-regions/styles.css';
const activity = shallowRef<Resource<string>>(pending());
const retry = () => { activity.value = ready('Activity ready'); };
</script>

<template>
  <QualityBoundary :on-report="console.log">
    <LoadingRegion id="activity" :resource="activity" :on-retry="retry">
      <template #template><p data-loading-key="activity">Activity ready</p></template>
      <template #default="{ data }"><p data-loading-key="activity">{{ data }}</p></template>
    </LoadingRegion>
  </QualityBoundary>
  <button @click="retry">Load activity</button>
</template>
```

The default slot receives `{ data }` and runs only when data is available.
Optional `template`, `fallback` and `error` slots are lazy; the error slot receives
`{ error }`. `layout`, `scan`, `animation`, `minHeight` and the four labels work
like the React props. Vue templates are inert. `QualityBoundary` uses the shared
DOM checker and accepts `options` and `enabled`. Run
`pnpm --dir examples/vue dev`. The adapter uses Vue's public
[render functions](https://vuejs.org/api/render-function.html) and lifecycle hooks.

### Svelte 5

```svelte
<script lang="ts">
  import { LoadingRegion, QualityBoundary, pending, ready, type Resource } from 'react-loading-regions/svelte';
  import 'react-loading-regions/styles.css';
  let activity = $state<Resource<string>>(pending());
  const retry = () => { activity = ready('Activity ready'); };
</script>

<QualityBoundary onReport={console.log}>
  <LoadingRegion id="activity" resource={activity} onRetry={retry}>
    {#snippet template()}<p data-loading-key="activity">Activity ready</p>{/snippet}
    {#snippet children(value)}<p data-loading-key="activity">{value}</p>{/snippet}
  </LoadingRegion>
</QualityBoundary>
<button onclick={retry}>Load activity</button>
```

Svelte 5.20 or newer is required. The adapter ships `.svelte` components and
public declarations through the `svelte` export condition. `children` is a lazy
snippet with the resource value; `template`, `fallback` and `errorFallback` are
optional snippets. `errorFallback` receives the error. It uses the same DOM
capture, inert templates, CSS and quality options as the other web adapters.
Run `pnpm --dir examples/svelte dev`. See
[Svelte snippets](https://svelte.dev/docs/svelte/snippet) and
[package exports](https://svelte.dev/docs/kit/packaging).

### Flutter

Flutter uses Dart. Install the separate package from this repository, not npm:

```yaml
dependencies:
  skelo:
    git:
      url: https://github.com/appdever01/skelo.git
      path: packages/flutter
      ref: main
```

```dart
import 'package:flutter/material.dart';
import 'package:skelo/skelo.dart';

Widget activityRegion(Resource<String> resource, VoidCallback retry) {
  return LoadingRegion<String>(
    id: 'activity',
    resource: resource,
    onRetry: retry,
    onReport: (report) => debugPrint('${report.passed}'),
    template: const Geometry(boneKey: 'activity', child: Text('Activity ready')),
    builder: (context, value) => Geometry(boneKey: 'activity', child: Text(value)),
  );
}
```

Use `Resource.pending()`, `Resource.ready(value)`, `Resource.refreshing(value)`,
`Resource.failed(error)` or `Resource.stale(error, value)`. Nullable ready values
remain available. The application owns fetching and data retention.

The Dart `package:skelo/core.dart` entry has no Flutter dependency. It reads the same version 1
snapshot format and is tested against the same comparison fixtures as the
TypeScript core. Widgets register `Geometry` boxes and capture public
`RenderBox` sizes and `localToGlobal` coordinates after the frame. Missing or
zero-size boxes cannot pass. `MeasuredLayout` supports controlled captures;
`onReport` compares each region's pending and loaded states. The builder stays
uninvoked while pending, and refreshes retain the child element. Skeletons
exclude focus, semantics and pointer input. Like native skeletons, they are static.
Only registered geometry is checked, and geometry reports do not audit semantics.

Run `cd examples/flutter`, `flutter pub get`, then
`flutter run -d <device-id>`. The example includes iOS, Android and web hosts;
its [README](examples/flutter/README.md) describes simulator checks. See the
[Flutter package README](packages/flutter/README.md),
[RenderBox API](https://api.flutter.dev/flutter/rendering/RenderBox/localToGlobal.html)
and [frame callbacks](https://api.flutter.dev/flutter/widgets/WidgetsBinding/addPostFrameCallback.html).

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
[Maestro flow](examples/expo/.maestro/native.yaml); Flutter uses a real-engine
[integration test](examples/flutter/integration_test/native_test.dart) that also
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

## Licence

[MIT](LICENSE). Third-party licences are included in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
