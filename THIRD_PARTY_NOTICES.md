# Third-party notices

The DOM scanner in `src/scan.ts` adapts radius, circle-classification and text-line
inference code from [Riaz Ahmed's auto-skeleton](https://github.com/riazzahmedm/react-auto-skeleton),
commit `7746545c3f72d0764008a6d87f20886810f34515`, inspected on 2026-10-14.
The scanner has been extended with bounded traversal, stable geometry keys,
native text-range measurement and incomplete-capture reporting. Its original
MIT notice is included below and ships in the package.

Also inspected for this first version:

| Project | Inspected commit | Use |
| --- | --- | --- |
| [ShanukJ/auto-skeleton](https://github.com/ShanukJ/auto-skeleton) | `b2fadacd31413670177243fde0c90a42cf4fc6bd` | Studied depth controls, DOM measurement and inference; no code copied. |
| [mirzaibtisam41/react-auto-skeleton-loader](https://github.com/mirzaibtisam41/react-auto-skeleton-loader) | `c4d6dfc61b5c0b8934746bae13a28ebced23985b` | Studied recursive JSX transformation; no code copied. Package declares ISC but has no separate licence file in this checkout. |
| [0xGF/boneyard](https://github.com/0xGF/boneyard) | `b7597f527aa641a84c8432230e7a874b66f1ba40` | Studied fixture captures, responsive selection and separate skeleton geometry; no code copied. |

The partial-loading state model, region API, quality comparisons, React quality
boundary and command-line checker are new implementations in this repository.

## Riaz Ahmed / auto-skeleton — MIT

MIT License

Copyright (c) 2026 Riaz Ahmed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
