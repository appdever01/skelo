import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoadingRegion, pending, ready } from '../src';
import { QualityBoundary } from '../src/quality/react';

describe('quality boundary integration', () => {
  it('observes completion and reports unmeasured layout honestly', async () => {
    const onReport = vi.fn();
    const view = (loading: boolean) => <QualityBoundary onReport={onReport}>
      <LoadingRegion id="identity" resource={loading ? pending() : ready('Alex')} fallback={<p>Waiting</p>}>{name => <p>{name}</p>}</LoadingRegion>
    </QualityBoundary>;
    const result = render(view(true));
    result.rerender(view(false));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(onReport).toHaveBeenCalledOnce();
    expect(onReport.mock.calls[0]?.[0].passed).toBe(false);
    expect(onReport.mock.calls[0]?.[0].issues.some((i: { code: string }) => i.code === 'NO_GEOMETRY')).toBe(true);
    result.unmount();
  });
  it('does no measurements when disabled', async () => {
    const onReport = vi.fn();
    render(<QualityBoundary enabled={false} onReport={onReport}><LoadingRegion resource={ready('Alex')}>{name => <p>{name}</p>}</LoadingRegion></QualityBoundary>);
    await act(async () => {});
    expect(onReport).not.toHaveBeenCalled();
  });
  it('keeps pending captures across equivalent inline options', async () => {
    const onReport = vi.fn();
    const view = (loading: boolean) => <QualityBoundary options={{ tolerancePx: 8 }} onReport={onReport}>
      <LoadingRegion id="profile" resource={loading ? pending() : ready('Alex')} fallback={<p>Waiting</p>}>{name => <p>{name}</p>}</LoadingRegion>
    </QualityBoundary>;
    const result = render(view(true));
    result.rerender(view(false));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(onReport).toHaveBeenCalledOnce();
    expect(onReport.mock.calls[0]?.[0].regionId).toBe('profile');
  });
});
