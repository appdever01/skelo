import type { Resource, ResourceMap } from './types';

export function pending<T = never>(): Resource<T> {
  return { status: 'pending' };
}

export function ready<T>(data: T): Resource<T> {
  return { status: 'ready', data };
}

export function refreshing<T>(data: T): Resource<T> {
  return { status: 'refreshing', data };
}

export function failed<T = never>(error: unknown, ...data: [] | [T]): Resource<T> {
  return data.length ? { status: 'error', error, data: data[0] as T } : { status: 'error', error };
}

export function hasData<T>(resource: Resource<T>): resource is Resource<T> & { data: T } {
  return resource.status !== 'pending' && Object.prototype.hasOwnProperty.call(resource, 'data');
}

export function combineResources(resources: ResourceMap, needs: readonly string[]): Resource<Record<string, unknown>> {
  if (needs.length === 0) throw new Error('A loading region needs at least one resource.');
  const data: Record<string, unknown> = Object.create(null);
  let waiting = false;
  let updating = false;
  let hasError = false;
  let error: unknown;
  for (const name of needs) {
    const resource = resources[name];
    if (!Object.prototype.hasOwnProperty.call(resources, name) || !resource) throw new Error(`Unknown loading resource: ${name}`);
    if (hasData(resource)) data[name] = resource.data;
    else waiting = true;
    updating ||= resource.status === 'refreshing';
    if (resource.status === 'error' && !hasError) {
      hasError = true;
      error = resource.error;
    }
  }
  if (hasError) return waiting ? failed(error) : failed(error, data);
  if (waiting) return pending();
  return updating ? refreshing(data) : ready(data);
}

export interface QueryState<T> {
  data: T | undefined;
  status?: 'pending' | 'error' | 'success';
  isPending?: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  error?: unknown;
}

export function fromQuery<T>(query: QueryState<T>): Resource<T> {
  const available = query.data !== undefined || query.status === 'success';
  if (query.isError || query.status === 'error') {
    return available ? failed(query.error, query.data as T) : failed(query.error);
  }
  if (query.isPending || query.status === 'pending' || (!available && query.isLoading !== false)) return pending();
  if (!available) return pending();
  return query.isFetching ? refreshing(query.data as T) : ready(query.data as T);
}

export interface SWRState<T> {
  data: T | undefined;
  error?: unknown;
  isLoading?: boolean;
  isValidating?: boolean;
}

export function fromSWR<T>(query: SWRState<T>): Resource<T> {
  if (query.error !== undefined) return query.data === undefined ? failed(query.error) : failed(query.error, query.data);
  if (query.data === undefined) return pending();
  return query.isValidating ? refreshing(query.data) : ready(query.data);
}
