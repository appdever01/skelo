import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:skelo/skelo.dart';

void main() {
  final fixtures =
      jsonDecode(File('../../tests/fixtures/geometry.json').readAsStringSync())
          as List;
  for (final fixture in fixtures) {
    test('shared geometry contract: ${fixture['name']}', () {
      final report = compareLayouts(
          LayoutSnapshot.fromJson(
              Map<String, dynamic>.from(fixture['expected'] as Map)),
          LayoutSnapshot.fromJson(
              Map<String, dynamic>.from(fixture['actual'] as Map)));
      expect(report.passed, fixture['passed']);
      expect(report.comparable, fixture['comparable']);
      expect(report.issues.map((i) => i.code).toList(), fixture['codes']);
    });
  }
}
