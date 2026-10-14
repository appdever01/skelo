enum ResourceStatus { pending, ready, refreshing, error }

class Resource<T> {
  final ResourceStatus status;
  final T? data;
  final Object? error;
  final bool hasData;

  const Resource.pending()
      : status = ResourceStatus.pending,
        data = null,
        error = null,
        hasData = false;
  const Resource.ready(T value)
      : status = ResourceStatus.ready,
        data = value,
        error = null,
        hasData = true;
  const Resource.refreshing(T value)
      : status = ResourceStatus.refreshing,
        data = value,
        error = null,
        hasData = true;
  const Resource.failed(this.error)
      : status = ResourceStatus.error,
        data = null,
        hasData = false;
  const Resource.stale(this.error, T value)
      : status = ResourceStatus.error,
        data = value,
        hasData = true;
}
