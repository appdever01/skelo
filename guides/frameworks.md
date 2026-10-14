# Framework guides

## Platforms and installation

Install [Skelo from npm](https://www.npmjs.com/package/skelo):

```sh
npm install skelo@0.2.1
```

Install the framework itself in the consuming application. Framework peers are
optional so a Vue or Svelte application does not need React, and a native
application does not need React DOM. Import `skelo/styles.css`
once for web adapters; native and Flutter adapters do not use it.

| Platform | Import or package | Checked here | Remaining limits |
| --- | --- | --- | --- |
| React 18.3 and 19 | `skelo` | Packed consumers, types, SSR, loading transitions | Browser smoke checks cover desktop examples, not every layout |
| Next.js 16.4 App Router | `skelo/next` | Production build, server/client boundaries, SSR, hydration and browser interactions | Other Next.js versions and routers are unverified |
| Vue 3.5 | `skelo/vue` | Slots, SSR, transitions, production build and browser interactions | Nuxt integration is unverified |
| Svelte 5 | `skelo/svelte` | Snippets, transitions, declarations, production build and browser interactions | SvelteKit route integration is unverified; Svelte 4 is unsupported |
| React Native 0.86.3 / Expo SDK 57 | `skelo/native` | Component tests, Metro exports and Expo Go simulator flows on iOS 26.5 / Android 15 | Preview: simulator verified; hardware and screen readers pending |
| Flutter | `skelo: 0.2.0-preview.2` on pub.dev | Flutter 3.44.2 / Dart 3.12.2, widget/web checks and native integration on iOS 26.5 / Android 15 | Preview: simulator verified; hardware and screen readers pending |

### Next.js

The `/next` entry preserves `"use client"` in the built package. Server
Components can import resource helpers from `/core`; they must not call helpers
exported from a client entry on the server. Put state, event handlers and render
callbacks inside your own Client Component:

```tsx
'use client';
import { useState } from 'react';
import { LoadingRegion, QualityBoundary } from 'skelo/next';
import { ready, refreshing, type Resource } from 'skelo/core';

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
import { Geometry, LoadingRegion, type Resource } from 'skelo/native';

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
import { LoadingRegion, QualityBoundary, pending, ready, type Resource } from 'skelo/vue';
import 'skelo/styles.css';
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
  import { LoadingRegion, QualityBoundary, pending, ready, type Resource } from 'skelo/svelte';
  import 'skelo/styles.css';
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

Install the separate [Flutter preview from pub.dev](https://pub.dev/packages/skelo):

```sh
flutter pub add skelo:0.2.0-preview.2
```

Or add the exact preview to your `pubspec.yaml`:

```yaml
dependencies:
  skelo: 0.2.0-preview.2
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
its [README](https://github.com/appdever01/skelo/blob/main/examples/flutter/README.md) describes simulator checks. See the
[Flutter package README](https://github.com/appdever01/skelo/blob/main/packages/flutter/README.md),
[RenderBox API](https://api.flutter.dev/flutter/rendering/RenderBox/localToGlobal.html)
and [frame callbacks](https://api.flutter.dev/flutter/widgets/WidgetsBinding/addPostFrameCallback.html).
