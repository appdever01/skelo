'use client';
import { useState } from 'react';
import { LoadingRegion, QualityBoundary } from 'skelo/next';
import { pending, ready, refreshing, failed, type Resource, type QualityReport } from 'skelo/core';
export default function ClientDemo({ initialName }: { initialName: string }) {
  const [profile, setProfile] = useState<Resource<string>>(ready(initialName));
  const [activity, setActivity] = useState<Resource<string>>(pending());
  const [report, setReport] = useState<QualityReport>();
  return <><QualityBoundary onReport={setReport}>
    <LoadingRegion id="profile" resource={profile}>{name => <input aria-label="Profile name" defaultValue={name} />}</LoadingRegion>
    <LoadingRegion id="activity" resource={activity} onRetry={() => setActivity(ready('Activity ready'))} template={<p data-loading-key="activity">Activity ready</p>}>
      {value => <p data-loading-key="activity">{value}</p>}
    </LoadingRegion>
  </QualityBoundary>
    <button onClick={() => setActivity(ready('Activity ready'))}>Load activity</button>
    <button onClick={() => setProfile(refreshing(initialName))}>Refresh profile</button>
    <button onClick={() => setActivity(failed('offline'))}>Fail activity</button>
    <output aria-label="Quality result">{report ? report.passed ? 'Layout passed' : 'Layout needs review' : 'Waiting for comparison'}</output>
  </>;
}
