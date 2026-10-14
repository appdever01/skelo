<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { observeQuality } from '../web/observe.js';
  import type { CheckerOptions } from '../quality/checker.js';
  import type { QualityReport } from '../core/index.js';
  let { children, onReport, options = {}, enabled = true }: {
    children: Snippet; onReport: (report: QualityReport) => void; options?: CheckerOptions; enabled?: boolean;
  } = $props();
  let root: HTMLDivElement;
  let mounted = $state(false);
  onMount(() => { mounted = true; });
  const optionsKey = $derived(JSON.stringify(options));
  $effect(() => {
    if (!mounted || !enabled || !root) return;
    return observeQuality(root, JSON.parse(optionsKey), report => onReport(report));
  });
</script>
<div bind:this={root} data-loading-quality>{@render children()}</div>
