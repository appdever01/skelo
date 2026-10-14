class Bone {
  final String key;
  final double x, y, width, height, radius;
  final String kind;
  const Bone(
      {required this.key,
      required this.x,
      required this.y,
      required this.width,
      required this.height,
      this.radius = 0,
      this.kind = 'rect'});

  factory Bone.fromJson(Map<String, dynamic> json) => Bone(
      key: json['key'] as String,
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
      width: (json['width'] as num).toDouble(),
      height: (json['height'] as num).toDouble(),
      radius: (json['radius'] as num).toDouble(),
      kind: json['kind'] as String);
  Map<String, dynamic> toJson() => {
        'key': key,
        'x': x,
        'y': y,
        'width': width,
        'height': height,
        'radius': radius,
        'kind': kind
      };
  bool get valid =>
      key.isNotEmpty &&
      [x, y, width, height, radius].every((n) => n.isFinite) &&
      width > 0 &&
      height > 0 &&
      radius >= 0 &&
      ['rect', 'circle'].contains(kind);
}

class LayoutSnapshot {
  final int version, visited;
  final double width, height, durationMs;
  final List<Bone> bones;
  final bool complete;
  final String? reason;
  const LayoutSnapshot(
      {this.version = 1,
      required this.width,
      required this.height,
      required this.bones,
      required this.complete,
      this.visited = 0,
      this.durationMs = 0,
      this.reason});
  const LayoutSnapshot.unavailable()
      : version = 1,
        width = 0,
        height = 0,
        bones = const [],
        complete = false,
        visited = 0,
        durationMs = 0,
        reason = 'measurement-unavailable';

  factory LayoutSnapshot.fromJson(Map<String, dynamic> json) {
    final snapshot = LayoutSnapshot(
        version: json['version'] as int,
        width: (json['width'] as num).toDouble(),
        height: (json['height'] as num).toDouble(),
        bones: (json['bones'] as List)
            .map((b) => Bone.fromJson(Map<String, dynamic>.from(b as Map)))
            .toList(),
        complete: json['complete'] as bool,
        visited: json['visited'] as int,
        durationMs: (json['durationMs'] as num).toDouble(),
        reason: json['reason'] as String?);
    if (!snapshot.valid) throw const FormatException('Invalid Skelo snapshot');
    return snapshot;
  }
  Map<String, dynamic> toJson() => {
        'version': version,
        'width': width,
        'height': height,
        'bones': bones.map((b) => b.toJson()).toList(),
        'complete': complete,
        'visited': visited,
        'durationMs': durationMs,
        if (reason != null) 'reason': reason
      };
  bool get valid =>
      version == 1 &&
      [width, height, durationMs].every((n) => n.isFinite && n >= 0) &&
      visited >= 0 &&
      bones.every((b) => b.valid) &&
      (reason == null ||
          (!complete &&
              [
                'max-depth',
                'max-elements',
                'max-time',
                'measurement-unavailable'
              ].contains(reason)));
}

class QualityIssue {
  final String code, message;
  final String? key;
  const QualityIssue(this.code, this.message, [this.key]);
}

class QualityReport {
  final String regionId;
  final bool comparable;
  final List<QualityIssue> issues;
  final double maxDriftPx;
  bool get passed => comparable && issues.isEmpty;
  const QualityReport(
      {required this.regionId,
      required this.comparable,
      required this.issues,
      this.maxDriftPx = 0});
}

QualityReport compareLayouts(
  LayoutSnapshot expected,
  LayoutSnapshot actual, {
  String regionId = 'region',
  double tolerancePx = 8,
  double heightTolerancePx = 8,
  double widthTolerancePx = 2,
  double overflowTolerancePx = 2,
  bool checkUnexpected = true,
}) {
  if ([tolerancePx, heightTolerancePx, widthTolerancePx, overflowTolerancePx]
      .any((n) => !n.isFinite || n < 0)) {
    throw ArgumentError('Tolerances must be finite and non-negative.');
  }
  final issues = <QualityIssue>[];
  bool comparable = true;
  void reject(String code, String message) {
    comparable = false;
    issues.add(QualityIssue(code, message));
  }

  if (!expected.valid || !actual.valid) {
    return QualityReport(regionId: regionId, comparable: false, issues: [
      const QualityIssue('INVALID_SNAPSHOT', 'Invalid geometry or metadata.')
    ]);
  }
  if (!expected.complete || !actual.complete) {
    reject('INCOMPLETE_CAPTURE', 'Capture is incomplete or unavailable.');
  }
  if (expected.bones.isEmpty ||
      actual.bones.isEmpty ||
      expected.width <= 0 ||
      expected.height <= 0 ||
      actual.width <= 0 ||
      actual.height <= 0) {
    reject('NO_GEOMETRY', 'Both states need visible non-zero geometry.');
  }
  if ((expected.width - actual.width).abs() > widthTolerancePx) {
    reject('WIDTH_CHANGED', 'Capture both states at the same width.');
  }
  for (final snapshot in [expected, actual]) {
    final keys = <String>{};
    for (final bone in snapshot.bones) {
      if (!keys.add(bone.key)) {
        reject('DUPLICATE_KEY', 'Duplicate geometry key.');
      }
      if (bone.x < -overflowTolerancePx ||
          bone.y < -overflowTolerancePx ||
          bone.x + bone.width > snapshot.width + overflowTolerancePx ||
          bone.y + bone.height > snapshot.height + overflowTolerancePx) {
        issues.add(QualityIssue(
            'OVERFLOW', 'Geometry extends beyond the region.', bone.key));
      }
    }
  }
  double maxDrift = 0;
  if (comparable) {
    if ((expected.height - actual.height).abs() > heightTolerancePx) {
      issues
          .add(const QualityIssue('CONTAINER_DRIFT', 'Region height changed.'));
    }
    final byKey = {for (final b in actual.bones) b.key: b};
    for (final b in expected.bones) {
      final next = byKey[b.key];
      if (next == null) {
        issues.add(
            QualityIssue('MISSING_BONE', 'No matching loaded element.', b.key));
        continue;
      }
      final delta = [
        (b.x - next.x).abs(),
        (b.y - next.y).abs(),
        (b.width - next.width).abs(),
        (b.height - next.height).abs(),
        (b.radius - next.radius).abs()
      ].reduce((a, b) => a > b ? a : b);
      if (delta > maxDrift) maxDrift = delta;
      if (delta > tolerancePx || b.kind != next.kind) {
        issues.add(QualityIssue(
            'BONE_DRIFT', 'Placeholder and content differ.', b.key));
      }
    }
    if (checkUnexpected) {
      final keys = expected.bones.map((b) => b.key).toSet();
      for (final b in actual.bones) {
        if (!keys.contains(b.key)) {
          issues.add(QualityIssue(
              'UNEXPECTED_BONE', 'No matching placeholder.', b.key));
        }
      }
    }
  }
  return QualityReport(
      regionId: regionId,
      comparable: comparable,
      issues: issues,
      maxDriftPx: maxDrift);
}
