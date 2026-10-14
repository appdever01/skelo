import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:skelo/skelo.dart';
import 'package:skelo_example/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets(
      'native geometry, independent loading, refresh identity and local retry',
      (tester) async {
    final reports = <QualityReport>[];
    final measurements = <LayoutSnapshot>[];
    await tester.pumpWidget(MaterialApp(
        home: Demo(onReport: reports.add, onMeasurement: measurements.add)));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('activity-loaded')), findsNothing);
    expect(find.text('Activity: pending'), findsOneWidget);
    final capture = measurements.last;
    expect(capture.complete, isTrue);
    final probe = capture.bones.single;
    expect(probe.key, 'probe');
    expect(probe.x, closeTo(8, 1));
    expect(probe.y, closeTo(8, 1));
    expect(probe.width, closeTo(160, 1));
    expect(probe.height, closeTo(32, 1));
    debugPrint('SKELO_NATIVE_GEOMETRY ${jsonEncode(capture.toJson())}');
    final input = find.byKey(const ValueKey('profile-input'));
    final element = tester.element(input);
    await tester.enterText(input, 'Edited profile');
    await tester.tap(find.text('Load activity'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('activity-loaded')), findsOneWidget);
    expect(reports, isNotEmpty);
    expect(reports.last.passed, isTrue,
        reason: reports.last.issues.map((i) => i.code).join(', '));
    debugPrint(
        'SKELO_NATIVE_QUALITY passed=${reports.last.passed} drift=${reports.last.maxDriftPx}');
    await tester.tap(find.text('Refresh profile'));
    await tester.pumpAndSettle();
    expect(tester.element(input), same(element));
    expect(find.text('Edited profile'), findsOneWidget);
    expect(find.text('Profile: refreshing'), findsOneWidget);
    await tester.tap(find.text('Finish refresh'));
    await tester.pumpAndSettle();
    expect(tester.element(input), same(element));
    expect(find.text('Edited profile'), findsOneWidget);
    await tester.tap(find.text('Fail activity'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('activity-loaded')), findsNothing);
    expect(find.text('Could not load this content'), findsOneWidget);
    expect(find.text('Edited profile'), findsOneWidget);
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('activity-loaded')), findsOneWidget);
    expect(find.text('Activity ready'), findsWidgets);
    await tester.ensureVisible(find.text('Check unavailable measurement'));
    await tester.tap(find.text('Check unavailable measurement'));
    await tester.pumpAndSettle();
    expect(find.text('Unavailable measurement rejected'), findsOneWidget);
    expect(tester.takeException(), isNull);
    debugPrint('SKELO_NATIVE_WORKFLOW passed');
  });
}
