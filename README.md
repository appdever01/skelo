# Skelo

Show grey placeholders while your content loads.

Skelo can build a skeleton from a sample of your layout. You can change its colour and animation, and let different parts of a page load separately.

For example, a profile can appear while the activity feed is still loading.

## How it works

1. Give Skelo a sample of what the content will look like.
2. While data is loading, Skelo uses that sample to draw grey placeholder shapes.
3. When your app says the data is ready, Skelo shows the content.

Your app handles the request. Skelo handles what appears while you wait.

## Install

For React, Next.js, Vue, Svelte or React Native:

```sh
npm install skelo@0.2.1
```

Flutter has a separate preview package:

```sh
flutter pub add skelo:0.2.0-preview.2
```

## Start with React

```jsx
import { LoadingRegion, pending, ready } from 'skelo';
import 'skelo/styles.css';

export function Profile({ loading, name }) {
  return (
    <div className="profile">
      <LoadingRegion
        resource={loading ? pending() : ready(name)}
        template={<h2>Example name</h2>}
        animation="shimmer"
      >
        {value => <h2>{value}</h2>}
      </LoadingRegion>
    </div>
  );
}
```

Here's what each part means:

| Part | What it does |
| --- | --- |
| `pending()` | Shows the loading placeholder. |
| `ready(name)` | Shows the name when it is available. |
| `template` | A sample layout used to create the skeleton. |
| `animation="shimmer"` | Adds a moving highlight to the grey shapes. |

"Example name" is sample text for measuring the placeholder. Use a sample with similar styling and length to the content you expect.

Keep templates simple. They should contain layout and sample content, without requests or other actions.

On the web, the sample is measured after the component appears. Until that measurement is ready, Skelo may show one plain grey block.

## Change the grey colour

Add this to your app's CSS:

```css
.profile .lr-skeleton {
  --lr-base: #d4d4d4;
  --lr-highlight: #ffffff80;
}
```

`--lr-base` controls the skeleton colour. Try `#eeeeee` for a lighter grey or `#aaaaaa` for a darker grey.

`--lr-highlight` controls the moving shimmer highlight.

## Choose an animation

| Setting | Appearance |
| --- | --- |
| `animation="pulse"` | Fades in and out. This is the default. |
| `animation="shimmer"` | A highlight moves across the skeleton. |
| `animation="none"` | Stays still. |

Animations stop when someone's device is set to reduce motion.

## Control depth and shapes

The web depth setting is `scan={{ maxDepth: 16 }}` by default.

Depth means how far Skelo looks inside nested HTML elements. It is a limit on that check. If the limit prevents Skelo from finishing, it uses one plain placeholder.

To deliberately make a skeleton simpler, change the sample layout or use these attributes on its elements:

| What you want | What to use |
| --- | --- |
| Leave an element out | `data-skeleton-ignore` |
| Represent a whole group as one block | `data-skeleton-shape="rect"` |
| Use a circular placeholder | `data-skeleton-shape="circle"` |
| Use three placeholder text lines | `data-skeleton-lines="3"` |

You can also set `minHeight={80}` to reserve at least 80 pixels of space while loading.

## Let each section load separately

Wrap each section in its own `LoadingRegion` and give it its own state.

| State | What happens |
| --- | --- |
| `pending()` | Shows a placeholder. |
| `ready(data)` | Shows the content. |
| `refreshing(data)` | Keeps existing content visible while you fetch an update. |
| `failed(error)` | Shows an error in that section. |

Use `onRetry` to connect the retry button to your request.

This means an activity-feed error can stay inside the feed while the profile remains usable.

If you only need a placeholder, you can use the exported `Skeleton` component directly.

## Check whether the skeleton matches

Skelo also has an optional checker for development.

It compares the placeholder's layout with the finished content and reports differences in size or position, missing shapes and overflow. A measurement that could not finish cannot pass.

These reports help check the layout. They do not prove that the whole interface is accessible or looks correct on every screen.

## Supported frameworks

| Framework | Package entry |
| --- | --- |
| React 18.3 or 19 | `skelo` |
| Next.js 16.4 App Router | `skelo/next` |
| Vue 3.5 | `skelo/vue` |
| Svelte 5.20 or newer | `skelo/svelte` |
| React Native 0.86.3 / Expo 57 | `skelo/native` |
| Flutter | Separate `skelo` package on pub.dev |

The examples above use React on the web. Other frameworks have their own examples.

React Native and Flutter use explicitly marked shapes rather than scanning HTML. Their skeletons are static and have a colour option. Both remain previews: iOS and Android simulator checks have passed, while hardware and screen-reader checks are still pending.

See the [framework examples](https://github.com/appdever01/skelo/tree/main/examples). Nuxt, SvelteKit routes and broader responsive checks remain unverified.

## More guides

- [React API](https://github.com/appdever01/skelo/blob/main/guides/react.md): loading states, providers, templates and customisation.
- [Framework guides](https://github.com/appdever01/skelo/blob/main/guides/frameworks.md): Next.js, Vue, Svelte, React Native/Expo and Flutter.
- [Layout checks and CLI](https://github.com/appdever01/skelo/blob/main/guides/quality.md): comparison options and reports.
- [Development and limits](https://github.com/appdever01/skelo/blob/main/guides/development.md): running the examples, checks and verification limits.
- [Flutter API](https://github.com/appdever01/skelo/blob/main/packages/flutter/guides/api.md): Dart widgets, colour controls and marked shapes.

The JavaScript guides are also included in the npm package's `guides/` folder.

## Licence

[MIT](https://github.com/appdever01/skelo/blob/main/LICENSE), with preserved [third-party notices](https://github.com/appdever01/skelo/blob/main/THIRD_PARTY_NOTICES.md).
