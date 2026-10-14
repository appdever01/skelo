# Skelo

Load independent parts of a React page and check how their skeletons compare
with the content that arrives.

This is the first working version. It supports React 18.3 and 19. The package
has not been published to npm yet.

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
The `example/index.html` file is a source entry that needs the development
server to compile and serve the React application.

The local example has independent profile and activity requests, refresh and
error controls, longer content, a right-to-left layout toggle and quality reports.
All example data and requests are simulated.

To install the built package in another project:

```sh
pnpm build
pnpm pack --pack-destination .local
```

Install the resulting `.local/react-loading-regions-0.1.0.tgz` with your project's
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

## Verification and limits

```sh
pnpm check
pnpm smoke:package
pnpm smoke:packed
```

Tests cover resource adapters, independent regions, refresh continuity,
region errors, SSR, scan budgets, observer lifecycle and quality failures.
DOM tests use jsdom and supplied geometry. They do not prove browser layout,
actual tab navigation or visual fidelity. Separate local browser smoke checks
covered the example rendering, independent profile/activity loading, refresh
continuity, an activity error and retry, one keyboard Tab transition and the
normal layout reports at a desktop viewport. Both example regions were within
the default 8px tolerance, and no console errors were observed.
Responsive layouts, screen-reader behaviour and broader visual comparisons
remain unverified.

Packed-package smoke checks install the tarball in temporary React 18 and 19
projects and check ESM/CommonJS imports, declarations, SSR, styles and CLI exit
codes. The temporary projects are removed after the checks.

There is no automatic inference of arbitrary data dependencies, fixture
generation, route capture, screenshot comparison or virtualized-list adapter in
this release. Layouts using transforms, clipping, closed shadow roots, portals
or unusual CSS need application-specific checks. Region wrappers are `div`
elements; place them where that markup is valid.

## Licence

[MIT](LICENSE). Third-party licences are included in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
