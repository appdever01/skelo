# Contributing

Use Node 22.13 or newer and pnpm 11.7. Install with
`pnpm install --frozen-lockfile`, then run `pnpm check` and
`pnpm smoke:package` and `pnpm smoke:packed` before opening a pull request. Tests run with at most two
workers. Flutter changes also require `pnpm check:flutter` with Flutter installed.
The example applications under `examples/` are built by `pnpm check`.
Start the local React example with `pnpm dev`.

Keep resource bindings explicit, do not mount real pending content for
measurement, and never report an incomplete or empty capture as a successful
comparison. Add regression tests for changes to loading transitions or quality
reports. Browser checks should be clearly identified as browser checks;
jsdom results alone cannot prove layout or keyboard behaviour.

Please include the problem, resulting behaviour and checks performed in a pull
request. Preserve upstream attribution when adapting code. This repository
does not contain private instruction files, credentials or internal planning.
