# Flutter API guide

`LoadingRegion<T>` accepts a `Resource<T>` and a lazy `builder`. Pending builders
are never called. Refreshing and stale-error resources keep available children
mounted. Retry and error widgets stay in their region. Use the separate
`template` only for presentational fixtures without effects. Mark template and
loaded boxes with matching `Geometry(boneKey: ...)` widgets. Unregistered content
is outside the geometry check.

`onReport` enables quality capture and compares pending and loaded snapshots. `MeasuredLayout` exposes
`onSnapshot` for controlled captures. Measurement uses public `RenderBox` APIs
after a frame, with no widget-tree traversal. Invalid, partial, empty or missing
measurements fail. `compareLayouts`, `LayoutSnapshot` and `Bone` are also usable
from the pure Dart `package:skelo/core.dart` module. Coordinates are Flutter logical
pixels. Comparisons are within a platform and container width, not across devices.
Skeletons are static and exclude semantics, focus and pointer input. Reports
compare geometry and do not certify accessibility.

Run `flutter pub get`, `flutter analyze`, and `flutter test --concurrency=2` from
the package root (the folder containing `pubspec.yaml`). Shared JSON test fixtures ship in `test/fixtures`, so these checks
work from the published archive without a repository checkout. The larger
[repository example](https://github.com/appdever01/skelo/tree/main/examples/flutter)
includes iOS, Android and web hosts, widget checks and a native integration test.
Its web host compiles with `flutter build web`.

Verified with Flutter 3.44.2 / Dart 3.12.2 using widget tests, web compilation
and native integration tests on iOS 26.5 and Android 15 simulators. The native
checks cover measured bounds, matching layouts, retained input identity and
edits, local errors/retries and unavailable geometry rejection. Hardware devices
and screen readers remain untested, so this adapter is a preview. MIT licence and preserved attribution are in
[LICENSE](../LICENSE) and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

## Skeleton appearance

`Skeleton` accepts `color` (default `Color(0xffdde1e5)`) and `minHeight`
(default 24 logical pixels). It uses a static colour; there is no pulse or
shimmer option. A template generates shapes only from widgets wrapped in
`Geometry`. `Geometry` accepts `boneKey`, `radius` and `kind`; use matching keys
for loading and loaded captures.

`LoadingRegion` uses the default skeleton colour when it creates the skeleton.
For a different colour or minimum height, pass your own `Skeleton` through
`fallback`:

```dart
LoadingRegion<String>(
  resource: resource,
  fallback: const Skeleton(
    color: Color(0xffd4d4d4),
    minHeight: 80,
    template: Geometry(boneKey: 'activity', child: Text('Activity ready')),
  ),
  builder: (context, value) => Geometry(boneKey: 'activity', child: Text(value)),
)
```

Import `package:flutter/material.dart` and `package:skelo/skelo.dart` for this
example. The application supplies `resource`.

## Dart entries

Use `package:skelo/skelo.dart` for Flutter widgets and core helpers. Use
`package:skelo/core.dart` for resource states, snapshots and comparisons without
importing Flutter widgets. The package itself requires the Flutter SDK.
