import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:skelo/skelo.dart';

void main() => runApp(const MaterialApp(home: Demo()));

class Demo extends StatefulWidget {
  final ValueChanged<QualityReport>? onReport;
  final ValueChanged<LayoutSnapshot>? onMeasurement;
  const Demo({super.key, this.onReport, this.onMeasurement});
  @override
  State<Demo> createState() => _DemoState();
}

class _DemoState extends State<Demo> {
  Resource<String> profile = const Resource.ready('Alex');
  Resource<String> activity = const Resource.pending();
  QualityReport? report;
  LayoutSnapshot? measurement;
  bool unavailable = false;
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Skelo in Flutter')),
        body: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LoadingRegion(
                    resource: profile,
                    builder: (_, name) => TextFormField(
                        key: const ValueKey('profile-input'),
                        initialValue: name,
                        decoration:
                            const InputDecoration(labelText: 'Profile name'))),
                Text('Profile: ${profile.status.name}',
                    key: const ValueKey('profile-state')),
                const SizedBox(height: 12),
                LoadingRegion(
                    resource: activity,
                    id: 'activity',
                    onReport: (next) {
                      setState(() {
                        report = next;
                      });
                      widget.onReport?.call(next);
                    },
                    template: const Geometry(
                        boneKey: 'activity', child: Text('Activity ready')),
                    onRetry: () => setState(() {
                          activity = const Resource.ready('Activity ready');
                        }),
                    builder: (_, value) => Geometry(
                        boneKey: 'activity',
                        child: Text(value,
                            key: const ValueKey('activity-loaded')))),
                Text('Activity: ${activity.status.name}',
                    key: const ValueKey('activity-state')),
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
                          profile = const Resource.ready('Alex');
                        }),
                    child: const Text('Finish refresh')),
                TextButton(
                    onPressed: () => setState(() {
                          activity = const Resource.failed('offline');
                        }),
                    child: const Text('Fail activity')),
                TextButton(
                    onPressed: () => setState(() {
                          report = null;
                          activity = const Resource.pending();
                        }),
                    child: const Text('Reset activity')),
                Text(
                    report == null
                        ? 'Waiting for comparison'
                        : report!.passed
                            ? 'Layout passed'
                            : 'Layout needs review',
                    key: const ValueKey('quality-result')),
                if (report != null)
                  Text(
                      'drift ${report!.maxDriftPx.toStringAsFixed(1)}; ${report!.issues.map((i) => i.code).join(', ')}'),
                MeasuredLayout(
                    onSnapshot: (next) {
                      if (jsonEncode(measurement?.toJson()) !=
                          jsonEncode(next.toJson())) {
                        setState(() {
                          measurement = next;
                        });
                      }
                      widget.onMeasurement?.call(next);
                    },
                    child: const SizedBox(
                        height: 48,
                        child: Stack(children: [
                          Positioned(
                              left: 8,
                              top: 8,
                              child: Geometry(
                                  boneKey: 'probe',
                                  child: SizedBox(
                                      width: 160,
                                      height: 32,
                                      child: Text('Measured native view')))),
                        ]))),
                Text(
                    measurement?.complete == true
                        ? 'Native measurement ready'
                        : 'Waiting for native measurement',
                    key: const ValueKey('measurement-result')),
                TextButton(
                    onPressed: () => setState(() {
                          unavailable = !compareLayouts(
                                  const LayoutSnapshot.unavailable(),
                                  const LayoutSnapshot.unavailable())
                              .passed;
                        }),
                    child: const Text('Check unavailable measurement')),
                if (unavailable) const Text('Unavailable measurement rejected'),
              ],
            )),
      );
}
