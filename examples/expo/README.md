# React Native / Expo example

This app uses Expo SDK 57, React Native 0.86.3 and Skelo's `/native` export. It runs in a matching Expo Go app or a development build. It does not import DOM code or web CSS.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --dir examples/expo start
```

Open the app on an iOS simulator or Android emulator using Expo CLI's device picker. Install a matching [Expo Go](https://expo.dev/go) version first. Xcode is required for iOS; Android Studio and an emulator are required for Android.

Edit the profile, load activity, refresh and finish the refresh, then fail and retry activity. The edited profile stays mounted. The page also checks a registered native view at `8,8` with size `160×32`, compares pending and loaded activity geometry, and rejects a deliberately unavailable measurement. Skeletons are static and only registered `Geometry` views are measured.

## Repeatable simulator check

Install [Maestro CLI](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli) and Java 17+. Start Metro on a dedicated port with at most two workers:

```sh
NODE_OPTIONS=--dns-result-order=ipv4first pnpm --dir examples/expo start --go --localhost --port 8083
```

The Node option makes `localhost` resolve to IPv4, matching the simulator link and Android's port forwarding. Select explicit test device IDs; `xcrun simctl list devices booted` and `adb devices` list them. Run one device at a time from the repository root:

```sh
maestro --device <ios-simulator-id> test -e APP_ID=host.exp.Exponent -e EXPO_URL=exp://127.0.0.1:8083 --test-output-dir .local/maestro-ios --debug-output .local/maestro-ios examples/expo/.maestro/native.yaml
adb -s <android-emulator-id> reverse tcp:8083 tcp:8083
maestro --device <android-emulator-id> test -e APP_ID=host.exp.exponent -e EXPO_URL=exp://127.0.0.1:8083 --test-output-dir .local/maestro-android --debug-output .local/maestro-android examples/expo/.maestro/native.yaml
```

The flow checks native bounds, independent pending content, a matching quality report, retained edits during refresh, local errors/retry and unavailable measurement rejection. It restarts only the selected Expo Go app. Use a test simulator, since this closes any project already running in that app. Logs and screenshots stay in ignored `.local/` folders.

`pnpm test:native` runs the component regressions with two workers. `pnpm --dir examples/expo export` exports both native bundles with two Metro workers. Bundling alone does not verify native behaviour. Real devices and VoiceOver/TalkBack require separate checks.

Verified with Expo SDK 57, React Native 0.86.3 and Expo Go 57.0.9 on iOS 26.5 and Android 15 / API 35 simulators, using the flow above.
