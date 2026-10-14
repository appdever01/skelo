# Skelo guides

Start with the [main README](https://github.com/appdever01/skelo#readme).
Use these guides when you need the full API or framework-specific details.

| Guide | What it covers |
| --- | --- |
| [React](react.md) | Loading states, providers, templates, colours, shapes and scan limits. |
| [Layout checks](quality.md) | Comparing layouts, quality reports and the command-line checker. |
| [Frameworks](frameworks.md) | Next.js, Vue, Svelte, React Native/Expo and Flutter. |
| [Development and limits](development.md) | Running examples, package checks and verification limits. |
| [Flutter API](https://github.com/appdever01/skelo/blob/main/packages/flutter/guides/api.md) | Dart widgets, registered shapes, measurements and preview limits. |

## Why Skelo is different

Skelo combines independent loading regions with a quality checker for their
skeletons. Each region can load, refresh or retry on its own, and its loading
layout can be compared with the content that arrives.

- Check the skeleton against the finished layout. Reports identify differences
  in position, size and shape, along with overflow and missing elements.
  Incomplete or unavailable measurements cannot pass.
- Let each part of the interface finish on its own. A profile can stay usable
  while an activity feed loads. Errors and retry controls stay within the
  affected region.
- Keep content mounted during refresh. A form can retain its edits while new
  data loads. If a refresh fails and the resource retains its data, the region
  shows the error alongside the existing content.
- Generate skeletons from a separate template or saved geometry. Skelo never
  mounts pending children or calls their render functions for measurement.
  Templates must be free of side effects; saved geometry can also provide
  skeletons during server rendering.

Skelo has adapters for React, Next.js, Vue and Svelte, plus React Native/Expo
and a separate Dart package for Flutter. The native and Flutter adapters have
passed iOS and Android simulator checks and remain previews pending hardware
and screen-reader checks. See the [platform support table](frameworks.md#platforms-and-installation) for
verification details and limits.

The npm package is named `skelo` and preserves the original React API.
Flutter uses a separate `skelo` Dart package, released as `0.2.0-preview.2`.
