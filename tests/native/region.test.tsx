import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { LoadingRegion, Geometry, MeasuredLayout, Skeleton, pending, ready, refreshing, failed, type Resource } from '../../src/native';

test('native regions stay independent, skip pending children and retain refreshed input', () => {
  const mount = jest.fn(); const retry = jest.fn();
  function PendingChild() { useEffect(mount, []); return <Text>Real pending child</Text>; }
  const app = (profile: Resource<string>, activity: Resource<string>) => <>
    <LoadingRegion resource={profile}>{name => <TextInput accessibilityLabel="Name" defaultValue={name} />}</LoadingRegion>
    <LoadingRegion resource={activity} onRetry={retry}><PendingChild /></LoadingRegion>
  </>;
  const result = render(app(ready('Alex'), pending()));
  const input = screen.getByLabelText('Name');
  expect(mount).not.toHaveBeenCalled();
  result.rerender(app(refreshing('Alex'), failed('offline')));
  expect(screen.getByLabelText('Name')).toBe(input);
  fireEvent.press(screen.getByText('Try again')); expect(retry).toHaveBeenCalledTimes(1);
  expect(mount).not.toHaveBeenCalled();
  result.rerender(app(failed('offline', 'Alex'), ready('Ready')));
  expect(screen.getByLabelText('Name')).toBe(input); expect(mount).toHaveBeenCalledTimes(1);
});

test('native quality reports unavailable host geometry without a false pass', async () => {
  const report = jest.fn();
  const app = (resource: Resource<string>) => <LoadingRegion resource={resource} onReport={report} template={<Geometry boneKey="name"><Text>Fixture</Text></Geometry>}>
    {name => <Geometry boneKey="name"><Text>{name}</Text></Geometry>}
  </LoadingRegion>;
  const result = render(app(pending()));
  result.rerender(app(ready('Alex')));
  await waitFor(() => expect(report).toHaveBeenCalled(), { timeout: 1500 });
  expect(report.mock.calls[0][0].passed).toBe(false);
});

test('native skeleton hides only its template from accessibility and touch', () => {
  const result = render(<Skeleton template={<Text>Fixture</Text>} />);
  expect(result.root.props.accessibilityElementsHidden).toBe(true);
  expect(result.root.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(result.root.props.pointerEvents).toBe('none');
});

test('registered host views disable collapsing', () => {
  const result = render(<MeasuredLayout onSnapshot={() => {}}><Geometry boneKey="a"><Text>Visible</Text></Geometry></MeasuredLayout>);
  expect(result.root.props.collapsable).toBe(false);
});
