import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:skelo/skelo.dart';

void main() {
  testWidgets(
      'independent regions, lazy builders, refresh identity and local retry',
      (tester) async {
    var pendingBuilds = 0;
    var retries = 0;
    Widget app(Resource<String> a, Resource<String> b) => MaterialApp(
            home: Scaffold(
                body: Column(children: [
          LoadingRegion(
              resource: a,
              builder: (_, value) => TextFormField(initialValue: value)),
          LoadingRegion(
              resource: b,
              onRetry: () {
                retries++;
              },
              builder: (_, value) {
                pendingBuilds++;
                return Text(value);
              }),
        ])));
    await tester.pumpWidget(
        app(const Resource.ready('Alex'), const Resource.pending()));
    expect(pendingBuilds, 0);
    final input = tester.element(find.byType(TextFormField));
    await tester.enterText(find.byType(TextFormField), 'Edited');
    await tester.pumpWidget(app(
        const Resource.refreshing('Alex'), const Resource.failed('offline')));
    expect(tester.element(find.byType(TextFormField)), same(input));
    expect(find.text('Edited'), findsOneWidget);
    await tester.tap(find.text('Try again'));
    expect(retries, 1);
    expect(pendingBuilds, 0);
    await tester.pumpWidget(app(const Resource.stale('offline', 'Alex'),
        const Resource.ready('Activity ready')));
    expect(tester.element(find.byType(TextFormField)), same(input));
    expect(find.text('Activity ready'), findsOneWidget);
  });
  testWidgets(
      'captures real Flutter layout and compares template against content',
      (tester) async {
    final reports = <QualityReport>[];
    Widget geometry(String text) => Geometry(
        boneKey: 'name',
        child: SizedBox(width: 180, height: 30, child: Text(text)));
    Widget app(Resource<String> state) => MaterialApp(
        home: Scaffold(
            body: SizedBox(
                width: 200,
                child: LoadingRegion(
                    id: 'profile',
                    resource: state,
                    template: geometry('Fixture'),
                    onReport: reports.add,
                    builder: (_, data) => geometry(data)))));
    await tester.pumpWidget(app(const Resource.pending()));
    await tester.pump();
    await tester.pump();
    await tester.pumpWidget(app(const Resource.ready('Alex')));
    await tester.pump();
    expect(reports, hasLength(1));
    expect(reports.single.passed, isTrue);
  });
  testWidgets(
      'missing registered geometry cannot pass and reports remain region local',
      (tester) async {
    final reports = <QualityReport>[];
    Widget app(Resource<String> state) => MaterialApp(
        home: Scaffold(
            body: LoadingRegion(
                resource: state,
                onReport: reports.add,
                builder: (_, data) => Text(data))));
    await tester.pumpWidget(app(const Resource.pending()));
    await tester.pump();
    await tester.pumpWidget(app(const Resource.ready('Alex')));
    await tester.pump();
    expect(reports.single.passed, isFalse);
    expect(reports.single.comparable, isFalse);
  });
  test('geometry failure modes and nullable ready resources', () {
    const layout = LayoutSnapshot(
        width: 100,
        height: 50,
        bones: [Bone(key: 'name', x: 0, y: 0, width: 50, height: 20)],
        complete: true);
    expect(compareLayouts(layout, layout).passed, isTrue);
    expect(compareLayouts(const LayoutSnapshot.unavailable(), layout).passed,
        isFalse);
    const partial = LayoutSnapshot(
        width: 100,
        height: 50,
        bones: [],
        complete: false,
        reason: 'measurement-unavailable');
    expect(compareLayouts(partial, partial).passed, isFalse);
    const drift = LayoutSnapshot(
        width: 100,
        height: 50,
        bones: [Bone(key: 'name', x: 30, y: 0, width: 50, height: 20)],
        complete: true);
    expect(compareLayouts(layout, drift).issues.single.code, 'BONE_DRIFT');
    const invalid = LayoutSnapshot(
        width: 100, height: 50, bones: [], complete: true, reason: 'max-time');
    expect(
        compareLayouts(invalid, layout).issues.single.code, 'INVALID_SNAPSHOT');
    expect(const Resource<String?>.ready(null).hasData, isTrue);
    expect(() => compareLayouts(layout, layout, tolerancePx: -1),
        throwsArgumentError);
    expect(LayoutSnapshot.fromJson(layout.toJson()).toJson(), layout.toJson());
  });
}
