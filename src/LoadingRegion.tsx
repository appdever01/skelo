import { createContext, useContext, useId, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { combineResources, hasData } from './resource';
import { Skeleton, type SkeletonProps } from './Skeleton';
import type { Resource, ResourceMap } from './types';

const ResourceContext = createContext<ResourceMap | null>(null);

export function LoadingProvider({ resources, children }: { resources: ResourceMap; children: ReactNode }) {
  return <ResourceContext.Provider value={resources}>{children}</ResourceContext.Provider>;
}

export function useLoadingResource(name: string): Resource<unknown> {
  const resources = useContext(ResourceContext);
  const resource = resources?.[name];
  if (!resources || !Object.prototype.hasOwnProperty.call(resources, name) || !resource) throw new Error(`Unknown loading resource: ${name}. Supply it to LoadingProvider.`);
  return resource;
}

interface RegionOptions<T> extends SkeletonProps {
  id?: string;
  children: ReactNode | ((data: T) => ReactNode);
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  errorFallback?: ReactNode | ((error: unknown) => ReactNode);
  onRetry?: () => void;
  label?: string;
  refreshLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
}

export type LoadingRegionProps<T> = RegionOptions<T> & (
  | { resource: Resource<T>; needs?: never }
  | { needs: string | readonly string[]; resource?: never }
);

export function LoadingRegion<T>(props: RegionOptions<T> & { resource: Resource<T>; needs?: never }): ReactElement;
export function LoadingRegion(props: RegionOptions<Record<string, unknown>> & { needs: string | readonly string[]; resource?: never }): ReactElement;
export function LoadingRegion<T = Record<string, unknown>>({ resource, needs, children, id, className, style,
  template, layout, animation, scan, minHeight, fallback, errorFallback, onRetry,
  label = 'Loading content', refreshLabel = 'Updating content', errorLabel = 'Could not load this content', retryLabel = 'Try again',
}: LoadingRegionProps<T>) {
  const generatedId = useId();
  const resources = useContext(ResourceContext);
  const state = resource ?? (() => {
    if (!resources || !needs) throw new Error('LoadingRegion needs a resource or a LoadingProvider with named resources.');
    return combineResources(resources, typeof needs === 'string' ? [needs] : needs) as Resource<T>;
  })();
  const available = hasData(state);
  const busy = state.status === 'pending' || state.status === 'refreshing';
  const renderContent = (data: T) => typeof children === 'function' ? children(data) : children;
  const error = state.status === 'error' ? state.error : undefined;
  const renderError = () => errorFallback !== undefined
    ? typeof errorFallback === 'function' ? errorFallback(error) : errorFallback
    : <div className="lr-error"><span>{errorLabel}</span>{onRetry ? <button type="button" onClick={onRetry}>{retryLabel}</button> : null}</div>;
  return <><div className={className} style={style} data-loading-region={id ?? generatedId}
    data-loading-state={state.status} aria-busy={busy}>
    <div data-loading-content>
      {available ? renderContent(state.data) : state.status === 'error' ? renderError() : fallback !== undefined ? fallback :
        <Skeleton {...(template !== undefined ? { template } : {})} {...(layout ? { layout } : {})}
          {...(animation ? { animation } : {})} {...(scan ? { scan } : {})} {...(minHeight !== undefined ? { minHeight } : {})} />}
    </div>
    {available && state.status === 'error' ? <div role="alert" data-skeleton-ignore>{renderError()}</div> : null}
    {!available && state.status === 'error' ? <span className="lr-sr-only" role="alert" data-skeleton-ignore>{errorLabel}</span> : null}
  </div>
    <span className="lr-sr-only" role="status" aria-live="polite" data-skeleton-ignore>
      {busy ? state.status === 'refreshing' ? refreshLabel : label : ''}
    </span>
  </>;
}
