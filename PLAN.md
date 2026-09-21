# To Dew — Build Plan

How to go from the product spec (`SPEC.md`) and the chosen theme (`design/theme-sage-lily.md`)
to a shipped 1.0, with Claude Code doing the coding. One milestone per branch and pull request.

## 0. Ground rules that make everything else cheap

1. **Logic before UI.** `DailyCore` is a Swift package with zero UI imports and a full test
   suite. Every rule in the spec's *Edge cases and acceptance tests* table becomes a test there
   before the matching UI exists. Claude can run these from the command line and fix them alone.
2. **One theme layer.** No literal colors, fonts, sizes, radii or animation curves inside views.
   Everything comes from `@Environment(\.theme)`. `SageLilyTheme` and `TestTheme` both exist from
   milestone 2, and switching them in Settings must change every pixel.
3. **One store actor.** All writes go through `Store` (an actor over SwiftData) so the app and the
   widget never conflict. Rollover is one transaction and is idempotent.
4. **Injected clock.** `DayClock` takes a `now: () -> Date`; tests simulate sleep gaps, DST and
   time-zone jumps.
5. **Human in the loop for UI.** Claude cannot see the running app. After each UI milestone,
   build, run, screenshot, and paste the screenshots back.

## 1. Repository layout

```
to-dew/
├── SPEC.md                     # product spec (source of truth; keep in sync)
├── CLAUDE.md                   # build/test commands + rules for Claude Code
├── PLAN.md                     # this file
├── CHANGELOG.md
├── LICENSE                     # MIT
├── README.md                   # install paths + Gatekeeper walkthrough (milestone 9)
├── Config/Shared.xcconfig      # TEAM_ID blank; BUNDLE_PREFIX = com.<you>.todew
├── design/
│   ├── theme-sage-lily.md      # the chosen direction, human-readable
│   ├── theme-sage-lily.json    # the same as tokens
│   ├── SageLilyTheme.swift     # starter for DailyUI/Theme (move into the package at M2)
│   ├── stickers/               # lily.png, star-pink.png
│   └── mockups/                # exported PNGs of the canvas rows (Today, Review, History, Widget)
├── Packages/
│   ├── DailyCore/              # models, DayClock, RolloverEngine, RecurrenceEngine,
│   │   ├── Sources/DailyCore   #   StreakCalculator, QuickEntryParser, Store, Export/Import
│   │   └── Tests/DailyCoreTests
│   └── DailyUI/                # Theme protocol + themes, component library, views
│       ├── Sources/DailyUI
│       └── Tests/DailyUITests  # snapshot tests per component state
├── App/                        # ToDew.app target: entry, windows, menus, Dock, notifications, Settings
├── Widget/                     # ToDewWidget target: WidgetKit views + App Intents
├── ToDew.xcodeproj
└── .github/workflows/ci.yml    # swift test on DailyCore/DailyUI each push; release zip on tags
```

## 2. Core design decisions (decide once, in M1)

- **Logical date.** `DayClock.logicalDate(for: Date) -> Day` subtracts `rolloverMinutes`
  (default 360) then takes the calendar date in the current zone. `Day` is a `Codable` struct of
  year/month/day with no time zone. Nothing else computes dates.
- **Rollover.** `RolloverEngine.run(now:)` compares `AppState.lastOpenedLogicalDay` to
  `DayClock.today`. If today is later: close every missed day in order (write a `DayRecord`,
  mark unfinished recurring instances `missed`), generate today's recurring and scheduled tasks,
  collect leftovers grouped by original day, and return `.review(leftovers)` or `.fresh`. Runs in
  one transaction. Running it twice on the same day is a no-op. A backward clock does nothing.
- **Streaks.** `StreakCalculator` reads only `DayRecord`s. A day with `totalCount == 0` is
  neutral. Current streak = consecutive successful days ending yesterday, +1 if today has a
  completion. Longest is stored on `AppState` and only ever raised.
- **Quick entry.** `QuickEntryParser.parse("Call dentist 3pm !") -> ParsedEntry(title, dueTime,
  flag, scheduledDay)` — pure function, exhaustively tested. Multi-line paste → one entry per line.
- **Recurrence.** `RecurrenceRule` enum: `.daily`, `.weekdays`, `.weekdays(Set<Weekday>)`,
  `.everyNDays(n, from: Day)`, `.monthly(dayOfMonth)` with clamp-to-last-day. `nextOccurrence(after:)` only.
- **Store.** `actor Store` owns the `ModelContainer` in the App Group container and exposes
  intent-shaped methods (`add`, `complete`, `move`, `drop`, `reorder`, `runRollover`, `snapshotForWidget`).
  Every mutation also calls `WidgetCenter.reloadTimelines`.
- **Undo.** Each mutation returns an inverse closure registered with the window's `UndoManager`.

## 3. Milestones

Each ends in something that runs and can be checked. Suggested prompt to open each one is in §5.

| # | Branch | Deliverable | Done when |
|---|---|---|---|
| 0 | `m0-scaffold` | Xcode project, two packages, CI, xcconfig, App Group spike | `swift test` runs empty; Dock icon appears; **widget App Group works or is ruled out under free signing** (decides whether the prebuilt zip ships the widget) |
| 1 | `m1-core` | `DailyCore` complete with tests | Every row of the spec's acceptance table passes from `swift test`; `QuickEntryParser` and `RecurrenceRule` at 100% branch coverage |
| 2 | `m2-today` | Theme layer + Today list | `Theme` protocol, `SageLilyTheme`, `TestTheme`; components: TaskRow, Checkbox, ProgressRing, DayHeader, EntryField, EmptyState, each with an Xcode preview of every state; add/complete/edit/reorder/drop/undo; keyboard table from the spec; data persists; window min 360×480; hidden title bar |
| 3 | `m3-rollover` | Live rollover + Morning review | Rollover on launch/wake/focus/clock change/6 AM timer; review screen with ReviewCard, K/L/S/D keys, Keep all / Drop all, Someday pull, Skip; carry-count nag at threshold; reopen from View menu |
| 4 | `m4-planning` | Upcoming, Someday, Recurring | Grouped Upcoming with drag between days; Someday with stale marker; templates with pause and 7-day history row; quick-entry scheduling tokens |
| 5 | `m5-history` | History + stats + export | Month heat map with CalendarCell, day detail, search, duplicate-to-today, StatTile row, JSON/Markdown export, import, delete-older-than |
| 6 | `m6-system` | Notifications, Dock, Settings, floating icon | All four notification types with refreshed text; badge modes; Dock menu with five tasks; Settings window (every setting in the spec); launch at login; floating `NSPanel` icon behind a setting (try for a week, then keep or cut) |
| 7 | `m7-widget` | WidgetKit widget | Small/medium/large; App Intent checkboxes; timeline entry at next rollover; renders in tinted and clear styles without color-only meaning |
| 8 | `m8-design` | Final visual pass | Sage Lily applied end to end against `design/mockups`; motion hooks implemented per theme; completion sound; layered app icon; light + dark checked on a real screen; Reduce Motion / Increase Contrast honored |
| 9 | `m9-release` | 1.0 | VoiceOver pass, 500-task perf pass, README with screenshots and Gatekeeper steps, tagged `v1.0.0`, release zip built by CI |

Design work is not deferred entirely to M8: from M2 on, views are built against `SageLilyTheme`
so the human check after each milestone is also a design check. M8 is polish, not a rewrite.

## 4. Component library (DailyUI)

Build each once in M2–M5, with a preview that shows every state listed:

| Component | States to preview |
|---|---|
| `Checkbox` | open, done, hover, pressed, mid-animation, widget size |
| `TaskRow` | open, done, flagged, carried (2d), recurring, with due time, with note collapsed/expanded, editing title, 200-char title, RTL, emoji |
| `ProgressRing` | 0%, 40%, 100%, neutral, widget size |
| `DayHeader` | morning empty, in progress, all done, streak hidden |
| `EntryField` | empty, typing, with parsed chips, multi-line paste |
| `ReviewCard` | undecided, each of the four choices, nag at threshold |
| `CalendarCell` | neutral, partial, full, selected, today, future |
| `StatTile` | number, percentage, dash |
| `EmptyState` | morning, all done, no history, empty Someday |
| `FloatingIcon` | ring with count, all-done check, idle-faded |

Snapshot-test each preview in both themes and both color schemes so the "no literal styling" rule
is enforced by CI, not by review.

## 5. Working with Claude Code

Per milestone, open a branch and start Claude Code in the repo with a prompt of this shape:

> Read CLAUDE.md, SPEC.md and PLAN.md. We are on milestone **N** (`branch-name`). Implement the
> deliverable in PLAN.md §3 row N. Work test-first in DailyCore where the milestone touches logic.
> Do not hard-code any color, font, size, radius or animation in a view — read the theme from the
> environment. When you need to see the app, stop and tell me what to run and screenshot.
> Finish by updating CHANGELOG.md and listing anything in SPEC.md you had to interpret.

Good habits that keep the loop tight:

- **M1 first and alone.** It is pure Swift with tests Claude can run; let it iterate without you.
- **Paste screenshots, not descriptions,** for every UI milestone. Include one light, one dark.
- **Keep SPEC.md the truth.** When a decision changes in conversation, ask Claude to edit SPEC.md
  in the same PR.
- **Short PRs.** If a milestone grows past ~800 lines of diff, split it (e.g. M3a rollover, M3b review).
- **Use the mockups.** Export the Sage Lily row of the canvas to `design/mockups/` and reference
  the files by name in prompts ("match `today.png` spacing").

## 6. Risks and how each milestone retires them

| Risk | Retired by |
|---|---|
| Widget App Group under ad-hoc signing | M0 spike; fallback = zip ships without widget, README says build from source |
| Rollover edge cases (DST, sleep, backward clock) | M1 tests with injected clock, before any UI |
| Theme layer leaks (a literal color somewhere) | Snapshot tests in `TestTheme` from M2; a leaked value shows up as a wrong color in CI |
| Custom fonts and Dynamic Type | `.custom(_:size:relativeTo:)` in the theme; check Larger Text in M2 |
| Notifications when the app is closed | Scheduled daily trigger with refreshed body in M6; test by quitting and waiting |
| 500-task performance | `LazyVStack` + stable IDs from M2; perf pass in M9 |

## 7. First three things to do today

1. `git init`, commit `SPEC.md`, `CLAUDE.md`, `PLAN.md`, `design/`, `LICENSE`.
2. Open Claude Code on `m0-scaffold` with the §5 prompt. Its only question back should be the
   bundle prefix — answer `com.<your GitHub username>.todew`.
3. While M0 builds, export the Sage Lily artboards (Today, Review, History, Widget) as PNGs into
   `design/mockups/` and put the two font families' TTFs into `App/Fonts/`.
