import { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { Geometry, LoadingRegion, ready, pending, refreshing, failed, type Resource, type QualityReport } from 'react-loading-regions/native';
export default function App() {
  const [profile, setProfile] = useState<Resource<string>>(ready('Alex'));
  const [activity, setActivity] = useState<Resource<string>>(pending());
  const [report, setReport] = useState<QualityReport>();
  return <View style={{ padding: 32, gap: 16 }}>
    <Text style={{ fontSize: 24 }}>Skelo in Expo</Text>
    <LoadingRegion id="profile" resource={profile}>{name => <TextInput accessibilityLabel="Profile name" defaultValue={name} />}</LoadingRegion>
    <LoadingRegion id="activity" resource={activity} onRetry={() => setActivity(ready('Activity ready'))} onReport={setReport}
      template={<Geometry boneKey="activity"><Text>Activity ready</Text></Geometry>}>
      {value => <Geometry boneKey="activity"><Text>{value}</Text></Geometry>}
    </LoadingRegion>
    <Button title="Load activity" onPress={() => setActivity(ready('Activity ready'))} />
    <Button title="Refresh profile" onPress={() => setProfile(refreshing('Alex'))} />
    <Button title="Fail activity" onPress={() => setActivity(failed('offline'))} />
    <Text>{report ? report.passed ? 'Layout passed' : 'Layout needs review' : 'Waiting for comparison'}</Text>
  </View>;
}
