import { useState } from 'react';
import { View, Text, Button, TextInput, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Geometry, LoadingRegion, MeasuredLayout, captureNativeLayout, compareLayouts,
  ready, pending, refreshing, failed, type LayoutSnapshot, type Resource, type QualityReport } from 'skelo/native';

const activityBox = { width: 180, height: 32, borderRadius: 4 };

export default function App() {
  const [profile, setProfile] = useState<Resource<string>>(ready('Alex'));
  const [activity, setActivity] = useState<Resource<string>>(pending());
  const [report, setReport] = useState<QualityReport>();
  const [snapshot, setSnapshot] = useState<LayoutSnapshot>();
  const [unavailable, setUnavailable] = useState(false);
  const probe = snapshot?.bones[0];
  const measured = snapshot?.complete && probe?.key === 'probe' &&
    Math.abs(probe.x - 8) < 1 && Math.abs(probe.y - 8) < 1 &&
    Math.abs(probe.width - 160) < 1 && Math.abs(probe.height - 32) < 1;
  return <SafeAreaProvider><SafeAreaView style={{ flex: 1 }}>
    <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Skelo in Expo</Text>
      <LoadingRegion id="profile" resource={profile}>
        {name => <TextInput testID="profile-input" accessibilityLabel="Profile name" returnKeyType="done" defaultValue={name}
          style={{ borderWidth: 1, borderColor: '#888', borderRadius: 6, padding: 12 }} />}
      </LoadingRegion>
      <Text testID="profile-state">Profile: {profile.status}</Text>
      <LoadingRegion id="activity" resource={activity} onRetry={() => setActivity(ready('Activity ready'))} onReport={setReport}
        template={<Geometry boneKey="activity" radius={4} style={activityBox}><Text>Activity ready</Text></Geometry>}>
        {value => <Geometry boneKey="activity" radius={4} style={activityBox}><Text>{value}</Text></Geometry>}
      </LoadingRegion>
      <Text testID="activity-state">Activity: {activity.status}</Text>
      <Button title="Load activity" onPress={() => setActivity(ready('Activity ready'))} />
      <Button title="Refresh profile" onPress={() => setProfile(refreshing('Alex'))} />
      <Button title="Finish refresh" onPress={() => setProfile(ready('Alex'))} />
      <Button title="Fail activity" onPress={() => setActivity(failed('offline'))} />
      <Button title="Reset activity" onPress={() => { setReport(undefined); setActivity(pending()); }} />
      <Text testID="quality-result">{report ? report.passed ? 'Layout passed' : 'Layout needs review' : 'Waiting for comparison'}</Text>
      {report ? <Text testID="quality-details">{report.metrics.expectedBones} loading / {report.metrics.actualBones} loaded; drift {report.metrics.maxDriftPx.toFixed(1)}</Text> : null}
      <MeasuredLayout onSnapshot={setSnapshot} style={{ height: 48 }}>
        <Geometry boneKey="probe" style={{ marginLeft: 8, marginTop: 8, width: 160, height: 32 }}><Text>Measured native view</Text></Geometry>
      </MeasuredLayout>
      <Text testID="measurement-result">{measured ? 'Native measurement ready' : 'Waiting for native measurement'}</Text>
      <Text testID="measurement-values">{probe ? `${probe.x},${probe.y} ${probe.width}x${probe.height}` : 'No geometry yet'}</Text>
      <Button title="Check unavailable measurement" onPress={async () => {
        const missing = await captureNativeLayout(null, []);
        setUnavailable(!missing.complete && !compareLayouts(missing, missing).passed);
      }} />
      {unavailable ? <Text testID="unavailable-result">Unavailable measurement rejected</Text> : null}
      <View style={{ height: 8 }} />
    </ScrollView>
  </SafeAreaView></SafeAreaProvider>;
}
