<script lang="ts">
  import { LoadingRegion, QualityBoundary } from '../../src/svelte';
  import { ready, type Resource, type QualityReport } from '../../src/core';
  let { resource, onRetry, onReport, onContent }: { resource: Resource<string>; onContent: () => string; onRetry: () => void; onReport: (report: QualityReport) => void } = $props();
  export function setResource(next: Resource<string>) { resource = next; }
</script>
<QualityBoundary {onReport}>
  <LoadingRegion resource={ready('Alex')} id="profile">{#snippet children(value)}<input aria-label="Profile" value={value} />{/snippet}</LoadingRegion>
  <LoadingRegion {resource} id="activity" {onRetry}>
    {#snippet template()}<p data-loading-key="activity">Fixture</p>{/snippet}
    {#snippet children(value)}<input aria-label="Activity" value={value} data-content-check={onContent()} />{/snippet}
  </LoadingRegion>
</QualityBoundary>
