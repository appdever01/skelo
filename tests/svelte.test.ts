import { mount, unmount, tick, flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Fixture from './fixtures/SvelteRegion.svelte';
import { pending, ready, refreshing, failed } from '../src/core';

describe('Svelte adapter', () => {
  it('isolates pending/error/retry, retains refresh content and rejects unavailable geometry', async () => {
    const root = document.createElement('div'); document.body.append(root);
    const retry = vi.fn(); const report = vi.fn(); const onContent = vi.fn(() => 'rendered');
    const props = { resource: pending<string>(), onRetry: retry, onReport: report, onContent };
    const instance = mount(Fixture, { target: root, props });
    flushSync(); await tick();
    const profile = root.querySelector('input');
    expect(root.querySelector('[aria-label="Activity"]')).toBeNull();
    expect(onContent).not.toHaveBeenCalled();
    expect(root.querySelector('[data-loading-template]')?.hasAttribute('inert')).toBe(true);
    instance.setResource(ready('Activity')); flushSync(); await tick();
    const activity = root.querySelector('[aria-label="Activity"]');
    expect(activity).toBeTruthy();
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(report.mock.calls.some(call => call[0].passed === false)).toBe(true);
    instance.setResource(refreshing('Activity')); flushSync(); await tick();
    expect(root.querySelector('[aria-label="Activity"]')).toBe(activity);
    instance.setResource(failed('offline', 'Activity')); flushSync(); await tick();
    expect(root.querySelector('[aria-label="Activity"]')).toBe(activity);
    instance.setResource(failed('offline')); flushSync(); await tick();
    root.querySelector<HTMLButtonElement>('button')?.click(); expect(retry).toHaveBeenCalledOnce();
    expect(root.querySelector('[aria-label="Profile"]')).toBe(profile);
    await unmount(instance); root.remove();
  });
});
