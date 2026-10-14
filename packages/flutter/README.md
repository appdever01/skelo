# Skelo for Flutter

Independent loading regions with retained content during refresh, region errors
and retries, template skeletons and geometry comparisons. This is a Dart package;
Skelo's npm package cannot be used by Flutter. It is not published to pub.dev.

Install from Git using `path: packages/flutter` and `ref: main` in the Git
dependency, or use a local path to this folder. Import `package:skelo/skelo.dart`.
See the repository [README](../../README.md#flutter) for a complete widget example.

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
this folder within a full checkout. Shared JSON test fixtures live in
`../../tests/fixtures`. The runnable example is in [`../../examples/flutter`](../../examples/flutter)
and includes iOS, Android and web hosts, widget checks and a native integration test.
Its web host compiles with `flutter build web`.

Verified with Flutter 3.44.2 / Dart 3.12.2 using widget tests, web compilation
and native integration tests on iOS 26.5 and Android 15 simulators. The native
checks cover measured bounds, matching layouts, retained input identity and
edits, local errors/retries and unavailable geometry rejection. Hardware devices
and screen readers remain untested, so this adapter is a preview. MIT licence and preserved attribution are in
`LICENSE` and `THIRD_PARTY_NOTICES.md`.
