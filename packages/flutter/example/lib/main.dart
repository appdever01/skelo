import 'package:flutter/material.dart';
import 'package:skelo/skelo.dart';

void main() => runApp(const MaterialApp(home: Preview()));

class Preview extends StatefulWidget {
  const Preview({super.key});

  @override
  State<Preview> createState() => _PreviewState();
}

class _PreviewState extends State<Preview> {
  Resource<String> activity = const Resource.pending();

  void load() =>
      setState(() => activity = const Resource.ready('Activity ready'));

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Skelo preview')),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LoadingRegion<String>(
                resource: const Resource.ready('Alex'),
                builder: (_, name) => Text(name),
              ),
              LoadingRegion<String>(
                resource: activity,
                onRetry: load,
                template: const Geometry(
                    boneKey: 'activity', child: Text('Activity ready')),
                builder: (_, value) =>
                    Geometry(boneKey: 'activity', child: Text(value)),
              ),
              TextButton(onPressed: load, child: const Text('Load activity')),
              TextButton(
                onPressed: () => setState(() =>
                    activity = const Resource.refreshing('Activity ready')),
                child: const Text('Refresh activity'),
              ),
              TextButton(
                onPressed: () =>
                    setState(() => activity = const Resource.failed('Offline')),
                child: const Text('Fail activity'),
              ),
            ],
          ),
        ),
      );
}
