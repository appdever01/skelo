import { createApp, defineComponent, h, nextTick, shallowRef, type Component } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoadingRegion, QualityBoundary, Skeleton, pending, ready, refreshing, failed, type Resource } from '../src/vue';

const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach(fn => fn()));
function mount(component: Component) {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(component);
  app.mount(root);
  cleanups.push(() => { app.unmount(); root.remove(); });
  return root;
}

describe('Vue adapter', () => {
  it('starts measurement when a template is supplied after mount', async () => {
    const show = shallowRef(false);
    const root = mount(defineComponent(() => () => h(Skeleton, { scan: { maxElements: 0 } },
      show.value ? { template: () => h('p', 'Fixture') } : {})));
    expect(root.querySelector('[data-loading-capture]')?.getAttribute('data-loading-capture')).toBe('fallback');
    show.value = true;
    await nextTick(); await nextTick();
    expect(root.querySelector('[data-loading-capture]')?.getAttribute('data-loading-capture')).toBe('incomplete');
  });
  it('loads independently, never invokes pending slots and preserves refreshed content', async () => {
    const a = shallowRef<Resource<string>>(pending());
    const b = shallowRef<Resource<string>>(pending());
    const pendingSlot = vi.fn(() => h('p', 'B content'));
    const retry = vi.fn();
    const root = mount(defineComponent(() => () => h('main', [
      h(LoadingRegion, { resource: a.value, id: 'a' }, { default: () => h('input', { defaultValue: 'Alex' }) }),
      h(LoadingRegion, { resource: b.value, id: 'b', onRetry: retry }, { default: pendingSlot }),
    ])));
    expect(pendingSlot).not.toHaveBeenCalled();
    a.value = ready('Alex'); await nextTick();
    const input = root.querySelector('input');
    input?.focus();
    if (input) input.value = 'Edited';
    expect(root.querySelector('[data-loading-region="b"]')?.getAttribute('aria-busy')).toBe('true');
    a.value = refreshing('Alex'); await nextTick();
    expect(root.querySelector('input')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input?.value).toBe('Edited');
    a.value = failed('offline', 'Alex'); b.value = failed('offline'); await nextTick();
    expect(root.querySelector('input')).toBe(input);
    root.querySelector<HTMLElement>('[data-loading-region="b"] button')?.click();
    expect(retry).toHaveBeenCalledOnce();
    expect(pendingSlot).not.toHaveBeenCalled();
    b.value = ready('B'); await nextTick();
    expect(root.textContent).toContain('B content');
  });
  it('server renders inert templates and ready falsy values', async () => {
    const actual = vi.fn(() => h('p', 'Must not render'));
    const html = await renderToString(createApp({ render: () => h(LoadingRegion, { resource: pending() }, {
      template: () => h('button', 'Fixture'), default: actual,
    }) }));
    expect(html).toContain('inert'); expect(actual).not.toHaveBeenCalled();
    const readyHtml = await renderToString(createApp({ render: () => h(LoadingRegion, { resource: ready(0) }, { default: ({ data }: { data: unknown }) => h('p', `Count ${data}`) }) }));
    expect(readyHtml).toContain('Count 0');
  });
  it('reports unmeasured quality as a failure', async () => {
    const state = shallowRef<Resource<string>>(pending());
    const report = vi.fn();
    mount(defineComponent(() => () => h(QualityBoundary, { onReport: report }, { default: () => h(LoadingRegion, { resource: state.value }, { default: () => h('p', 'Ready') }) })));
    state.value = ready('Alex'); await nextTick();
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(report).toHaveBeenCalledOnce();
    expect(report.mock.calls[0]?.[0].passed).toBe(false);
  });
});
