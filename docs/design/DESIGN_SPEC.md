# Design spec: Leaderboard Nudges v2 (Variant B)

Extracted from Figma file `RLzp37eeTrl5jynWmMUm81` (nodes 879:1250 B1, 879:2075 B3 hold row, 879:1861 B2 dock).
This file is the source of truth for values. Do not call Figma for these; the account has a very small monthly Figma MCP quota.

Notes on reading this spec:
- Figma draws the screen inside a 320 pt wide phone mock. Do NOT build the phone bezel, the fake status bar ("12:27", "40%") or the home indicator. Use the real device status bar.
- Values are in Figma pt = React Native dp. Keep sizes, but lay out with flex so rows stretch to the real screen width (no hardcoded 296/280 widths; use padding and insets instead).
- Font: Inter (Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800). Line height "normal".
- Icons: SVG via lucide-react-native. Suggested names in brackets.

## Colour tokens

| Token | Hex | Used for |
|---|---|---|
| headerTop | #061A52 | header gradient start (top) |
| headerBottom | #0B3487 | header gradient end (bottom) |
| screenBg | #EEF3FB | screen background |
| navyText | #0D1F4C | names, headlines, week number |
| mutedText | #7B8499 | prize sublines, captions, inactive tab sublabel |
| tabInactiveText | #3D4B6B | inactive tab label |
| tabActiveBg | #0D4EA6 | active tab, rank plate, avatar circle |
| tabActiveSub | #C9D8FF | active tab sublabel |
| tabsBorder | #E1E7F3 | tab bar border |
| weekBand | #0A3D91 | "Week" band on badge |
| headerSubtitle | #C4D0F0 | "Compete. Earn. Win." |
| countdownText | #D6E0FB | "Ends in 2d 6h" |
| cashChipBg | #E4F6EA | cashback chip background |
| cashChipLabel | #5B7F69 | "Cashback" label in chip |
| cashChipValue | #178A4C | cashback amount |
| tierText | #A88317 | "₦650 above" divider |
| teal | #0FA594 | current user plate, ring, avatar, Buy button, nudge border |
| tealSoft | #EFFBF8 | current user pill, nudge icon circle |
| amber | #F0B65A | hold strip border, Hold button border |
| amberSoft | #FFF6E6 | hold icon circle |
| amberText | #C77700 | Hold button label |
| offPlate | #A5AFC4 | off-board plate and avatar |
| offRing | #C7CFDF | off-board ring, off-board strip border |
| offPill | #FAFBFD | off-board pill |
| offChipBg | #F0F2F6 | off-board chip |
| offChipValue | #5D6780 | off-board amount |

## Header (gradient top to bottom, headerTop to headerBottom; padding 16 horizontal, 12 vertical)
- Back button: 36 circle, bg rgba(255,255,255,0.14), chevron icon 18 white [chevron-left].
- Title block, centred: icon 16 white [bar-chart-2] + gap 6 + "LEADERBOARD" ExtraBold 15 white, letterSpacing 0.2. Subtitle "Compete. Earn. Win." Regular 10.5 headerSubtitle, 2 above.
- Week badge: 58 x 45.5, white, radius 10, overflow hidden, shadow 0 2 6 rgba(0,0,0,0.15). Top band weekBand, "Week" Bold 10 white, padding 3 vertical. Number ExtraBold 17 navyText, padding top 3 bottom 4.
- Countdown row, centred, 8 above: clock icon 11 [clock] + gap 5 + "Ends in 2d 6h" Medium 10.5 countdownText.

## Body (padding 12 horizontal, 12 top, 20 bottom)

### Tabs
- Container: white, border 1 tabsBorder, radius 14, padding 4, gap 2. Three equal tabs.
- Tab: radius 10, padding top 6 bottom 5. Row: icon 15 to 16 + gap 5 + label SemiBold 11.5. Sublabel Medium 9.5, 2 above (e.g. "#12", "Not ranked").
- Active: bg tabActiveBg, label white, sublabel tabActiveSub. Inactive: no bg, label tabInactiveText, sublabel mutedText.
- Icons: Cashback [credit-card], Referrals [users], Volume [bar-chart-2].

### "Scrolled to you" caption
Regular 10 mutedText, centred, 12 above. Shown when the list auto-scrolls to the user's row.

### Rank row (standard)
- Card: height 58, radius 14, bg tabActiveBg (this is the left "plate"), overflow hidden, shadow 0 1 3 rgba(13,31,76,0.08). Rows separated by 8.
- Plate (left, width 62 incl. 16 right padding): rank number ExtraBold 17 white with ordinal suffix ("TH", "ST", "ND", "RD") ExtraBold 7.5 white raised as superscript; below it (gap 3) a medal icon 12 white [medal].
- Pill (right): white, overlaps the plate by 16, left corners radius 29, padding left 10 right 8, gap 9, vertically centred:
  - Avatar: 36 circle, bg tabActiveBg, initials Bold 11 white.
  - Name: Bold 13 navyText (truncate with ellipsis). Below, 2 above: "Prize ₦650" Regular 10 mutedText.
  - Cashback chip: width 72, bg cashChipBg, radius 9, padding 8 horizontal 5 vertical. "Cashback" Regular 8.5 cashChipLabel centred; amount ExtraBold 13 cashChipValue centred.

### Tier divider
Row 8 above the next card: right-aligned text SemiBold 9.5 tierText, e.g. "₦650 above". Marks where the prize tier changes.

### Current user row
Same as standard row, except:
- Plate bg teal; card has ring 1.5 teal plus shadow 0 6 14 rgba(15,165,148,0.18).
- Pill bg tealSoft, no overlap gap (plate narrower, about 46).
- Avatar bg teal.

### Nudge strip (hangs under the current user row)
- Sits 6 under the row's bottom edge so it tucks behind it; inset 8 on both sides; bg white; border 1.5 on left, right and bottom only; bottom corners radius 14; padding top 12, bottom 9, horizontal 10; gap 9; items centred.
- Icon circle 26, radius 13, with 14 icon.
- Headline Bold 12 navyText. Subline Regular 10.5 mutedText, 1 above (may wrap to 2 lines in hold state; design for varying lengths).
- Button radius 9, label Bold 11.

| State | Border | Icon circle | Icon | Button |
|---|---|---|---|---|
| rank_up | teal | tealSoft | arrow-up, teal | bg teal, "Buy" white, padding 13 x 7 |
| break_in | offRing | tealSoft | arrow-up, teal | bg teal, "Buy" white, padding 13 x 7 |
| hold | amber | amberSoft | arrow-down, amber | bg white, border 1.5 amber, "Hold" amberText, padding 12 x 5.5 |

Example copy:
- rank_up: "₦4.50 to 10th, win ₦650" / "About ₦250 in MTN data"
- break_in: "₦19.60 to make the Top 20" / "About ₦1,000 in MTN airtime"
- hold: "Only ₦2.30 ahead of 11th" / "Slip one place and your prize drops to ₦500"

### Docked state (B2: user off the board, or scrolled away from their row)
- Container pinned to the bottom of the screen over the list. Background gradient top to bottom: rgba(238,243,251,0) to rgba(238,243,251,0.96) at 26% to screenBg. Padding 12 horizontal, 22 vertical. Group shadow 0 -2 10 rgba(13,31,76,0.08).
- Off-board row: plate offPlate with ring 1.5 offRing; pill offPill; avatar offPlate; subline "Not on the board yet"; chip bg offChipBg with amount offChipValue (label stays cashChipLabel).
- Nudge strip uses the break_in row in the table above.
- When the user is in the Top 20 but scrolled away, dock their normal current-user row (teal) the same way.

## Not in Figma v2 (follow the live app)
Prize table (Top 20 tiers), eligibility line ("Eligibility Cashback: ₦10.00 +"), reward notice, "see leaderboard winners" button and social links appear in the live app but not in v2. Build them after the core list, matching the live app's styling as closely as this palette allows, and flag anything uncertain.
