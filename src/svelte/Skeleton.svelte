<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { isLayoutSnapshot } from '../core/index.js';
  import type { Animation, LayoutSnapshot, ScanOptions } from '../types.js';
  import { observeLayout } from '../web/observe.js';
  let { template, layout, animation = 'pulse', scan = {}, minHeight = 24 }: {
    template?: Snippet; layout?: LayoutSnapshot; animation?: Animation; scan?: ScanOptions; minHeight?: number | string;
  } = $props();
  let root = $state<HTMLDivElement>();
  let measured = $state<LayoutSnapshot>();
  let mounted = $state(false);
  onMount(() => { mounted = true; });
  $effect(() => {
    if (!mounted || layout || !root) return;
    return observeLayout(root, scan, next => {
      measured = next;
    });
  });
  const effective = $derived(layout ?? measured);
  const usable = $derived(effective && effective.complete && effective.width > 0 && effective.height > 0 && effective.bones.length > 0);
  const valid = $derived(!layout || isLayoutSnapshot(layout));
</script>

{#if !valid}
  {@const invalid = (() => { throw new Error('Skeleton layout must be a valid version 1 snapshot.'); })()}
  {invalid}
{/if}
<div class="lr-skeleton" aria-hidden="true"
  data-loading-capture={effective && !effective.complete ? 'incomplete' : usable ? 'measured' : template || layout ? 'unmeasured' : 'fallback'}
  data-loading-capture-reason={effective?.reason}
  style:min-height={typeof minHeight === 'number' ? `${minHeight}px` : minHeight}
  style:height={layout ? `${layout.height}px` : undefined}>
  {#if template && !layout}<div bind:this={root} class="lr-template" data-loading-template inert>{@render template()}</div>{/if}
  {#if usable && effective}
    <div class="lr-overlay" data-loading-overlay>
      {#each effective.bones as bone, i (`${bone.key}:${i}`)}
        <span class="lr-bone lr-{animation}" data-loading-key={bone.key} data-skeleton-shape={bone.kind}
          style:left={`${bone.x / effective.width * 100}%`} style:top={`${bone.y}px`}
          style:width={`${bone.width / effective.width * 100}%`} style:height={`${bone.height}px`}
          style:border-radius={bone.kind === 'circle' ? '50%' : `${bone.radius}px`}></span>
      {/each}
    </div>
  {:else}<div class="lr-bone lr-fallback lr-{animation}" data-loading-key="fallback"></div>{/if}
</div>
