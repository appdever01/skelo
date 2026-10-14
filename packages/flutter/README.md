# Skelo for Flutter

Independent loading regions with retained content during refresh, region errors
and retries, template skeletons and geometry comparisons. This is a Dart package;
Skelo's npm package cannot be used by Flutter. This adapter is a preview.

Install the preview:

```sh
flutter pub add skelo:0.2.0-preview.1
```

```yaml
dependencies:
  skelo: 0.2.0-preview.1
```

```dart
import 'package:flutter/material.dart';
import 'package:skelo/skelo.dart';

Widget activityRegion(Resource<String> resource, VoidCallback retry) {
  return LoadingRegion<String>(
    resource: resource,
    onRetry: retry,
    onReport: (report) => debugPrint('${report.passed}'),
    template: const Geometry(boneKey: 'activity', child: Text('Activity ready')),
    builder: (context, value) => Geometry(boneKey: 'activity', child: Text(value)),
  );
}
```

A complete widget example ships in `example/lib/main.dart`. The
[repository README](https://github.com/appdever01/skelo#flutter) covers the other adapters.

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
this folder. Shared JSON test fixtures ship in `test/fixtures`, so these checks
work from the published archive without a repository checkout. The larger
[repository example](https://github.com/appdever01/skelo/tree/main/examples/flutter)
includes iOS, Android and web hosts, widget checks and a native integration test.
Its web host compiles with `flutter build web`.

Verified with Flutter 3.44.2 / Dart 3.12.2 using widget tests, web compilation
and native integration tests on iOS 26.5 and Android 15 simulators. The native
checks cover measured bounds, matching layouts, retained input identity and
edits, local errors/retries and unavailable geometry rejection. Hardware devices
and screen readers remain untested, so this adapter is a preview. MIT licence and preserved attribution are in
`LICENSE` and `THIRD_PARTY_NOTICES.md`.
