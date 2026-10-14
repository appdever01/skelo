<script lang="ts">
  import { LoadingRegion, QualityBoundary, pending, ready, refreshing, failed, type Resource, type QualityReport } from 'react-loading-regions/svelte';
  let profile = $state<Resource<string>>(ready('Alex'));
  let activity = $state<Resource<string>>(pending());
  let report = $state<QualityReport>();
</script>
<main><h1>Skelo in Svelte</h1>
  <QualityBoundary onReport={value => { report = value; }}>
    <LoadingRegion id="profile" resource={profile}>
      {#snippet children(name)}<input aria-label="Profile name" value={name} />{/snippet}
    </LoadingRegion>
    <LoadingRegion id="activity" resource={activity} onRetry={() => { activity = ready('Activity ready'); }}>
      {#snippet template()}<p data-loading-key="activity">Activity ready</p>{/snippet}
      {#snippet children(value)}<p data-loading-key="activity">{value}</p>{/snippet}
    </LoadingRegion>
  </QualityBoundary>
  <button onclick={() => { activity = ready('Activity ready'); }}>Load activity</button>
  <button onclick={() => { profile = refreshing('Alex'); }}>Refresh profile</button>
  <button onclick={() => { activity = failed('offline'); }}>Fail activity</button>
  <output aria-label="Quality result">{report ? report.passed ? 'Layout passed' : 'Layout needs review' : 'Waiting for comparison'}</output>
</main>
