import { describe, expect, it } from 'vitest';
import { pending, ready, refreshing, failed, combineResources, fromQuery, fromSWR, hasData } from '../src/resource';

describe('resource states', () => {
  it('distinguishes missing data from ready falsy values', () => {
    for (const value of [undefined, null, false, 0, '']) {
      expect(hasData(ready(value))).toBe(true);
      expect(hasData(failed('offline', value))).toBe(true);
    }
    expect(hasData(pending())).toBe(false);
    expect(hasData(failed('offline'))).toBe(false);
  });
  it('combines only the resources a region needs', () => {
    const resources = { profile: ready('Alex'), posts: pending(), count: refreshing(0) };
    expect(combineResources(resources, ['profile']).status).toBe('ready');
    expect(combineResources(resources, ['profile', 'count'])).toEqual({ status: 'refreshing', data: { profile: 'Alex', count: 0 } });
    expect(combineResources(resources, ['posts', 'count']).status).toBe('pending');
  });
  it('keeps stale data on errors and fails a dependency without a value', () => {
    expect(combineResources({ a: failed(null, 0), b: ready(false) }, ['a', 'b'])).toEqual({ status: 'error', error: null, data: { a: 0, b: false } });
    expect(combineResources({ a: failed('offline'), b: ready(1) }, ['a', 'b'])).toEqual({ status: 'error', error: 'offline' });
  });
  it('rejects missing bindings and preserves dangerous-looking names as plain data', () => {
    expect(() => combineResources({}, [])).toThrow('at least one');
    expect(() => combineResources({}, ['missing'])).toThrow('Unknown');
    for (const key of ['toString', 'constructor', '__proto__']) expect(() => combineResources({}, [key])).toThrow('Unknown');
    const resources = Object.fromEntries([['__proto__', ready('safe')]]);
    expect(combineResources(resources, ['__proto__']).data?.['__proto__']).toBe('safe');
  });
});

describe('query adapters', () => {
  it('handles initial, ready, refresh, failure and stale failure query states', () => {
    expect(fromQuery({ data: undefined, status: 'pending' })).toEqual(pending());
    expect(fromQuery({ data: undefined, status: 'success' })).toEqual(ready(undefined));
    expect(fromQuery({ data: 0, isFetching: true })).toEqual(refreshing(0));
    expect(fromQuery({ data: undefined, isError: true, error: 'offline' })).toEqual(failed('offline'));
    expect(fromQuery({ data: false, isError: true, error: 'offline' })).toEqual(failed('offline', false));
    expect(fromQuery({ data: undefined, isLoading: false })).toEqual(pending());
  });
  it('handles SWR revalidation, falsy data and errors', () => {
    expect(fromSWR({ data: undefined, isLoading: true })).toEqual(pending());
    expect(fromSWR({ data: false })).toEqual(ready(false));
    expect(fromSWR({ data: 0, isValidating: true })).toEqual(refreshing(0));
    expect(fromSWR({ data: undefined, error: 'offline' })).toEqual(failed('offline'));
    expect(fromSWR({ data: '', error: 'offline' })).toEqual(failed('offline', ''));
  });
});
