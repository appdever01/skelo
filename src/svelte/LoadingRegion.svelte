<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import { hasData } from '../core/index.js';
  import type { Resource, LayoutSnapshot, Animation, ScanOptions } from '../types.js';
  import Skeleton from './Skeleton.svelte';
  let { resource, children, id, template, layout, fallback, errorFallback, onRetry,
    label = 'Loading content', refreshLabel = 'Updating content', errorLabel = 'Could not load this content', retryLabel = 'Try again',
    minHeight = 24, animation = 'pulse', scan = {} }: {
    resource: Resource<T>; children: Snippet<[T]>; id?: string; template?: Snippet; layout?: LayoutSnapshot;
    fallback?: Snippet; errorFallback?: Snippet<[unknown]>; onRetry?: () => void;
    label?: string; refreshLabel?: string; errorLabel?: string; retryLabel?: string;
    minHeight?: number | string; animation?: Animation; scan?: ScanOptions;
  } = $props();
  const generatedId = $props.id();
  const busy = $derived(resource.status === 'pending' || resource.status === 'refreshing');
</script>

{#snippet error()}
  {#if errorFallback}{@render errorFallback(resource.status === 'error' ? resource.error : undefined)}
  {:else}<div class="lr-error"><span>{errorLabel}</span>{#if onRetry}<button type="button" onclick={onRetry}>{retryLabel}</button>{/if}</div>{/if}
{/snippet}
<div data-loading-region={id ?? generatedId} data-loading-state={resource.status} aria-busy={busy}>
  <div data-loading-content>
    {#if hasData(resource)}{@render children(resource.data)}
    {:else if resource.status === 'error'}{@render error()}
    {:else if fallback}{@render fallback()}
    {:else}<Skeleton {template} {layout} {animation} {scan} {minHeight} />{/if}
  </div>
  {#if hasData(resource) && resource.status === 'error'}<div role="alert" data-skeleton-ignore>{@render error()}</div>
  {:else if resource.status === 'error'}<span class="lr-sr-only" role="alert" data-skeleton-ignore>{errorLabel}</span>{/if}
</div>
<span class="lr-sr-only" role="status" aria-live="polite" data-skeleton-ignore>{busy ? resource.status === 'refreshing' ? refreshLabel : label : ''}</span>
