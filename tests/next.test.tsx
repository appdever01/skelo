import { act, useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LoadingRegion } from '../src/next';
import { pending, ready, type Resource } from '../src/core';

describe('Next client adapter SSR and hydration', () => {
  it.each(['pending', 'ready'] as const)('hydrates %s markup without recoverable errors', async status => {
    const mounts = vi.fn();
    function Child() { useEffect(mounts, []); return <input aria-label="Hydrated input" defaultValue="Alex" />; }
    const state: Resource<string> = status === 'ready' ? ready('Alex') : pending();
    const app = <LoadingRegion resource={state} template={<p>Fixture</p>}><Child /></LoadingRegion>;
    const root = document.createElement('div');
    root.innerHTML = renderToString(app); document.body.append(root);
    const before = root.firstElementChild;
    const content = root.querySelector('[data-loading-template], input');
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const errors = vi.fn();
    let hydrated: ReturnType<typeof hydrateRoot>;
    await act(async () => { hydrated = hydrateRoot(root, app, { onRecoverableError: errors }); });
    expect(errors).not.toHaveBeenCalled();
    expect(root.firstElementChild).toBe(before);
    expect(root.querySelector('[data-loading-template], input')).toBe(content);
    expect(mounts).toHaveBeenCalledTimes(status === 'ready' ? 1 : 0);
    await act(async () => { hydrated.unmount(); }); root.remove();
  });
});
