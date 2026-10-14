# Skelo for Flutter

Show grey placeholders while your content loads.

Skelo builds placeholder shapes from the widgets you mark in a sample layout. Each part of your screen can load separately, so a profile can appear while the activity feed is still loading.

This Flutter package is a preview. Its skeletons are static; their colour and size can be changed.

## Install

```sh
flutter pub add skelo:0.2.0-preview.2
```

## Start with one section

```dart
import 'package:flutter/material.dart';
import 'package:skelo/skelo.dart';

Widget profile(bool loading, String name) {
  return LoadingRegion<String>(
    resource: loading
        ? const Resource<String>.pending()
        : Resource<String>.ready(name),
    template: const Geometry(
      boneKey: 'name',
      child: Text('Example name'),
    ),
    builder: (context, value) => Geometry(
      boneKey: 'name',
      child: Text(value),
    ),
  );
}
```

Your app supplies `loading` and `name`. While `loading` is true, Skelo shows the placeholder. When it becomes false, Skelo shows the name.

| Part | What it does |
| --- | --- |
| `Resource.pending()` | Shows the loading placeholder. |
| `Resource.ready(name)` | Shows the name when it is available. |
| `template` | A sample layout used to create the skeleton. |
| `Geometry` | Marks a widget that should become a placeholder shape. |
| `boneKey` | Gives the shape a name. Match it in the sample and loaded content. |

"Example name" is sample text for measuring the placeholder. Keep templates simple, with no requests or other actions. The first frame may show a plain block while the marked widgets are measured.

## Change the grey colour

Use `Skeleton` when you want your own placeholder:

```dart
const Skeleton(
  color: Color(0xffd4d4d4),
  minHeight: 80,
  template: Geometry(
    boneKey: 'name',
    child: Text('Example name'),
  ),
)
```

Try `Color(0xffeeeeee)` for a lighter grey or `Color(0xffaaaaaa)` for a darker grey. `minHeight` reserves at least 80 logical pixels of space.

To use this placeholder inside a `LoadingRegion`, pass it as `fallback`. The [Flutter API guide](https://github.com/appdever01/skelo/blob/main/packages/flutter/guides/api.md#skeleton-appearance) shows a complete example.

## Control the shapes

Wrap each widget you want turned into a placeholder in `Geometry`. To make a simpler skeleton, mark a larger group as one shape instead of marking every small widget.

Use `radius` on `Geometry` to set rounded corners. Flutter uses the widgets you mark, so it has no HTML scan-depth setting. The web package's pulse and shimmer animations do not apply here.

## Let each section load separately

Give each `LoadingRegion` its own state:

| State | What happens |
| --- | --- |
| `Resource.pending()` | Shows a placeholder. |
| `Resource.ready(data)` | Shows the content. |
| `Resource.refreshing(data)` | Keeps existing content visible while you fetch an update. |
| `Resource.failed(error)` | Shows an error in that section. |
| `Resource.stale(error, data)` | Shows the error alongside the existing content. |

Use `onRetry` to connect the retry button to your request. Your app handles fetching the data.

## Check whether the skeleton matches

The optional `onReport` callback compares the marked placeholder shapes with the marked loaded content. It can report moved, resized or missing shapes. Incomplete or unavailable measurements cannot pass.

These reports check layout. They do not certify accessibility or check widgets that you did not mark with `Geometry`.

## Examples and guides

A complete widget example ships in `example/lib/main.dart`. The detailed reference ships in `guides/api.md`.

- [Flutter API guide](https://github.com/appdever01/skelo/blob/main/packages/flutter/guides/api.md): widgets, colour controls, measurements and the pure Dart core.
- [Runnable Flutter app](https://github.com/appdever01/skelo/tree/main/examples/flutter): iOS, Android and web examples.
- [Other frameworks](https://github.com/appdever01/skelo/blob/main/guides/frameworks.md): JavaScript adapters use the separate npm package.

## Preview limits

Widget tests, web builds and iOS/Android simulator workflows have passed with Flutter 3.44.2 / Dart 3.12.2. Hardware devices and screen readers remain untested, so this package remains a preview.

## Licence

[MIT](https://github.com/appdever01/skelo/blob/main/packages/flutter/LICENSE), with preserved [third-party notices](https://github.com/appdever01/skelo/blob/main/packages/flutter/THIRD_PARTY_NOTICES.md).
