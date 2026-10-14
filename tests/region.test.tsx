import { StrictMode, useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LoadingProvider, LoadingRegion, Skeleton, pending, ready, refreshing, failed, useLoadingResource, type Resource } from '../src';

describe('independent loading', () => {
  it('reveals one resource while the others remain pending', () => {
    const view = (a: Resource<string>, b: Resource<string>) => <LoadingProvider resources={{ a, b }}>
      <LoadingRegion id="a" needs="a" fallback={<span>Waiting A</span>}>{data => <strong>{String(data.a)}</strong>}</LoadingRegion>
      <LoadingRegion id="b" needs="b" fallback={<span>Waiting B</span>}>{data => <strong>{String(data.b)}</strong>}</LoadingRegion>
    </LoadingProvider>;
    const result = render(view(pending(), pending()));
    result.rerender(view(ready('Profile ready'), pending()));
    expect(screen.getByText('Profile ready')).toBeTruthy();
    expect(screen.getByText('Waiting B')).toBeTruthy();
    expect(result.container.querySelector('[data-loading-region="a"]')?.getAttribute('aria-busy')).toBe('false');
    expect(result.container.querySelector('[data-loading-region="b"]')?.getAttribute('aria-busy')).toBe('true');
  });
  it('never invokes pending render functions or mounts real pending children', () => {
    const renderData = vi.fn(() => { throw new Error('Missing data'); });
    const effect = vi.fn();
    function RealContent() { useEffect(effect, []); return <p>Real data</p>; }
    render(<><LoadingRegion resource={pending()}>{renderData}</LoadingRegion>
      <LoadingRegion resource={pending()}><RealContent /></LoadingRegion></>);
    expect(renderData).not.toHaveBeenCalled();
    expect(effect).not.toHaveBeenCalled();
  });
  it('preserves DOM identity and focus during refresh and stale errors', () => {
    const view = (resource: Resource<string>) => <LoadingRegion resource={resource}>{data => <input aria-label="Name" defaultValue={data} />}</LoadingRegion>;
    const result = render(view(ready('Alex')));
    const input = screen.getByLabelText('Name');
    input.focus();
    result.rerender(view(refreshing('Alex')));
    expect(screen.getByLabelText('Name')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole('status').textContent).toBe('Updating content');
    result.rerender(view(failed('offline', 'Alex')));
    expect(screen.getByLabelText('Name')).toBe(input);
    expect(screen.getByRole('alert').textContent).toContain('Could not load');
  });
  it('confines errors and retries to their region', () => {
    const retry = vi.fn();
    render(<><LoadingRegion resource={ready('Available')}>{data => <p>{data}</p>}</LoadingRegion>
      <LoadingRegion resource={failed('offline')} onRetry={retry}>{() => <p>Unavailable</p>}</LoadingRegion></>);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.queryByText('Unavailable')).toBeNull();
  });
  it('supports falsy ready data, custom errors and localization', () => {
    render(<><LoadingRegion resource={ready(0)}>{data => <span>Count: {data}</span>}</LoadingRegion>
      <LoadingRegion resource={failed('offline')} errorFallback={error => <p>{String(error)}</p>} errorLabel="تعذر التحميل">{null}</LoadingRegion></>);
    expect(screen.getByText('Count: 0')).toBeTruthy();
    expect(screen.getByText('offline')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('تعذر التحميل');
  });
  it('has an accessible, inert first-load template under strict mode', async () => {
    const result = render(<StrictMode><LoadingRegion resource={pending()} template={<button>Fixture button</button>} label="Loading profile"><p>Real profile</p></LoadingRegion></StrictMode>);
    await act(async () => {});
    expect(result.container.querySelector('[data-loading-template]')?.hasAttribute('inert')).toBe(true);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('Real profile')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Loading profile');
    expect(screen.getByRole('status').closest('[aria-busy="true"]')).toBeNull();
    expect(result.container.querySelector('.lr-fallback')).toBeTruthy();
  });
  it('server-renders without accessing layout or real pending data', () => {
    const renderData = vi.fn(() => { throw new Error('Unavailable'); });
    const html = renderToString(<LoadingRegion resource={pending()} template={<button>Fixture</button>}>{renderData}</LoadingRegion>);
    expect(html).toContain('inert=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('lr-fallback');
    expect(renderData).not.toHaveBeenCalled();
  });
  it('supports supplied skeleton geometry during SSR', () => {
    const html = renderToString(<Skeleton animation="none" layout={{ version: 1, width: 100, height: 40, complete: true, visited: 1, durationMs: 0,
      bones: [{ key: 'avatar', x: 0, y: 0, width: 40, height: 40, radius: 20, kind: 'circle' }] }} />);
    expect(html).toContain('data-loading-key="avatar"');
    expect(html).toContain('height:40px');
  });
  it('rejects inherited named bindings in the hook and region', () => {
    function Consumer({ name }: { name: string }) { useLoadingResource(name); return null; }
    for (const name of ['toString', 'constructor', '__proto__']) {
      expect(() => renderToString(<LoadingProvider resources={{}}><Consumer name={name} /></LoadingProvider>)).toThrow('Unknown loading resource');
      expect(() => renderToString(<LoadingProvider resources={{}}><LoadingRegion needs={name}>{null}</LoadingRegion></LoadingProvider>)).toThrow('Unknown loading resource');
    }
  });
});
