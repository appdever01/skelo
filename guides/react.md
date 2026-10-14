# React API guide

## Partial loading

Each region receives its own resource. Pending regions show placeholders while
ready regions remain usable. Refreshing regions keep their existing content.

```tsx
import { LoadingRegion, type Resource } from 'skelo';
import 'skelo/styles.css';

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
`'pulse'`, `'shimmer'` or `'none'`. Set `--lr-base` for the shape colour and
`--lr-highlight` for the shimmer highlight on a selector such as
`.profile .lr-skeleton`; this also overrides the built-in dark-mode values.
`--lr-radius` controls the plain fallback block's corners. Measured shapes use
the corners from the template's CSS. Loading, refresh, error and retry labels are props,
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

`maxDepth` limits how far the scan looks into nested HTML. It does not gradually
reduce the skeleton's detail. If the limit cuts off nested content, the scan is
incomplete and the skeleton becomes a plain fallback block. For a simpler
skeleton, simplify the template, ignore selected elements, or mark a whole
group with `data-skeleton-shape="rect"`.
