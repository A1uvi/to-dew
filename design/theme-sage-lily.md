# To Dew — Theme: Sage Lily

Direction chosen 2026-09-21 from the "To Dew — Style Directions" canvas (row 06).
Family: Blush & Milk Pastel, re-weighted to sage, with a sticker accent.

**Feel.** Airy, botanical, calm. A white card floating on milk, pale-sage panels, one deep-sage
accent for every action, rose only as a second voice. Serif headings, light sans body. Nothing
snappy; things fade and settle.

## Typography

| Role | Font | Size / weight | Notes |
|---|---|---|---|
| Display (date header, view titles, "Good morning") | Cormorant Garamond | 34 pt / 500 | Sentence case, line-height 1.1 |
| Display small (history day title, all-done) | Cormorant Garamond | 20 pt / 500 | |
| Stat numbers | Cormorant Garamond | 18 pt / 700 | tabular |
| Body / task title | Jost | 15 pt / 400 | line-height 1.25 |
| UI (buttons, nav, meta) | Jost | 12–13 pt / 500–600 | |
| Labels (section eyebrows) | Jost | 11 pt / 500 | uppercase, tracking 0.08em, muted |
| Micro (tags, carry badge) | Jost | 10 pt / 700 | |

Both fonts are Google Fonts (SIL OFL) — bundle the TTF/OTFs in the app and register them in
`Info.plist` (`ATSApplicationFontsPath`). Map to SwiftUI semantic styles in the theme so Dynamic
Type still scales. Fallbacks: New York (display), SF Pro (body).

## Color

Light values are the design; dark values are proposed and should be checked on a real screen.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `background` | `#FBF7F5` milk | `#1E241C` | Window/desktop ground |
| `surface` | `#FFFFFF` | `#262E23` | Main card |
| `surfaceAlt` | `#E6EBDB` pale sage | `#303A2C` | Cards inside the card: rows, review cards, stat tiles, nav pill |
| `ink` | `#2F352B` | `#EEF1E6` | Primary text |
| `inkMuted` | `#7E8A74` | `#A6B09B` | Secondary text, labels |
| `line` | `#DCE3D2` | `#3A4535` | Hairlines, unchecked ring track |
| `accent` | `#6F8461` deep sage | `#9CAD8C` | Checks, primary buttons, ring fill, flag, carry badge |
| `accentInk` | `#FFFFFF` | `#1E241C` | Text on accent |
| `accentSecondary` | `#CE859A` rose | `#D9A0B0` | Rare emphasis (streak milestone, nag text) |
| `sage` | `#9CAD8C` | `#7F9A73` | Decorative tints, recurring dots |
| `done` | `#B9C2B0` | `#6E7A64` | Completed row text (with 45% opacity + strikethrough) |
| `danger` | `#B8564A` | `#D98A80` | Drop action hover only |

Wallpaper (behind the window, optional, only when material = solid):
`radial-gradient(60% 50% at 88% 92%, rgba(156,173,140,.35), transparent 70%)` +
`radial-gradient(40% 40% at 8% 8%, rgba(206,133,154,.18), transparent 70%)` over `background`.

System accent color: overridden by the theme (deep sage) — the palette does not survive a blue accent.

## Shape & spacing

| Token | Value |
|---|---|
| `radius.window` | 14 |
| `radius.card` | 12 |
| `radius.control` | 8 |
| `radius.pill` | 999 |
| `checkbox` | 22 × 22, circle, 1.5 pt `accent` border; filled `accent` with white check when done |
| `space` | 4 · 8 · 12 · 16 · 22 (window padding) · 32 |
| `row.minHeight` | 40 |
| `window.minSize` | 360 × 480 (spec) |
| `shadow.window` | `0 10px 30px rgba(111,132,97,.14)` |
| `border` | 1 pt `line` on surfaceAlt cards; no borders on rows |

Materials: window is solid `surface`. Glass (`.ultraThinMaterial`) only on the entry-field bar
and toolbar, per spec. Content rows are never glass.

## Components (how each looks)

- **DayHeader** — display 34 date line, 12 pt muted "n of m done · k-day streak", 36 pt ProgressRing right.
- **ProgressRing** — 4 pt stroke, track `line`, fill `accent`, round caps, starts at 12 o'clock.
- **TaskRow** — checkbox · title (Jost 15) · carry badge (10 pt accent outline pill "2d") · recurring glyph · note toggle · due pill (surfaceAlt) · flag. Done rows: 45% opacity, strikethrough, sink below open rows.
- **EntryField** — surfaceAlt bar, 1 pt line, radius 12, "+" in accent, parsed-token chips in accent with white text, "Esc dismisses" hint.
- **ReviewCard** — surfaceAlt, radius 12, title + carry line ("rolled 3 days — schedule it, park it or drop it?" in accent when ≥ threshold), four choice buttons; chosen = filled accent, others = outline `line`; decided cards drop to 55% opacity.
- **CalendarCell** — square, radius 8, mini ProgressRing (30 pt) + day number; selected = 2 pt accent border + surfaceAlt fill; neutral (no tasks) = track only.
- **StatTile** — surfaceAlt, radius 8, number 18 pt display bold + 10 pt label.
- **EmptyState** — centered muted 13 pt line; morning: "A clean slate. What is the one thing for today?"; all done: sage circle check + "All done for today".
- **Nav** — segmented pill in surfaceAlt; selected segment `surfaceAlt`-on-`surface` contrast inverted (light: selected = ink text on pale sage; unselected = muted).
- **Widget (medium)** — surface card, radius 14, ring (56 pt) with open count, "n of m done / streak", top 4 tasks with 16 pt circle checks. Must survive tinted/clear widget styles: never encode state by color alone (ring + count + check glyph).
- **Sticker accent** — one lily cut-out (`design/stickers/lily.png`) may sit outside the window at the bottom-right of the desktop widget/onboarding art; never inside content rows. A small pink star is used on the About screen only. Keep to one sticker per surface.

## Motion (named hooks from the spec)

| Hook | Sage Lily behavior |
|---|---|
| `taskComplete` | Check fills with scale 0.6 → 1.15 → 1 over 250 ms ease-out; row fades to 45% and slides below open rows over 300 ms |
| `taskAdd` | Row fades in + rises 8 pt, 200 ms |
| `taskRemove` | Fade out 150 ms |
| `reorder` | Default SwiftUI move animation, 200 ms |
| `dayRollover` | Cross-fade of the list, 400 ms |
| `reviewCardSwipe` | Card slides toward the chosen side 12 pt and settles, 200 ms |
| `allDoneCelebration` | Sage circle-check pops (same curve as complete), header line fades in; no confetti |
| `streakIncrement` | Number ticks up with a 150 ms fade |

Reduce Motion: all of the above become instant opacity changes.

## Sound

Off by default (spec). If enabled: one soft "tick" on complete; nothing else.

## App icon

Layered icon: milk rounded square, deep-sage circle, white check; a single lily petal shape in
rose at 20% behind the circle for the default/dark styles; drop the petal in tinted/clear.

## Name styling

Menu bar and Dock: **To Dew** (title case, Jost 500). Lowercase "to dew" was tested in other
directions and is not used here.
