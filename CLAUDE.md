# Moniflow Leaderboard Nudges (demo)

## What this is
A frontend-only demo of the Leaderboard screen for **Moniflow**, NetApps Technologies' app (the slides call it "Money Flow"; same app, the correct name is Moniflow).
The leaderboard gets AI "nudges": personalised messages that tell a user exactly what transaction gets them into the next prize tier.
The leaderboard board, nudges and payment sheet use local mock data. Home recommendations and the three leaderboard rank cards (cashback, referrals, volume) come from the NetApps recommendation API (`src/api/recommend.ts`, config in git-ignored `.env.local`, see `.env.example`). The app shows API messages exactly as received.

Stack: Expo SDK 57, React Native, TypeScript (blank-typescript template). Target: Android APK via EAS Build (preview profile, buildType apk). No AAB, no iOS.

## Source of truth
1. **Figma (design):** file `RLzp37eeTrl5jynWmMUm81`, section node `879:636` ("Leaderboard Nudges v2").
   - Build **Variant B**, container node `879:1249`:
     - B1 Rank up: node `879:1250`
     - B2 Break in (docked): node `879:1568`
     - B3 Hold: node `879:1917`
   - Designer notes ("What changed from v1", "A or B?"): node `879:2204`
   - Variant A (node `879:648`) is NOT being built. Use it only as visual reference for shared parts.
   - All values (colours, spacing, radii, type, states) are already extracted into `docs/design/DESIGN_SPEC.md`. Build from that file. Do NOT call Figma tools: the account's Figma MCP quota is tiny (a few calls per month). If something is missing from the spec, ask me instead.
2. **Reference docs (read only):** `docs/reference/`. Internal slides and notes. Never edit, move or commit them (they are gitignored).

## Scope
In scope:
- Leaderboard screen: header (back button, title, "Compete. Earn. Win.", week badge), countdown line ("Ends in 2d 6h"), tabs, ranked list, prize table, eligibility line.
- Tabs: Cashback, Referrals, Volume. Each tab shows the user's own rank as a small second line (e.g. "#12" or "Not ranked").
- **Cashback tab is the priority** and gets the full nudge experience first.
- Referrals and Volume use the same pattern later: the user sees their position and the gap to the board even when not ranked. Referrals nudges say "invite", not "buy". Volume = count of transactions.
- Nudge states (Variant B):
  - `rank_up`: user is in the Top 20; nudge hangs off their highlighted row and shows the gap to the next prize tier.
  - `break_in`: user is outside the Top 20 or scrolled away; their row docks to the bottom of the screen with the nudge.
  - `hold`: amber strip when someone close behind could push the user down a prize tier.
  - `qualify`: user is under the ₦10 minimum; red row (like the live app) with "₦X more to qualify". With no transactions at all, the dock shows the empty week card instead.
- Nudges are computed live by `src/lib/nudgeEngine.ts` from the user's usual transactions (`src/data/mockRecommendations.ts`, top 3 by frequency) and the mock catalogue (`src/data/productCatalog.ts`). Scale the usual (#1) up; fall back to #2 or #3 only when #1 earns no cashback. Fixed-price products (data bundles, cable packages) use the cheapest plan that covers the gap.
- The demo user is Masud Hashim everywhere.
- Prize under each name in muted text, and tier divider lines (e.g. "₦650 above").

- Payment sheet (`PurchaseSheet` + `PinPad`) mirrors the live Confirm Purchase screen: order summary, service charge, Apply Cashback toggle (no effect on the maths), shuffled PIN keypad (any 4 digits accepted in the demo), a small fingerprint icon beside the PIN boxes (expo-local-authentication), a typed amount field with min and daily-limit checks, and a Back arrow (and Android back) that steps back through earlier choices before closing. One recommendation per sheet (data team, 9 Oct): the "Pay for" switcher exists but is off (`allowSwitching`). Users can change the amount or plan; one message shows where they will be after paying (`positionAfter` in nudgeEngine).

- App flow (`App.tsx`): Home (Suggested for you + Switch Menu) and Rewards share a bottom nav; Rewards' Leaderboard button and Home's leaderboard line open the Leaderboard. Android back steps back. Scenario, user and nudge live in `src/state/DemoContext.tsx`, so a purchase on any screen moves Masud on the board. Long-press the Week badge to cycle the 5 demo states (rank up, hold, break in, under minimum, empty); the board remounts on every switch, and if Masud's row is not measured within 400 ms the docked row shows anyway, so his row and nudge are always on screen.
- Home "Recommended for you": three cards from the API (`type`, `provider` underneath), in the order received, with a demo user picker (masud, edwino, chimuamandao). Taps are demo only (an alert). The line under the cards is the API cashback message. Leaderboard tabs show the API rank, and the active tab shows its API card (rank badge, #1 gets a celebration style, message as received). The board and nudge strips below are sample data.

Out of scope: Variant A, API calls other than the recommendation API, auth (the demo user picker only sends one of three staff IDs), iOS, betting, deposits, wallet top-ups and vouchers as suggestions.

## Business rules (from the live app, these win over the slides)
- Only the Top 20 appear on the board.
- Minimum cashback to qualify: ₦10.00.
- Electricity: minimum purchase ₦1,000, ₦50 service charge, meter verified before amount entry.
- Prize tiers:
  - 1st: ₦2,500
  - 2nd: ₦2,000
  - 3rd: ₦1,500
  - 4th to 10th: ₦650
  - 11th to 15th: ₦500
  - 16th to 20th: ₦400
- Leaderboard is weekly.

## Data contract (mock, proposed to the data team)
The slides say the backend sends one ready-made string (`message`) and the UI only renders it. The Figma design needs structured fields. We mock the structured shape AND keep `message`, so the UI works with either. This conflict is being written up for the team; do not "resolve" it in code beyond this.

Suggested shape (adjust names only if there is a good reason, and say why):

```ts
type Track = "cashback" | "referrals" | "volume";
type NudgeState = "rank_up" | "break_in" | "hold" | "qualify";

interface Nudge {
  state: NudgeState;
  message: string;          // full sentence, matches the slides' contract
  headline: string;         // e.g. "₦4.50 to 10th, win ₦650"
  subline?: string;         // e.g. "About ₦250 in MTN data"
  gapAmount: number;        // naira (or count for referrals/volume)
  targetRank: number;
  targetPrize: number;
  ctaLabel: string;         // "Buy", "Hold", "Invite"
  offer: Offer;             // the ready-to-pay transaction (see src/types/leaderboard.ts)
}
```

## Code structure
```
src/
  types/        shared TypeScript types
  data/         mock data (leaderboard rows, current user, nudges)
  lib/          pure logic: tier lookup, gap calculation, formatting. NO React or React Native imports here, so it can move to any stack.
  theme/        tokens pulled from Figma (colours, spacing, radii, type)
  components/   presentational components
  state/        DemoContext (shared demo scenario, user and nudge)
  screens/      HomeScreen, RewardsScreen, LeaderboardScreen
```

## Rules for working in this repo
- One task per session. Finish it, verify it, commit it, stop.
- Install packages with `npx expo install <pkg>` (keeps versions compatible). Ask before adding any package.
- Never run `npm audit fix --force`.
- Never delete files without saying which files and why first.
- Before every commit: `npx tsc --noEmit` must pass.
- Commit messages: short, imperative, describe the change.
- Icons: SVG (react-native-svg / lucide-react-native), never emoji. Font: Inter.
- Money formatting: ₦ with thousands separators; match Figma for when decimals show.
- When you need me to run a terminal command, give one command at a time and wait for the output.
- Do not use em dashes or en dashes in UI copy or in messages to me.
