import 'package:flutter/material.dart';
import 'package:skelo/skelo.dart';

void main() => runApp(const MaterialApp(home: Demo()));

class Demo extends StatefulWidget {
  const Demo({super.key});
  @override
  State<Demo> createState() => _DemoState();
}

class _DemoState extends State<Demo> {
  Resource<String> profile = const Resource.ready('Alex');
  Resource<String> activity = const Resource.pending();
  QualityReport? report;
  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Skelo in Flutter')),
      body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            LoadingRegion(
                resource: profile,
                builder: (_, name) => TextFormField(initialValue: name)),
            LoadingRegion(
                resource: activity,
                id: 'activity',
                onReport: (next) => setState(() {
                      report = next;
                    }),
                template: const Geometry(
                    boneKey: 'activity', child: Text('Activity ready')),
                onRetry: () => setState(() {
                      activity = const Resource.ready('Activity ready');
                    }),
                builder: (_, value) =>
                    Geometry(boneKey: 'activity', child: Text(value))),
            TextButton(
                onPressed: () => setState(() {
                      activity = const Resource.ready('Activity ready');
                    }),
                child: const Text('Load activity')),
            TextButton(
                onPressed: () => setState(() {
                      profile = const Resource.refreshing('Alex');
                    }),
                child: const Text('Refresh profile')),
            TextButton(
                onPressed: () => setState(() {
                      activity = const Resource.failed('offline');
                    }),
                child: const Text('Fail activity')),
            Text(report == null
                ? 'Waiting for comparison'
                : report!.passed
                    ? 'Layout passed'
                    : 'Layout needs review'),
          ])));
}
