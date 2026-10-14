import 'package:flutter/material.dart';
import 'geometry.dart';
import 'resource.dart';

class _Registry extends InheritedWidget {
  final _MeasuredLayoutState owner;
  const _Registry({required this.owner, required super.child});
  @override
  bool updateShouldNotify(_Registry oldWidget) => oldWidget.owner != owner;
}

class MeasuredLayout extends StatefulWidget {
  final Widget child;
  final ValueChanged<LayoutSnapshot> onSnapshot;
  final bool enabled;
  const MeasuredLayout(
      {super.key,
      required this.child,
      required this.onSnapshot,
      this.enabled = true});
  @override
  State<MeasuredLayout> createState() => _MeasuredLayoutState();
}

class _MeasuredLayoutState extends State<MeasuredLayout> {
  final root = GlobalKey();
  final targets = <_GeometryState>{};
  bool queued = false;
  void schedule() {
    if (queued || !widget.enabled) return;
    queued = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      queued = false;
      if (mounted && widget.enabled) widget.onSnapshot(capture());
    });
  }

  LayoutSnapshot capture() {
    final box = root.currentContext?.findRenderObject();
    if (box is! RenderBox ||
        !box.attached ||
        !box.hasSize ||
        box.size.isEmpty) {
      return const LayoutSnapshot.unavailable();
    }
    final bones = <Bone>[];
    bool complete = targets.isNotEmpty;
    for (final target in targets) {
      final node = target.box.currentContext?.findRenderObject();
      if (node is! RenderBox ||
          !node.attached ||
          !node.hasSize ||
          node.size.isEmpty) {
        complete = false;
        continue;
      }
      final origin = node.localToGlobal(Offset.zero, ancestor: box);
      if (!origin.dx.isFinite || !origin.dy.isFinite) {
        complete = false;
        continue;
      }
      bones.add(Bone(
          key: target.widget.boneKey,
          x: origin.dx,
          y: origin.dy,
          width: node.size.width,
          height: node.size.height,
          radius: target.widget.radius,
          kind: target.widget.kind));
    }
    return LayoutSnapshot(
        width: box.size.width,
        height: box.size.height,
        bones: bones,
        visited: targets.length,
        complete: complete,
        reason: complete ? null : 'measurement-unavailable');
  }

  @override
  Widget build(BuildContext context) {
    schedule();
    return _Registry(
        owner: this,
        child: NotificationListener<SizeChangedLayoutNotification>(
            onNotification: (_) {
              schedule();
              return false;
            },
            child: SizeChangedLayoutNotifier(
                child: SizedBox(key: root, child: widget.child))));
  }
}

class Geometry extends StatefulWidget {
  final String boneKey, kind;
  final double radius;
  final Widget child;
  const Geometry(
      {super.key,
      required this.boneKey,
      required this.child,
      this.radius = 0,
      this.kind = 'rect'});
  @override
  State<Geometry> createState() => _GeometryState();
}

class _GeometryState extends State<Geometry> {
  final box = GlobalKey();
  _MeasuredLayoutState? owner;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final next = context.dependOnInheritedWidgetOfExactType<_Registry>()?.owner;
    if (owner != next) {
      owner?.targets.remove(this);
      owner = next;
      owner?.targets.add(this);
    }
    owner?.schedule();
  }

  @override
  void dispose() {
    owner?.targets.remove(this);
    owner?.schedule();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    owner?.schedule();
    return SizedBox(key: box, child: widget.child);
  }
}

class Skeleton extends StatefulWidget {
  final Widget? template;
  final LayoutSnapshot? layout;
  final double minHeight;
  final Color color;
  const Skeleton(
      {super.key,
      this.template,
      this.layout,
      this.minHeight = 24,
      this.color = const Color(0xffdde1e5)});
  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton> {
  LayoutSnapshot? measured;
  @override
  Widget build(BuildContext context) {
    final snapshot = widget.layout ?? measured;
    if (snapshot != null && !snapshot.valid) {
      throw ArgumentError('Invalid skeleton snapshot.');
    }
    final usable = snapshot != null &&
        snapshot.complete &&
        snapshot.width > 0 &&
        snapshot.height > 0 &&
        snapshot.bones.isNotEmpty;
    return ExcludeSemantics(child: ExcludeFocus(child:
        IgnorePointer(child: LayoutBuilder(builder: (context, constraints) {
      final width = constraints.hasBoundedWidth
          ? constraints.maxWidth
          : snapshot?.width ?? 100;
      final height = widget.layout?.height ??
          (widget.template == null ? widget.minHeight : null);
      return ConstrainedBox(
          constraints: BoxConstraints(minHeight: widget.minHeight),
          child: SizedBox(
              width: width,
              height: height,
              child: Stack(children: [
                if (widget.template != null && widget.layout == null)
                  Opacity(
                      opacity: 0,
                      child: MeasuredLayout(
                          onSnapshot: (next) {
                            if (measured?.toJson().toString() !=
                                next.toJson().toString()) {
                              setState(() {
                                measured = next;
                              });
                            }
                          },
                          child: widget.template!)),
                if (usable)
                  ...snapshot.bones.map((b) => Positioned(
                      left: b.x / snapshot.width * width,
                      top: b.y,
                      width: b.width / snapshot.width * width,
                      height: b.height,
                      child: Geometry(
                          boneKey: b.key,
                          radius: b.radius,
                          kind: b.kind,
                          child: DecoratedBox(
                              decoration: BoxDecoration(
                                  color: widget.color,
                                  borderRadius: BorderRadius.circular(
                                      b.kind == 'circle'
                                          ? b.width / 2
                                          : b.radius))))))
                else
                  Positioned.fill(
                      child: DecoratedBox(
                          decoration: BoxDecoration(
                              color: widget.color,
                              borderRadius: BorderRadius.circular(6)))),
              ])));
    }))));
  }
}

class LoadingRegion<T> extends StatefulWidget {
  final Resource<T> resource;
  final Widget Function(BuildContext, T) builder;
  final Widget? template, fallback;
  final LayoutSnapshot? layout;
  final Widget Function(BuildContext, Object?)? errorBuilder;
  final VoidCallback? onRetry;
  final ValueChanged<QualityReport>? onReport;
  final String id, label, refreshLabel, errorLabel, retryLabel;
  const LoadingRegion(
      {super.key,
      required this.resource,
      required this.builder,
      this.template,
      this.layout,
      this.fallback,
      this.errorBuilder,
      this.onRetry,
      this.onReport,
      this.id = 'region',
      this.label = 'Loading content',
      this.refreshLabel = 'Updating content',
      this.errorLabel = 'Could not load this content',
      this.retryLabel = 'Try again'});
  @override
  State<LoadingRegion<T>> createState() => _LoadingRegionState<T>();
}

class _LoadingRegionState<T> extends State<LoadingRegion<T>> {
  LayoutSnapshot? before;
  bool waiting = false;
  @override
  void initState() {
    super.initState();
    waiting = widget.resource.status == ResourceStatus.pending;
  }

  @override
  void didUpdateWidget(LoadingRegion<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.resource.status == ResourceStatus.pending &&
        oldWidget.resource.status != ResourceStatus.pending) {
      waiting = true;
      before = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final resource = widget.resource;
    final busy = resource.status == ResourceStatus.pending ||
        resource.status == ResourceStatus.refreshing;
    Widget error() =>
        widget.errorBuilder?.call(context, resource.error) ??
        Column(mainAxisSize: MainAxisSize.min, children: [
          Semantics(liveRegion: true, child: Text(widget.errorLabel)),
          if (widget.onRetry != null)
            TextButton(
                onPressed: widget.onRetry, child: Text(widget.retryLabel)),
        ]);
    return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          MeasuredLayout(
              enabled: widget.onReport != null,
              onSnapshot: (snapshot) {
                if (resource.status == ResourceStatus.pending) {
                  before = snapshot;
                  return;
                }
                if (!waiting) return;
                waiting = false;
                if (resource.status == ResourceStatus.error) {
                  widget.onReport?.call(QualityReport(
                      regionId: widget.id,
                      comparable: false,
                      issues: [
                        const QualityIssue('LOAD_FAILED',
                            'Loaded layout could not be checked.')
                      ]));
                } else {
                  widget.onReport?.call(compareLayouts(
                      before ?? const LayoutSnapshot.unavailable(), snapshot,
                      regionId: widget.id));
                }
                before = null;
              },
              child: resource.hasData
                  ? widget.builder(context, resource.data as T)
                  : resource.status == ResourceStatus.error
                      ? error()
                      : widget.fallback ??
                          Skeleton(
                              template: widget.template,
                              layout: widget.layout)),
          if (resource.hasData && resource.status == ResourceStatus.error)
            error(),
          if (busy)
            Semantics(
                liveRegion: true,
                child: Text(resource.status == ResourceStatus.refreshing
                    ? widget.refreshLabel
                    : widget.label)),
        ]);
  }
}
