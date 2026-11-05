# Moniflow Leaderboard Nudges (demo)

A frontend-only Expo React Native demo for **Moniflow**, the NetApps Technologies app. It shows two ideas working together:

1. **Leaderboard nudges.** The weekly cashback leaderboard tells the user the cheapest transaction that gets them to the next prize tier, holds their spot, breaks them into the Top 20, or gets them over the ₦10 minimum.
2. **Recommendations.** Home shows the user's top 3 most frequent transactions ("Suggested for you"), from the data team's recommendation engine.

There is **no backend**. Every number comes from mock data in `src/data/`, and the nudge maths runs on the phone in `src/lib/nudgeEngine.ts`. The demo user is **Masud Hashim** on every screen.

## Run it

You need Node (LTS), and the **Expo Go** app on an Android phone on the same Wi-Fi as your computer.

```bash
npm install
npx expo start -c
```

Scan the QR code with Expo Go. `-c` clears the bundler cache, so you always see the latest code.

Before every commit:

```bash
npx tsc --noEmit
```

It must print nothing.

## Try the demo

- **Path:** Home → Reward tab → Leaderboard button → Leaderboard. Home's green leaderboard line also opens it.
- **Switch demo states:** on the Leaderboard, **long-press the Week badge** (top right). It cycles through 5 states:

| State | Masud | What you should see |
| --- | --- | --- |
| Rank up | 12th, ₦44.10 | Highlighted row, nudge "₦4.50 to 10th, win ₦650" |
| Hold | 10th, ₦48.50 | Amber strip, press and hold for 800 ms to buy |
| Break in | 34th, ₦14.20 | Row docked at the bottom, "to make the Top 20" |
| Under minimum | ₦1.50 | Red row, "₦8.60 more to qualify" |
| Empty | ₦0 | "Top 20 win up to ₦2,500" card with his usual transaction |

- **Buy:** tapping a nudge opens the payment sheet. Any 4-digit PIN works. After paying, Masud moves on the board and the next nudge appears. Purchases from Home move him too.

## Build the APK

Builds run in the cloud with EAS (free tier is enough). The `preview` profile in `eas.json` produces an installable `.apk`.

```bash
npx eas-cli@latest build -p android --profile preview
```

The project is currently linked to the original developer's Expo account. To build under your own account, remove `owner` and `extra.eas.projectId` from `app.json`, then run `npx eas-cli@latest init`.

## Where things are

```
App.tsx                 screen switching (no Expo Router), bottom nav, Android back
src/lib/                pure logic, no React: nudgeEngine.ts (the brain), prizes.ts, format.ts
src/state/DemoContext   shared demo state: current scenario, Masud's cashback, the nudge
src/data/               mock leaderboard (5 scenarios), mock recommendations, product catalogue
src/screens/            HomeScreen, RewardsScreen, LeaderboardScreen
src/components/         PurchaseSheet + PinPad (payment), NudgeStrip, DockedUserRow, RankRow, ...
src/theme/tokens.ts     colours, spacing, radii from Figma
docs/design/            DESIGN_SPEC.md: every design value extracted from Figma
CLAUDE.md               full project brief, scope and business rules (read this first)
```

## Rules

- `src/lib/` must never import React or React Native, so the logic can move to a backend.
- Install packages with `npx expo install <pkg>`, never plain `npm install <pkg>`.
- Icons are SVG (`lucide-react-native`), never emoji. Font is Inter.
- No em dashes or en dashes in UI copy.
- Do not call the Figma API for values; they are already in `docs/design/DESIGN_SPEC.md`.
