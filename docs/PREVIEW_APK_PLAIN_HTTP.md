# Using plain http in the preview APK

The recommendation back end runs on a laptop at `http://192.168.1.153:8000` (plain `http`, no TLS).
Expo Go and debug builds allow this. A release-style APK (the EAS `preview` profile) blocks cleartext
traffic on Android 9 and later, so every call fails with "Network request failed" until you allow it.

This file is documentation only. None of the steps below have been applied to the repo yet.

## 1. Allow cleartext traffic with `expo-build-properties`

Install the package (the repo rules say to ask before adding packages):

```
npx expo install expo-build-properties
```

Add the plugin to `app.json`, inside `expo.plugins`:

```json
"plugins": [
  "expo-font",
  "expo-splash-screen",
  [
    "expo-build-properties",
    {
      "android": {
        "usesCleartextTraffic": true
      }
    }
  ]
]
```

This sets `android:usesCleartextTraffic="true"` on the `<application>` tag of the generated
`AndroidManifest.xml`, which is what the developer guide asks for. It is a native change, so it needs a
new build. An over-the-air update will not apply it.

### Optional: only for preview

`usesCleartextTraffic` applies to every build that uses this `app.json`, including `production`. To limit it
to preview, switch to a dynamic config (`app.config.ts`) that reads an env var, for example
`process.env.ALLOW_CLEARTEXT === '1'`, and set that var only in the `preview` profile in `eas.json`.
For a demo that never ships to a store, the simple version above is fine. Remove the plugin before any
production release, which should use `https`.

## 2. Give the EAS build the address and key

`.env.local` is git-ignored, so EAS Build never sees it. Without this step the APK is built with an empty
`BASE_URL` and `API_KEY`.

- Address (not secret): add it to the `preview` profile in `eas.json`:

  ```json
  "preview": {
    "distribution": "internal",
    "android": { "buildType": "apk" },
    "env": { "EXPO_PUBLIC_API_BASE_URL": "http://192.168.1.153:8000" }
  }
  ```

- Key: create it as an EAS environment variable instead of committing it:

  ```
  eas env:create --name EXPO_PUBLIC_API_KEY --value "<key from Mandy>" --environment preview --visibility sensitive
  ```

  Variables named `EXPO_PUBLIC_*` are inlined into the JavaScript bundle, so anyone who unpacks the APK can
  read the key. That is acceptable for an internal demo APK. Do not share the APK outside the team, and ask
  Mandy to rotate the key afterwards.

## 3. Build and install

```
eas build --platform android --profile preview
```

Install the APK on a phone that is on the same Wi-Fi as Mandy's laptop. The address only works while that
laptop is on, awake and running the back end. If the laptop's IP changes, update `EXPO_PUBLIC_API_BASE_URL`
and build again (the value is baked in at build time).

## 4. Check it works

1. On the phone, open `http://192.168.1.153:8000/health` in the browser. It should show `{"status":"ok",...}`.
2. Open the app. Home should show three recommendation cards, and the user `edwino` should show rank 1 on the
   Cashback tab.
3. Turn on airplane mode and reopen the app: you should see "Something went wrong." with a Try again button.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| "Network request failed" in the APK only (Expo Go works) | Cleartext not allowed. Check step 1 and that you rebuilt. |
| "Network request failed" everywhere | Wrong address, different Wi-Fi, or the laptop is asleep. |
| 401 ("Check the API key in your config.") | The EAS variable is missing or wrong, or the build used an old value. |
| 403 | The user ID is not one of masud, edwino, chimuamandao. |
