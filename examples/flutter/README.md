# Flutter example

This app uses the separate Dart package in `packages/flutter`. It includes iOS, Android and web hosts. Use Flutter 3.44.2+; Xcode and CocoaPods are needed for iOS, and Android Studio with an SDK/emulator for Android.

```sh
cd examples/flutter
flutter pub get
flutter devices
flutter run -d <device-id>
```

Requests are simulated. Edit the profile, load activity, refresh and finish the refresh, then fail and retry activity. The edited input stays mounted while the activity changes. The page shows measured geometry, layout comparisons and rejection of unavailable measurements.

## Native integration check

Start an iOS simulator or Android emulator and choose its explicit ID from `flutter devices`. Run one target at a time from this folder:

```sh
flutter test integration_test/native_test.dart -d <ios-simulator-id>
flutter test integration_test/native_test.dart -d <android-emulator-id>
```

The integration test runs in the native Flutter engine. It asserts a registered box at `8,8` with size `160×32`, a complete capture, a matching skeleton report, no loaded activity while pending, retained input element identity and edits through refresh, an isolated activity error and retry, and rejection of unavailable geometry. It prints `SKELO_NATIVE_GEOMETRY`, `SKELO_NATIVE_QUALITY` and `SKELO_NATIVE_WORKFLOW` evidence. Android Gradle workers are capped at two with a 2 GB heap.

Run `flutter analyze` and `flutter test --concurrency=2` for the example's scripted widget checks. `flutter build web` compiles the web host; `flutter run -d chrome` opens it. Native integration checks run separately from the widget suite. Phone hardware and VoiceOver/TalkBack require separate checks.

Verified with Flutter 3.44.2 / Dart 3.12.2 on iOS 26.5 and Android 15 / API 35 simulators, using the native integration test above.
