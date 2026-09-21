# To Dew — Build Plan

How to go from the product spec (`SPEC.md`) and the chosen theme (`design/theme-sage-lily.md`)
to a shipped 1.0, with Claude Code doing the coding. Ten milestones, twenty pull requests.

## 0. Ground rules that make everything else cheap

1. **Logic before UI.** `DailyCore` is a Swift package with zero UI imports — not SwiftUI, not
   AppKit, not WidgetKit — and a full test suite. Each row of the spec's *Edge cases and acceptance
   tests* table becomes a named test before the matching UI exists. Claude runs these from the
   command line and fixes them alone.
2. **One theme layer.** No literal colors, fonts, sizes, radii, stroke widths, opacities, shadows,
   materials or animation curves inside views. Everything comes from `@Environment(\.theme)`. If a
   value has no token, **the missing token is the bug** — add it to the protocol and to both themes,
   never the number to the view. `SageLilyTheme` and `TestTheme` both exist from 2a, and `TestTheme`
   must differ from Sage Lily in *every* token group or the comparison passes vacuously.
3. **One store actor, one writer.** All writes go through `Store`, an `@ModelActor` over SwiftData.
   An actor serialises one process, not two: the app is the only writer, the widget opens the store
   read-only, and the single exception is the widget's checkbox intent. Rollover commits in one
   `save()` and is idempotent.
4. **Injected clock.** `DayClock` takes `now: @Sendable () -> Date` and
   `timeZone: @Sendable () -> TimeZone`; tests simulate sleep gaps, DST and time-zone jumps. Both
   packages build in Swift 6 language mode, pinned in milestone 0.
5. **Human in the loop for UI, on rails.** Claude cannot see the running app. From 2c the app takes
   `-ToDewFixture <name>` and `-ToDewNow <ISO-8601>` (debug only) so the states that break layouts
   can actually be put on screen. One screenshot round per UI pull request, taken when the code
   compiles, both suites are green and the theme lint exits 0 — not after the PR is written.
6. **Green before merge.** `main` is protected. The checks job passes and the exit checklist (§3.1)
   has no fail or not-run line before a PR merges. A milestone that needs a gate relaxed changes the
   gate in its own PR, with the reason in the description. It never merges around it.

## 1. Repository layout

```
to-dew/
├── SPEC.md                     # product spec (source of truth; keep in sync)
├── CLAUDE.md                   # build/test commands + rules for Claude Code
├── PLAN.md                     # this file
├── CHANGELOG.md
├── LICENSE                     # MIT
├── README.md                   # install paths + Gatekeeper walkthrough (milestone 9)
├── Config/Shared.xcconfig      # DEVELOPMENT_TEAM blank; BUNDLE_PREFIX = com.<you>.todew;
│                               #   APP_GROUP = $(DEVELOPMENT_TEAM).$(BUNDLE_PREFIX)
│                               #   (a run-script phase fails the build when the team is empty)
├── scripts/
│   ├── release.sh              # builds, ad-hoc signs and zips ToDew.app (milestone 0)
│   └── lint-theme.sh           # no styling literal survives in a view (milestone 2a)
├── docs/                       # spike decision records (milestone 0) + interpretations.md
├── design/
│   ├── theme-sage-lily.md      # the chosen direction, human-readable
│   ├── theme-sage-lily.json    # the same as tokens
│   ├── SageLilyTheme.swift     # starter for DailyUI/Theme (move into the package at 2a)
│   ├── stickers/               # lily.png, star-pink.png
│   └── mockups/                # today.png, review.png, history.png, widget.png (milestone 0)
├── Packages/
│   ├── DailyCore/              # models, DayClock, RolloverEngine, RecurrenceEngine,
│   │   ├── Sources/DailyCore   #   StreakCalculator, QuickEntryParser, Settings, Store, codecs
│   │   └── Tests/DailyCoreTests
│   └── DailyUI/                # Theme protocol + themes, component library, views
│       ├── Sources/DailyUI
│       │   └── Resources/Fonts # the five TTFs, processed into the package bundle
│       └── Tests/DailyUITests
│           └── __Snapshots__/<arch>/   # baselines, per architecture, committed
├── App/                        # ToDew.app: entry, windows, menus, Dock, notifications, Settings
├── Widget/                     # ToDewWidget: WidgetKit views + App Intents
├── ToDew.xcodeproj
└── .github/workflows/ci.yml    # runs-on macos-26 with an explicit xcode-select to Xcode 26.
                                #   PRs: both packages' tests, coverage, theme lint, no-network
                                #   grep, xcodebuild of App and Widget with signing off.
                                #   Nightly + tags: XCUITest smoke. Tags: release zip, unzipped
                                #   and launched. The zip is ad-hoc signed — see milestone 0.
```

## 2. Core design decisions (decide once, in milestone 1)

- **Logical date.** `DayClock.logicalDate(for: Date) -> Day` reads the **wall-clock** hour and minute
  of `now` in the current zone and returns that calendar date, minus one day if the time is before
  `rolloverMinutes` (default 360). It never does absolute-time arithmetic on a `Date`: subtracting
  six hours across a DST transition lands an hour off in both directions while neither skipping nor
  duplicating a day, so the defect survives the spec's DST acceptance row. `Day` is a `Codable`
  struct of year/month/day with no time zone. `DayClock.date(for:atMinutes:)` is the only inverse —
  notifications, the heat map and export all go through it — computed against
  `Calendar(identifier: .gregorian)` with the zone read from `TimeZone.autoupdatingCurrent` at each
  call, never captured at init; the system calendar, which may not be Gregorian, is for display
  only. Nothing else computes dates.
- **Rollover.** `RolloverEngine.run(now:)` compares `AppState.lastOpenedLogicalDay` to
  `DayClock.today`. If today is later: close every missed day in order (write a `DayRecord`, mark
  unfinished recurring instances `missed`), generate today's recurring and scheduled tasks, collect
  leftovers grouped by original day, and return `.review(leftovers)` or `.fresh`. It runs on a
  dedicated `ModelContext` with `autosaveEnabled = false`, mutates only in memory, and commits with
  a **single `save()`**; any error calls `rollback()` and discards the context.
  `ModelContext.transaction(_:)` is not used — it does not roll back on error.
  `lastOpenedLogicalDay` is written inside that same save, so idempotency is a guard and not a
  cleanup pass. Running it twice on the same day is a no-op. A backward clock does nothing.
  `RolloverEngine.preview(for: Day)` projects a future day **without writing**; the widget timeline
  and the notification queue both need it.
- **Streaks.** `StreakCalculator` reads only `DayRecord`s. A day with `totalCount == 0` is neutral.
  A day with tasks and no completion is a failure — including a day the app was never opened on.
  *(Settled 2026-09-21. Not re-opened.)* Current streak = consecutive successful days ending
  yesterday, +1 if today has a completion. Longest is stored on `AppState` and only ever raised.
- **Quick entry.** `QuickEntryParser.parse("Call dentist 3pm !") -> ParsedEntry(title, dueTime,
  flag, scheduledDay)` — pure function, exhaustively tested. Multi-line paste → one entry per line.
- **Recurrence.** `RecurrenceRule` enum: `.daily`, `.weekly(Set<Weekday>)` with `.weekdays` as a
  static convenience for Mon–Fri (**not** a second case of the same name — two cases called
  `weekdays` is a redeclaration error), `.everyNDays(Int)`, `.monthly(dayOfMonth:)` with
  clamp-to-last-day. The N-day anchor comes from the template's `lastGeneratedDay`, never from the
  rule, so pausing and resuming produces no catch-up burst. The rule persists as a `Codable`
  attribute and therefore cannot appear in a `#Predicate`: templates are fetched whole and matched
  in memory, bounded by template count rather than task count.
- **Store.** `@ModelActor actor Store` owns the `ModelContainer` in the App Group container — a
  plain Swift actor gives mutual exclusion but not the serial executor `ModelContext` needs. It
  exposes intent-shaped methods (`add`, `complete`, `move`, `drop`, `reorder`, `runRollover`,
  `snapshotForWidget`) taking and returning `Sendable` value types only: `@Model` instances are not
  `Sendable` and never cross the actor boundary. Mutations publish a change event; the **app
  target** — not Core, which imports no WidgetKit — calls `WidgetCenter.reloadTimelines(ofKind:)` on
  a ~250 ms trailing debounce, so a 500-task drag-reorder is one reload. Rollover issues exactly one,
  after its save commits.
- **Settings.** One `Settings` `Codable` struct in `DailyCore` holds all eighteen controls from
  `SPEC.md:551–555` with their spec defaults, persisted through `Store` into the App Group's shared
  `UserDefaults` suite so the widget reads the same values — `@AppStorage` in the App target is
  invisible to the widget, whose timeline would then use the wrong rollover hour. Changing
  `rolloverMinutes` re-runs rollover immediately.
- **Schema.** `enum SchemaV1: VersionedSchema` holds all four entities,
  `ToDewMigrationPlan: SchemaMigrationPlan` carries V1 as its only stage, and
  `AppState.schemaVersion` is written on first launch. The one decision here that cannot be
  retrofitted at any price: SwiftData cannot retroactively identify an unversioned store.
- **Undo.** Each mutation returns a `Sendable` `InverseAction` **value** that captures no `@Model`;
  the app layer — not Core, which imports no `UndoManager` — turns it into a registration on the key
  window, with redo through the Edit menu. The stack is cleared where rollover commits: undoing
  across a frozen `DayRecord` would desynchronise history from tasks silently and permanently.
- **Open question — the view read path.** Whether a SwiftUI `@Query` reliably observes a save made
  on the `Store` actor's context is unverified. Spike S2 in milestone 0 settles it and `2c` is
  written against whatever it records; if `@Query` cannot be trusted, no view imports SwiftData and
  views consume `Sendable` snapshots vended by `Store`. The `@Model`-never-crosses-the-boundary rule
  above holds under either answer, which is why it is stated as a rule and this is not.

## 3. Milestones

Ten milestones, twenty pull requests. Lettered rows are separate PRs inside one milestone; a
milestone closes when its last lettered row merges. Rows `1a`, `1b`, `1c` and `6b` end in a
`swift test` run and need no screenshots; row `0` ends in six decision records; **every other row
ends on screen and its "Done when" names the shots to paste** — one human round trip per PR.

Every row that adds an interactive element also adds its VoiceOver label, and every task row exposes
toggle-done, flag and drop as custom actions, in the PR that creates it. Milestone 9 audits
accessibility; it does not implement it.

Each cell below is a list of **gates**, not of features: every clause names the command that settles
it or the numbered screenshot that shows it. A clause that names neither is a bug in this plan —
report it rather than interpreting it.

**The widget is milestone 4, not 7.** It needs milestone 0's signing result, milestone 1's store and
`preview(for:)`, 2a's theme, 2b's components and 3a's rollover path — and nothing from planning,
history or system. It is also the only row a milestone-0 result can delete outright. Retire that
first.

| # | Branch | Deliverable | Done when |
|---|---|---|---|
| 0 | `m0-scaffold` | Xcode project, two packages, CI, xcconfig, release script, six spikes | `swift test` runs empty on both packages under Xcode 26 on a `macos-26` runner with an explicit `xcode-select`; both packages build in Swift 6 language mode; `./scripts/release.sh` produces a launchable `ToDew.zip` locally and from a tag; a placeholder Dock icon appears; `APP_GROUP` derives from `$(DEVELOPMENT_TEAM).$(BUNDLE_PREFIX)` and a run-script phase fails the build readably when the team is blank; `design/mockups/{today,review,history,widget}.png` and the five font files are committed. Six decision records, each with pasted console output: `docs/m0-signing.md` (S1 — three results, with `codesign -d --entitlements -` for each: **E1** Xcode + free Personal Team, Team-ID-prefixed group; **E2** ad-hoc, as CI builds; **E3** E1's zip on a second Mac not registered to the builder — plus one line answering whether any location exists that the app can write and the extension can read); `docs/m0-readpath.md` (S2 — does `@Query` observe an `@ModelActor` save; does a cross-process write reach the app within 1 s); `docs/m0-durability.md` (S3 — one `save()` across `exit(0)` leaves 0 or 200 changed, never partial); `docs/m0-executor.md` (S4 — which thread an `@ModelActor` runs on, per construction site); `docs/m0-freesigning.md` (S5/S7 — notification authorization and `SMAppService.register()` for an ad-hoc build in `~/Downloads`, `/Applications` and DerivedData); `docs/m0-textsize.md` (S6 — whether macOS 26's Accessibility ▸ Display text size moves anything in a third-party app; human screenshots before and after). **Kill clause: if E1 is false, milestone 4 is deleted from this table and `SPEC.md`'s widget section struck, in this PR** — a sandboxed extension with no group container has no shared path to read, so there is no snapshot-file consolation and no source-build consolation either. Spike code lives in `spikes/`, is deleted in this PR, and does not count toward the diff budget. |
| 1a | `m1a-model-and-time` | `Day`, `DayClock`, schema, entities, `Settings` | `swift test --package-path Packages/DailyCore` passes. `logicalDate` reads wall-clock time and returns *today* at 06:00 local on both 2027 DST transition days; a rollover time of 02:30 — inside the spring-forward gap, which the 12:00 AM–12:00 PM setting range permits — resolves to exactly one instant. `date(for:atMinutes:)` is the only `Day`→`Date` conversion in the package (CI grep) and reads `TimeZone.autoupdatingCurrent` per call against a Gregorian calendar. Acceptance rows SPEC 616, 632, 635, 638 each have a test named `…_specNNN`. `SchemaV1` holds all four entities, `ToDewMigrationPlan` has V1 as its only stage, a checked-in V1 fixture store opens and migrates, and `AppState.schemaVersion` is written on first launch. No public API returns a `@Model` instance (CI grep). The `Settings` struct holds all eighteen controls with spec defaults, persists to the App Group suite, and a test enumerates all eighteen keys. |
| 1b | `m1b-engines` | Parser, recurrence, streaks, statistics | `./scripts/coverage.sh` reports 100% region coverage for `QuickEntryParser.swift` and `RecurrenceEngine.swift`, command and output in the PR body. `RecurrenceRule` compiles with no duplicate case and takes its N-day anchor from `lastGeneratedDay`, so a paused-then-resumed template generates today only and no catch-up burst. A day with tasks and no completion is a failure, including one the app was never opened on; a zero-task day is neutral. The six statistics from SPEC 337–350 each have a test for their definition. Acceptance rows SPEC 654, 659, 661 each have a named test. |
| 1c | `m1c-store-and-rollover` | `Store`, rollover, undo values | `Store` is an `@ModelActor` constructed off the main actor per `docs/m0-executor.md`; its methods take and return `Sendable` value types only. Rollover runs on a scratch `ModelContext` with `autosaveEnabled = false` and commits with one `save()`, `rollback()`-and-discard on error; `ModelContext.transaction(_:)` appears nowhere (CI grep); `lastOpenedLogicalDay` is written inside that save. Acceptance rows SPEC 621, 623, 627, 629, 645, 648, 651, 656 each have a named test, 629 driven by a harness that `exit(0)`s before and after the save and asserts the store is fully old or fully new. Every mutation returns a `Sendable` `InverseAction` capturing no `@Model`; no `UndoManager` symbol appears in `DailyCore` (CI grep). `preview(for:)` leaves the store file unchanged, asserted by a test. `DailyCore` imports no SwiftUI and no WidgetKit (CI grep). |
| 2a | `m2a-theme` | Theme protocol, both themes, fonts, catalog, harness | **May start the day milestone 0 closes, concurrently with milestone 1** — it imports nothing from `DailyCore` and is the only parallelism this plan has. `Theme` carries colors, type (with line height and tracking), space, radius, sizes, **stroke** (hairline, checkbox border, ring, selected border), **opacity** (done, disabled, idle icon, decided card), **shadow**, **materials**, motion and sound — one member per key in `design/theme-sage-lily.json`. `SageLilyTheme` reads every token group; `TestTheme` differs in every group, and a test fails if any two-theme snapshot pair is identical. All eight named motion hooks are declared here; `TestTheme` returns `.linear(duration: 1)` and the Reduce Motion path returns `.none`. **The type-scale question is settled in this PR, before any component exists** (see §6): read `docs/m0-textsize.md`, and unless it shows the system control moving a third-party app, ship a fixed scale and propose the `SPEC.md:452` edit in this PR. The five fonts live in `Sources/DailyUI/Resources/Fonts`, are registered by `DailyUI` at first use, and `App/Fonts` references the same files; `FontRegistrationTests` fails if `NSFont(name: "Jost-Regular", …)` or `NSFont(name: "CormorantGaramond-Medium", …)` resolves to a fallback — **no snapshot baseline is valid until it passes**, because a SwiftPM test run is not the app bundle and falls back silently. `Localizable.xcstrings` exists and `./scripts/lint-theme.sh` exits 0, including its bare-`Text("` rule. Previews and tests read one array of preview states; each `#Preview` renders from it. The harness renders any entry under both themes × light/dark, proved end to end on `Checkbox`. Screenshots: `Checkbox` in every state, both themes, light and dark. |
| 2b | `m2b-components` | `TaskRow`, `ProgressRing`, `DayHeader`, `EmptyState` | Each has previews for its §4 states **and** the six `CLAUDE.md` states, and each snapshots differently under both themes in light and dark. A 200-character title, an emoji title and an RTL title each render at 360 pt with the full text reachable as tooltip and VoiceOver label (SPEC 465, 672). `DayHeader` carries the pink star to the left of the greeting line in every state, and **the greeting is inset far enough that the star never overlaps it** — the whole of "Good morning" reads clear. (The Sage Lily mockup draws the star on top of the first word; that is a mockup artefact, not the design.) Its size, offset, the greeting's leading inset and its dark-scheme treatment are set against the mockup in the screenshot round and **not guessed** — that is the one open metric in this PR. Screenshots: the full preview grid per component, light and dark, plus `DayHeader` at 360 pt. |
| 2c | `m2c-today` | Today view, persistence, window, fixtures | The read path is whatever `docs/m0-readpath.md` settled. Today renders in a `LazyVStack` with stable IDs. Completed rows dim and sink below open rows and a toggle hides them (SPEC 131); flagged-pin-to-top honours its setting (SPEC 126). Window minimum 360×480, hidden title bar with traffic lights in place, frame restored across relaunch via a named `.windowFrameAutosaveName` (SPEC 135). Debug-only `-ToDewFixture` and `-ToDewNow` land here with the fixtures every later round needs: `empty, one, fifty, long, alldone, loading, carried, review3, month90, someday, recurring, fivehundred`. Three XCUITest smoke tests exist (launch shows Today within 3 s; a typed task survives a relaunch; Settings opens and closes) and run nightly and on tags, never blocking a PR. Instruments' Animation Hitches shows no hitch over 16 ms scrolling the `fivehundred` fixture **in this PR, not milestone 9**. Screenshots: `empty`, `fifty`, `alldone`, `loading` at 720 and `fifty`, `long` at 360, light and dark. |
| 2d | `m2d-entry-detail-keys` | Entry, detail inspector, mutations, undo, keyboard | `EntryField` parses through `QuickEntryParser`, highlights parsed chips and dismisses them with Escape. The Escape conflict (SPEC 185 vs 198) is **already settled** — resolved in `SPEC.md` on 2026-09-21, see `review/05-spec-edits.md` item 6 — so this PR implements the settled binding and does not re-decide it. A `TaskDetail` inspector opens on `Cmd I` editing note (links clickable, SPEC 163) and due time. Add, complete, edit, reorder and drop each return an `InverseAction` the app layer registers, with redo through the Edit menu. The eight Today-scoped shortcuts (`Cmd N`, `Up`/`Down`, `Space` and `Cmd Return`, `Return`, `Cmd I`, `Cmd Shift F`, `Cmd Option Up`/`Down`, `Delete` with `Cmd Z`) each have a test that sends the key equivalent and asserts the store mutation. `Cmd T`, `Cmd Shift S` and `Cmd 1`–`5` are in the menus, **disabled with a visible reason**, until 5a. The `taskComplete`, `taskAdd`, `taskRemove` and `reorder` hooks are invoked at their call sites and collapse to an instant opacity change under Reduce Motion. Screenshots: entry with parsed chips, inline edit, the inspector with a long linked note, a selected row. |
| 3a | `m3a-rollover-live` | Live rollover and its triggers | The check runs on launch, `NSWorkspace.didWakeNotification`, window focus, `NSSystemClockDidChange`, `NSSystemTimeZoneDidChange`, and a timer scheduled with `Calendar.nextDate(after:matching:matchingPolicy:.nextTime, repeatedTimePolicy:.first)` so a rollover time in the spring-forward gap still fires exactly once; firing all five triggers within a second runs rollover once. Acceptance row SPEC 618 verified by holding the app open across a simulated 06:00 with no restart, and SPEC 629 by killing the running app mid-rollover and relaunching. The undo stack is cleared where rollover commits, asserted by a test that `Cmd Z` afterwards cannot alter a frozen `DayRecord`. Exactly one widget reload fires after the save, from the app target; ordinary mutations coalesce on the debounce. Screenshots: the list before and after a simulated rollover. |
| 3b | `m3b-review` | Morning review | `ReviewCard` with its full preview set including the nag. The review appears on the first open after a rollover with leftovers and never when there are none; leftovers group by original day. `K`/`L`/`S`/`D` plus `→` and `←`, Keep all, Drop all, the collapsed Someday pull list, Skip; `Later` offers tomorrow, a weekday or a date. Each choice has a test asserting its store outcome (Keep → carry +1 and stays today; Someday → day nil; Drop → dropped but kept in history; Skip → every leftover kept with carry +1). The yesterday recap line, the streak increment and "Start the day" returning to Today with the entry focused. The nag fires at the threshold **setting**, not a literal, and reads in text rather than colour alone. Reopen from the View menu is available **only until the first completion of the day** (SPEC 258), and reopening never double-increments a carry count. `reviewCardSwipe`, `dayRollover`, `streakIncrement` and `allDoneCelebration` are invoked. Screenshots: review with 1, 5 and 0 leftovers, the nag, and 360 pt where four choice buttons are hardest; one recording of `reviewCardSwipe`. |
| 4 | `m4-widget` | WidgetKit widget | **Gated on `docs/m0-signing.md` E1 = true; if E1 is false this row does not exist.** Small (ring, done/total, streak), medium (top four plus progress) and large (up to ten plus progress and streak) render from a `Sendable` `snapshotForWidget` value. The widget opens the store read-only and never runs rollover, which writes. The timeline carries an entry at the next rollover from `preview(for:)` with `.after(nextRollover)` as the reload policy; the PR notes that a sleeping Mac refreshes on wake, not at 06:00. Legible in **both rendering modes the Mac desktop produces**, read from `\.widgetRenderingMode`, with the PR recording which values it actually observed and no meaning carried by colour alone. The checkbox App Intent is scoped to one `complete(TaskID)` and posts a change notification the app refetches on; acceptance row SPEC 663 verified at under 1 second, measured three times, and SPEC 666 verified with the app quit. App and widget writing within the same second lose neither write. Widget-origin mutations are **not** undoable unless the intent runs in the app process; this PR decides which and proposes the matching `CLAUDE.md` amendment ("every app-originated mutation is undoable"). `scripts/release.sh` sets its include-widget switch from E2/E3 and the README states which install path gets a widget. Screenshots: three sizes in both rendering modes. |
| 5a | `m5a-nav-upcoming` | Navigation and Upcoming | A `Nav` component (segmented pill in `surfaceAlt`) hosted in the single main window switches Today / Upcoming / Someday / Recurring / History; `Cmd 1`–`5` go live; the selection persists across launch. Without this row 5b and 6a are unreachable UI. Upcoming groups Tomorrow → the next seven weekdays → by date, supports adding directly to a future day and dragging between days, and a scheduled task stays hidden from Today until its own rollover. `Cmd T` goes live. Due time, note and flag are settable ahead through the 2d inspector. Screenshots: `Nav` with each segment selected at 360 pt and 720; Upcoming with and without items. |
| 5b | `m5b-someday-recurring` | Someday and recurring templates | Someday is one undated, manually ordered list with add-to-today, schedule and drop, a stale marker past 60 days and no auto-delete; `Cmd Shift S` goes live. Recurring templates list with pause and a seven-day done/missed history row returning exactly seven entries. Editing a generated instance **detaches it** — `templateID` kept for history, template untouched — and editing a template changes only instances generated after the edit (SPEC 284–285); both covered by `DailyCore` tests. Quick-entry scheduling tokens ("tomorrow", "fri") create scheduled tasks, table-tested against a frozen clock on a Wednesday and a Sunday. Screenshots: Someday with a stale item; the recurring list with a paused template and its history row. |
| 6a | `m6a-history` | History, day detail, statistics | Month heat map of `CalendarCell` with day detail showing done, dropped, carried and missed-recurring; a neutral day and a zero-completion day are distinguishable without colour. Search across past titles and notes, case- and diacritic-insensitive; duplicate-to-today creates a new id with carry 0 and leaves the original untouched. All six statistics from SPEC 337–350 render as `StatTile`s, computed by 1b. Scrolling twelve months of a seeded store shows no hitch over 16 ms. Screenshots: heat map, a day detail, the stat row at 720 and at 360 where six tiles must wrap rather than truncate, light and dark. |
| 6b | `m6b-data` | Export, import, pruning | JSON export → wipe store → JSON import reproduces a **byte-identical re-export**, covering `originalDay` and `carryCount`. Markdown export of a checked-in fixture day matches a golden file, re-recordable only behind an env var CI does not set. "Delete history older than" removes `DayRecord`s and `Task`s strictly before the cutoff and nothing else. An import written by a future `schemaVersion` is refused with a readable message rather than partially applied. |
| 7a | `m7a-settings` | Settings window | All eighteen controls are present over the 1a `Settings` struct, asserted by a test that enumerates its keys and a second that fails on a key with no control. Rollover time is constrained to 12:00 AM–12:00 PM in 30-minute steps and changing it from 6 to 4 at 5 AM triggers exactly one immediate rollover (SPEC 645). The theme picker switches `SageLilyTheme` and `TestTheme` and every pixel changes. Review-off makes leftovers auto-roll with no review (SPEC 260). An **off-by-default** "Check for updates" setting fetches the GitHub Releases feed at most once per launch and shows a "new version available" link — the app's only network call (SPEC 577–579) — with a test asserting zero `URLSession` traffic when it is off, and the CI grep permitting exactly that one file. Screenshots: every pane, light and dark. |
| 7b | `m7b-notifications-dock` | Notifications, badge, Dock menu, login | A rolling seven-day queue of **non-repeating** dated requests, each body computed at scheduling time from `preview(for:)` and the whole queue rewritten on launch, wake and mutation; a repeating trigger is not used because its content is frozen when scheduled. Verified by quitting and waiting **two** mornings, and by changing counts after quitting. All four types from SPEC 366–377. Authorization is requested the first time the user sets a due time or enables a reminder, **never at launch** — asserted by a test that launches with no setting touched and expects no authorization call. The due-time notification registers a category with **Done** and **Snooze 15 min** whose handlers complete or re-schedule +15 min. Tapping any notification routes to the named task or to the review. `.timeSensitive` only for due time, default interruption level otherwise, so Focus modes are honoured; no custom sound. Badge modes open count / flagged only / off, each tested against 0, 1 and 12 open and 3 flagged. Dock menu: New Task, at most five open tasks in list order, Show Today. Launch at login via `SMAppService`. **If `docs/m0-freesigning.md` records a failure outside `/Applications`**, this PR adds the "move to Applications" affordance, a "notifications unavailable" state in Settings and the README step; if it does not, it adds none of them. |
| 7c | `m7c-floating-icon` | Floating icon — **droppable row** | A non-activating `NSPanel` (`.nonactivatingPanel`, `level = .floating`, `collectionBehavior` with `.canJoinAllSpaces` and `.fullScreenAuxiliary`), off by default, ~44 pt, showing a ring with the open count that becomes a check when the day is done; click toggles the main window; right-click shows the same five-task menu as the Dock; it drags, snaps to screen edges, restores its frame **per display** across relaunch, fades when idle and never takes key focus; toggled in Settings **and** the View menu. Nothing depends on this row: deleting it is a revert. The keep-or-cut decision is **not** a gate here — it is already in `SPEC.md`'s "Still open" and is resolved before milestone 9 tags 1.0. Screenshots: the panel over a full-screen app and on a second display. |
| 8 | `m8-design` | Final visual pass | Every token group in `design/theme-sage-lily.json` is read by at least one view, proven by a test that fails when a token is never accessed — including `materials` (glass on the toolbar and entry bar only, **never** on a content row), `wallpaper` (window ground when `materials.window == "solid"`; light-only by decision, dark uses flat `background`) and `stickers` (the lily on the all-done empty state, the pink star in `DayHeader`). The eight motion hooks carry their Sage Lily durations and curves with **no new call sites added here**. A `Feedback` service plays the completion sound (off by default) and fires an `NSHapticFeedbackManager` alignment pattern, both routed through the theme so `TestTheme` silences them. A layered Icon Composer icon (default/dark/clear/tinted) replaces the placeholder; the Dock icon does **not** reflect day state — cut for 1.0 by decision. Reduce Motion and Increase Contrast each produce a distinct snapshot set, with `line`-on-`surfaceAlt` ≥3:1 and `ink`-on-`surface` ≥7:1 computed from the tokens. Screenshots: Today, Review, History and Widget × light/dark × 360/720, each named against its `design/mockups` counterpart, plus Reduce Motion, Increase Contrast, a clashing system accent the theme must override, and one recording per hook. |
| 9 | `m9-release` | 1.0 | Accessibility Inspector reports zero issues on Today, Review, Upcoming, Someday, Recurring, History and Settings — this row audits, it does not implement, because labels and actions were gated in the row that created each view. Instruments shows no hitch over 16 ms on a seeded 500-task day and cold launch under 1 second, measured three times (SPEC 669–670). Acceptance row SPEC 672 verified on a real 360 pt window in light and dark. The three XCUITest smoke tests pass on `macos-26`. `README.md` carries screenshots of all four surfaces, both install paths, the Open Anyway walkthrough and a plain statement of which path gets a widget. CI builds the release zip from tag `v1.0.0`, **unzips and launches it on the runner**, and the zip launches on a Mac that has never built the project. The floating-icon keep-or-cut decision is recorded in `SPEC.md`. |

Design work is not deferred to milestone 8: from 2a on, views are built against `SageLilyTheme`, and
the protocol declares `materials`, the stroke and opacity groups and all eight motion hooks **from
2a**, with each hook invoked in the row that creates its call site. Milestone 8 therefore changes
token *values* and adds no call sites — it is polish, not a rewrite. The human check after each UI
row is also a design check.

Export and import codecs live in `DailyCore` but are built in `6b` with the UI that calls them.
Milestone 1 is not "all of `DailyCore`"; it is the model, the engines and the store.

### 3.1 Exit checklist

Every PR body opens with this block. Claude posts it filled with the *cell's* clauses before writing
code, and fills in the results before handing back.

```markdown
## Exit checklist — row N
Gates, with real output pasted: core tests · UI tests (2a+) · coverage (1b+) ·
theme lint (2a+) · xcodebuild App and Widget, signing off · the no-network grep
"Done when": one line per clause of the cell → command or shot file → pass / fail / not-run
Screenshot round: shots posted, a verdict line per file, every FAIL fixed or carried with a reason
Paperwork: CHANGELOG.md under [Unreleased] · docs/interpretations.md rows · no new dependency ·
no edit to CLAUDE.md, Config/ or .github/ without an explicit yes · nothing disabled (no skipped
test, widened tolerance, re-recorded baseline or new theme-lint:allow beyond those listed with
reasons) · the first sentence of my final message names every fail / not-run line, or says none
```

## 4. Component library (DailyUI)

Build each once, in the row named beside it, with a preview showing every state listed **plus** the
six `CLAUDE.md` requires of all of them — empty, loading, one item, 50 items, very long title, all
done. `Checkbox` in 2a; `TaskRow`, `ProgressRing`, `DayHeader`, `EmptyState` in 2b; `EntryField` and
`TaskDetail` in 2d; `ReviewCard` in 3b; the widget-sized `Checkbox` and `ProgressRing` states in 4;
`Nav` in 5a; `CalendarCell` and `StatTile` in 6a; `FloatingIcon` in 7c.

| Component | States to preview |
|---|---|
| `Checkbox` | open, done, hover, pressed, mid-animation, widget size |
| `TaskRow` | open, done, flagged, carried (2d), recurring, with due time, with note collapsed/expanded, editing title, 200-char title, RTL, emoji |
| `ProgressRing` | 0%, 40%, 100%, neutral, widget size |
| `DayHeader` | morning empty, in progress, all done, streak hidden — each carrying the pink star to the left of the greeting line, the greeting inset clear of it |
| `EntryField` | empty, typing, with parsed chips, multi-line paste |
| `TaskDetail` | empty note, long note, note with links, due time set, due time cleared, flagged, 200-char title, editing |
| `ReviewCard` | undecided, each of the four choices, nag at threshold |
| `Nav` | five segments, each selected, keyboard-focused, at 360 pt |
| `CalendarCell` | neutral, partial, full, selected, today, future |
| `StatTile` | number, percentage, dash |
| `EmptyState` | morning, all done, no history, empty Someday |
| `FloatingIcon` | ring with count, all-done check, idle-faded |

Previews and tests read the same array of preview states in `Sources/DailyUI`; each `#Preview`
renders from it, because a test suite cannot enumerate `#Preview` blocks. A component or state named
above with no entry fails the build.

**What enforces the no-literal-styling rule.** `./scripts/lint-theme.sh` does — syntactically, and
it is the only thing that catches a literal whose value happens to be correct — backed by the
requirement that `TestTheme` differ from Sage Lily in every token group. **Snapshots do not:** a
baseline is recorded from the code under test, so `.padding(12)` goes into both baselines on the
first run and passes forever. They are kept as a **regression** gate, per architecture, with a
perceptual tolerance, re-recorded only under `SNAPSHOT_RECORD=1` — which CI never sets — in a commit
that changes nothing else. Neither covers whether the *right* token was used or whether the result
matches the mockups; that is the screenshot round's job.

*(`design/theme-sage-lily.md` says the pink star is "used on the About screen only". There is no
About screen and there will not be one — the star belongs in `DayHeader`. That sentence is wrong and
is queued for correction.)*

## 5. Working with Claude Code

Per row, open a branch and start Claude Code with the preamble, plus **A** for a logic row (0, 1a–1c,
6b), **B** for a row that ends on screen, or **C** for one that touches things no test can reach
(7b, 7c, 9).

> Read `CLAUDE.md`, then `PLAN.md` §2, §3 row **N** only, §4 and §6, then only the `SPEC.md` line
> ranges row N cites. Branch from an up-to-date `main`.
>
> **Scope.** Build exactly what row N's cell lists and nothing another row lists. If a row-N item
> needs something from a later row, stop and tell me — do not pull it forward and do not stub it.
>
> **First message back, before any code:** turn the cell into the §3.1 exit checklist, one line per
> clause, each naming the command or the screenshot that settles it. A clause with neither is a bug
> in this plan — list those separately and propose the wording. Wait for me.
>
> **When the documents disagree:** `SPEC.md` wins on what the product does, `PLAN.md` on how and
> when it is built. Implement the `SPEC.md` reading, keep going, and add a row to
> `docs/interpretations.md` (`| Row | SPEC.md line | PLAN.md line | The ambiguity | What I built |
> Proposed SPEC.md edit |`). If it is ambiguous in more than one direction, stop and ask.
>
> **When you are blocked** — two attempts, the second failing for a new reason, or the answer needs
> something only I can supply — say `BLOCKED` and which checklist line, paste the exact command and
> its exact output, give two or three options and the one you recommend, and say what you will do if
> I reply "your call". Then stop. Never a `// TODO`, a `fatalError("unimplemented")` or a disabled
> test in place of asking.
>
> **Never without asking:** add a dependency; edit `CLAUDE.md`, `Config/*.xcconfig` or
> `.github/workflows/*`; set `DEVELOPMENT_TEAM`; skip or delete a failing test; widen a tolerance;
> re-record a baseline; add a `// theme-lint:allow`. No styling literal, ever: a value with no token
> is a missing token — propose the token, never write the number.
>
> **Finish, in this order:** run every checklist command and paste the real output; add a line per
> user-visible change to `CHANGELOG.md`; append any `docs/interpretations.md` rows; write the PR body
> with the filled checklist and anything you deliberately did not build. If any line is fail or
> not-run, say so in the **first sentence** of your last message.

**A — logic rows.** Nothing needed from me. Test-first: write the named test, watch it fail, make it
pass. Never call `Date()`, `Calendar.current` or `TimeZone.current` in `DailyCore` — a test that
passes at one time of day and fails at another is a bug in the test. Run `swift test` yourself until
green; do not ask me to run what you can run. Every acceptance row gets a test whose name ends in
its `SPEC.md` line (`…_spec635`).

**B — rows that end on screen.** One round, once, when the code compiles, both suites are green and
`lint-theme.sh` exits 0. Name the fixtures, sizes and appearances, say what you will check in each,
and stop; I run the app and drag in the images. Reply one `PASS` / `FAIL: <what> · fix: <token>` line
per image; round 2 re-shoots only failures. **There is no round 3** — convert the surviving question
into a test instead. Motion is a five-second recording, never a still.

**C — rows that touch what no test reaches.** Sort every checklist line into unit-testable /
checkable by a command I run / only observable on my Mac, in your first message. For the third,
write `docs/verify-<row>.md`: under fifteen numbered steps, each an action I take and one observable
result I report back. Say when a step needs a one-time system permission. Anything that depends on
signing identity is a fact about my machine — report what you observed, never conclude from CI that
it works for a user.

**Habits that keep the loop tight.**

- **Milestone 1 first, and 2a alongside it.** 2a imports nothing from `DailyCore`; it is the only
  work here that can run concurrently. Everything from 2b is serial.
- **Short PRs, split in advance.** Budget ~800 lines of **production** diff — Swift that ships.
  Tests, previews and baselines belong in the same PR and are excluded from the count. §3's lettered
  rows are that split. Never split a component from its previews, or a view from its keyboard
  handling.
- **Keep `SPEC.md` the truth.** An empty interpretations section on a spec this size is a claim I
  will check, not a good sign.
- **Mockups are an input, never a gate.** Read them for values, write what you derived into
  `theme-sage-lily.json`, and give the screenshot round a specific verdict — "matches `today.png`
  except the carry badge sits 4 pt low", not "matches".
- **Budget the human round trip.** Fifteen of twenty PRs stop for eyes. That, not diff size, is the
  real schedule.

## 6. Risks and how each is retired

| Risk | Retired by |
|---|---|
| Widget App Group denied under free signing | Milestone 0 spike S1, three results in `docs/m0-signing.md` with pasted `codesign` output. **E1 false deletes milestone 4 and strikes `SPEC.md`'s widget section in the M0 PR** — there is no snapshot-file fallback, because a sandboxed extension without a group container has no shared path to read. |
| CI has no signing identity, so the release zip is ad-hoc | Assumed true from milestone 0, not discovered at 9. `release.sh` carries an include-widget switch set by E2/E3 in the M0 PR, and the README states which install path gets a widget. |
| Free-signing collisions at runtime: notification authorization and `SMAppService` for an ad-hoc build in `~/Downloads` | Spikes S5/S7 in milestone 0. 7b ships the fallback affordances **only if** the spike records a failure. |
| Rollover edge cases: DST, sleep, backward clock, time-zone jump | 1a and 1c tests with the injected clock, including two rows the spec's table lacks: `logicalDate` at 06:00 local returns *today* on both 2027 transition days, and a 02:30 rollover — inside the spring-forward gap the settings range permits — resolves to one instant. `logicalDate` reads wall-clock time and never subtracts an interval from a `Date`; the old "check it with an injected clock" mitigation pointed at a test this defect passes. |
| A crash mid-rollover leaves a half-closed day | Spike S3 confirms one `save()` is atomic across `exit(0)`; 1c commits the whole rollover in one save on a scratch context and never uses `ModelContext.transaction(_:)`, which does not roll back on error; 3a re-runs the check against the live app. |
| SwiftData schema cannot be migrated after 1.0 | 1a declares `SchemaV1` and `ToDewMigrationPlan` before any store is created; a checked-in fixture opens and migrates in CI. **The one risk here that cannot be retired later at any price.** |
| Cross-process access: the widget writes and the app shows stale data | Spike S2's cross-process half; 1c makes the app the only writer and the widget read-only; milestone 4 scopes the intent to one `complete(TaskID)` and posts a change notification, verified against SPEC 663 three times. The store actor serialises one process and cannot serialise two. |
| The 500-task budget is decided long before it is measured | Three things decide it and all three are settled early: the view read path (S2) and where `@ModelActor` runs (S4), both in milestone 0, and a lazy list with stable IDs in 2c. Measured **in 2c and 6a**, not first at 9; milestone 9 re-measures on the full app and adds cold launch. A first measurement at the end would make any failure a rewrite of every view signature. |
| Undo: closures across the actor, undo across a rollover, undo from the widget | 1c returns `Sendable` `InverseAction` values capturing no `@Model`, with `UndoManager` confined to the app layer; 3a clears the stack where rollover commits; milestone 4 decides the intent's host process and proposes the `CLAUDE.md` amendment. |
| The eighteen settings have no storage the widget can read | 1a ships one `Settings` struct persisted into the App Group suite with a test enumerating all eighteen keys; 7a builds the window over it. |
| Theme layer leaks — a literal colour, size, curve or material | `./scripts/lint-theme.sh` from 2a, plus `TestTheme` differing in every token group. **Not** snapshots: baselines record whatever the code does, so a hard-coded value is baked into both and passes forever. Snapshots are a regression gate. |
| macOS has no Dynamic Type, so the type scale is the app's own problem | `UIFontMetrics` is iOS-only and `relativeTo:` scales against nothing on macOS, so the old "check Larger Text in M2" passes by looking unchanged — indistinguishable from a correct pass. Spike S6 records whether the macOS 26 Accessibility text size moves a third-party app at all. **Default: ship a fixed scale and amend `SPEC.md:452`.** Either way the decision is made in 2a **before any component is written**, because a scale factor changes the protocol's shape and deciding late means editing every component and every baseline. |
| Notifications when the app is closed carry stale text | 7b schedules a rolling seven-day queue of non-repeating dated requests, bodies computed at scheduling time from `preview(for:)` and rewritten on launch, wake and mutation. A repeating trigger cannot be used: its content is frozen when scheduled, and the obvious test passes on the first delivery and fails on the second, a day later. Test by waiting **two** mornings. |
| `design/mockups/` does not exist and milestone 8 gates on it | Moved out of the to-do list into **milestone 0's "Done when"**, with the fonts. Every UI row from 2b is reviewed against them. |

## 7. Starting: milestone 0 is a few sittings, not an afternoon

Milestone 0 is the only milestone whose output is mostly *decisions*. Six spikes, six decision
records, and every other row depends on one of them. Budget it accordingly and do not let a spike
close on an assertion.

1. `git init`, commit `SPEC.md`, `CLAUDE.md`, `PLAN.md`, `design/`, `LICENSE`.
2. Line up what the spikes need and cannot be faked: **a second Mac not registered to your Apple
   account** (E3 — if you cannot get one, record it UNKNOWN and treat it as false), about twenty
   minutes at the keyboard for S6's before-and-after screenshots of Accessibility ▸ Display ▸ Text
   size, and two waits long enough for a notification to be delivered after a quit (S5).
3. Export the Sage Lily artboards as `design/mockups/{today,review,history,widget}.png` and put the
   font files in place. Both are milestone 0 deliverables, not optional: every UI row from 2b is
   reviewed against the mockups and milestone 8 gates on them.
4. Open Claude Code on `m0-scaffold` with the §5 preamble and addendum A. Expect the exit checklist
   first, the signing spike flagged as the one thing it cannot settle alone, and at least three
   questions — the bundle prefix (answer `com.<your GitHub username>.todew`), the placeholder icon,
   and which Xcode 26 toolchain CI should select. A row that opens with no questions on a spec this
   size resolved its ambiguities silently; ask which ones.
