# Layout checks and command-line guide

## Quality checker

Wrap the sections you want to check in `QualityBoundary`. In this example,
`Profile` is your component and `nameResource` and `bioResource` are its resource
states. Import development checks separately from the loading components:

```tsx
import { QualityBoundary } from 'skelo/quality/react';

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
`createQualityChecker` or `auditHiddenFocus` from `skelo/quality`.
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
