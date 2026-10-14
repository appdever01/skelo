import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:skelo_example/main.dart';

void main() {
  testWidgets(
      'example loads and retries activity while retaining profile edits',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Demo()));
    await tester.pump();
    await tester.pump();
    await tester.enterText(find.byType(TextFormField), 'Edited');
    await tester.tap(find.text('Load activity'));
    await tester.pump();
    expect(find.text('Activity ready'), findsOneWidget);
    await tester.tap(find.text('Refresh profile'));
    await tester.pump();
    expect(find.text('Edited'), findsOneWidget);
    await tester.tap(find.text('Fail activity'));
    await tester.pump();
    await tester.tap(find.text('Try again'));
    await tester.pump();
    expect(find.text('Activity ready'), findsOneWidget);
  });
}
