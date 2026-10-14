import type { Component } from 'svelte';
import type { Resource, QualityReport } from '../../src/core';
declare const component: Component<{ resource: Resource<string>; onContent: () => string; onRetry: () => void; onReport: (report: QualityReport) => void }, { setResource: (resource: Resource<string>) => void }>;
export default component;
