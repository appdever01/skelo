import { createApp, defineComponent, h, shallowRef } from 'vue';
import { LoadingRegion, QualityBoundary, pending, ready, refreshing, failed, type Resource, type QualityReport } from 'skelo/vue';
import 'skelo/styles.css';
createApp(defineComponent({ setup() {
  const profile = shallowRef<Resource<string>>(ready('Alex'));
  const activity = shallowRef<Resource<string>>(pending());
  const report = shallowRef<QualityReport>();
  return () => h('main', [h('h1', 'Skelo in Vue'), h(QualityBoundary, { onReport: (value: QualityReport) => { report.value = value; } }, { default: () => [
    h(LoadingRegion, { id: 'profile', resource: profile.value }, { default: ({ data }: { data: unknown }) => h('input', { 'aria-label': 'Profile name', defaultValue: data }) }),
    h(LoadingRegion, { id: 'activity', resource: activity.value, onRetry: () => { activity.value = ready('Activity ready'); } }, {
      template: () => h('p', { 'data-loading-key': 'activity' }, 'Activity ready'),
      default: ({ data }: { data: unknown }) => h('p', { 'data-loading-key': 'activity' }, String(data)),
    }),
  ] }), h('button', { onClick: () => { activity.value = ready('Activity ready'); } }, 'Load activity'),
  h('button', { onClick: () => { profile.value = refreshing('Alex'); } }, 'Refresh profile'),
  h('button', { onClick: () => { activity.value = failed('offline'); } }, 'Fail activity'),
  h('output', { 'aria-label': 'Quality result' }, report.value ? report.value.passed ? 'Layout passed' : 'Layout needs review' : 'Waiting for comparison'),
  ]);
} })).mount('#app');
