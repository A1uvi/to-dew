# Review 04 — Agent Workability of `PLAN.md`

**Reviewer:** `agent-workability` · **Date:** 2026-09-21
**Lens:** can Claude Code execute `PLAN.md` as written, alone, with a human who can only run commands and paste screenshots?

**Sources read:** `PLAN.md`, `CLAUDE.md`, `SPEC.md` (§§ Keyboard 186–213, Stats 333–350, Settings 545–555, Design readiness 420–470, Distribution 560–608), `design/theme-sage-lily.md`, `design/theme-sage-lily.json`, `design/SageLilyTheme.swift`, `review/01-spec-coverage.md` (all of it; its §2 list is the input to my §2 here), headings of `review/02-feasibility.md` (to avoid duplicating its signing/SwiftData findings).

**Headline.** `PLAN.md:75` claims "Each ends in something that runs and can be checked." I split the ten "Done when" cells into their 49 clauses and classified each: **4 are runnable commands, 6 are things a human can settle from a screen, and 39 are untestable opinion.** The plan's single strongest automation claim — `PLAN.md:110–111`, that two-theme snapshots make the no-literal-styling rule "enforced by CI, not by review" — is false as constructed: snapshot baselines are recorded from the code under test, so a hard-coded value is baked into both baselines on the first run and passes forever. And the human screenshot loop, which is the only check on 39 of those 49 clauses, has no fixtures, no sizes, no appearances and no timing.

---

## 1. Rewritten §5 prompt template(s)

`PLAN.md:115–121` offers one five-line prompt for all ten milestones. It never says what to do when blocked, never says which document wins when two disagree, never says when in the milestone to stop for screenshots or what to ask for, and treats M1 (pure Swift, zero human involvement) and M8 (a pure design pass where every check is a human's eyes) as the same job.

Replace §5's block quote with a shared preamble plus one of three addenda. **Paste-ready text follows; everything from here to the end of §1 is the replacement for `PLAN.md:113–131`.**

---

### 5. Working with Claude Code

Per milestone, open a branch and start Claude Code in the repo. Every milestone gets the **common preamble**; then add **A** for a logic milestone (M0, M1), **B** for a UI milestone (M2, M3, M4, M5, M8) or **C** for a system milestone (M6, M7, M9).

#### Common preamble — paste for every milestone

> Read `CLAUDE.md`, then `PLAN.md` §2, §3 row **N** only, §4 and §6, then only the `SPEC.md` line
> ranges cited in row N's "Done when" cell. Do not read all of `SPEC.md`.
>
> We are on milestone **N** (`branch-name`). Branch from an up-to-date `main` before you edit
> anything.
>
> **Scope.** Build exactly what row N's "Done when" cell lists and nothing another row lists. If a
> row-N item cannot be built without something from a later row, stop and tell me — do not pull the
> later work forward, and do not stub it.
>
> **First message back, before any code.** Turn the "Done when" cell into an exit checklist: one
> line per clause, each naming the *command* or the *screenshot* that will settle it. Any clause
> with neither is a bug in `PLAN.md` — list those separately and propose the replacement wording.
> Do not start work until I have seen that checklist.
>
> **When `SPEC.md` and `PLAN.md` disagree:** `SPEC.md` wins on what the product does, `PLAN.md`
> wins on how and when it gets built. For a product-behaviour conflict, implement the `SPEC.md`
> reading, keep going, and append a row to `docs/interpretations.md`
> (`| Milestone | SPEC.md line | PLAN.md line | Conflict | What I did | Proposed edit |`). If the
> conflict leaves the work ambiguous in more than one direction, stop and ask instead — guessing
> here costs a whole milestone.
>
> **When you are blocked.** Blocked means: two attempts, the second failing for a *new* reason; or
> the answer needs something only I can supply (a screenshot, an Apple ID, a signing team, a
> product judgement). Then in one message: (1) `BLOCKED` and which checklist line; (2) the exact
> command and its exact output, not a paraphrase; (3) two or three options, the one you recommend,
> and why; (4) what you will do if I reply "your call". Then stop. Do not keep working around a
> block you have already named, and never leave a `// TODO`, a `fatalError("unimplemented")` or a
> disabled test in place of asking.
>
> **Never without asking:** add a dependency; edit `CLAUDE.md`, `Config/*.xcconfig` or
> `.github/workflows/*`; set `DEVELOPMENT_TEAM`; skip, delete or `withKnownIssue` a failing test;
> widen a snapshot tolerance; re-record a snapshot baseline; add a `// theme-lint:allow`.
>
> **Finish, in this order:** (1) run every command on the exit checklist and paste the real output;
> (2) add one line per user-visible change to `CHANGELOG.md` under `## [Unreleased]`; (3) append any
> new rows to `docs/interpretations.md`; (4) write the PR description — the checklist with each
> line marked pass / fail / not-run, the interpretations table, and anything you deliberately did
> not build, with the reason. If any line is fail or not-run, say so in the **first sentence** of
> your last message. A milestone with an unsettled clause is not done, and saying it is done is the
> one failure mode I cannot detect from here.

#### A — logic milestones (M0, M1)

> This milestone has no UI and needs nothing from me. Work test-first: write the test named in the
> checklist, watch it fail, make it pass. `DailyCore` imports no UI framework — not SwiftUI, not
> AppKit, not WidgetKit; if you need `WidgetCenter`, that call belongs in `App/`, behind a protocol
> `DailyCore` owns.
>
> Never call `Date()`, `Calendar.current` or `TimeZone.current` in `DailyCore` — take them from the
> injected `DayClock`. A test that would pass at one time of day and fail at another is a bug in
> the test.
>
> Run `swift test --package-path Packages/DailyCore` yourself after every change; iterate until it
> is green without asking me. Do not ask me to run a command you can run. When the suite is green,
> run the coverage gate on the checklist and paste its numbers.
>
> Every acceptance row you implement gets a test function whose name ends in the `SPEC.md` line it
> covers (`func rollsOverOnceAcrossDST_spec635()`), so the traceability is greppable.

#### B — UI milestones (M2, M3, M4, M5, M8)

> **I cannot see the running app and neither can you.** Everything visual is settled by screenshots
> I take, so treat my eyes as an expensive, slow, twice-only resource.
>
> **No literal styling.** No color, font, point size, radius, stroke width, opacity, shadow,
> material, spacing or animation literal in any view. Read `@Environment(\.theme)`. If a value you
> need has no token, that is a missing token — stop and propose the token (name, type, Sage Lily
> value, `TestTheme` value) rather than writing the number. Run `./scripts/lint-theme.sh` before
> every commit; it must exit 0.
>
> **Previews are the test fixtures.** Every component you add gets an entry in
> `PreviewCatalog.all` — an id, the view, the six universal states (empty, loading, one item, 50
> items, very long title, all done) plus the component's own states from `PLAN.md` §4, and its
> declared token set. `#Preview` blocks render *from the catalog*, never inline, so the snapshot
> and token-contract suites see exactly what I see in Xcode.
>
> **The screenshot round.** Exactly one per milestone, at one point: when the code compiles,
> `swift test` on both packages is green and `lint-theme.sh` exits 0 — not before, and not after
> you have declared the milestone done. Then post a single message shaped like this and stop:
>
>     SCREENSHOTS NEEDED — milestone N, round 1 of max 2
>     Run:  ./scripts/shots.sh mN
>     It writes ~20 PNGs to review-shots/mN/ and opens the folder. Drag the folder in.
>     If it errors, paste the error; do not take the shots by hand.
>     What I will check in each, and the token that governs it:
>       01-empty-720-light.png      EmptyState copy centred, no card edge      colors.surface, space.window
>       05-fifty-360-dark.png       row height even, no clipped carry badge    sizes.rowMinHeight
>       ...
>
> When the images arrive, reply with one verdict line per file — `PASS` or `FAIL: <what is wrong>,
> caused by <file:line>, fix: <token or change>` — then fix and request round 2 with **only** the
> files that failed. If you would need a round 3, stop instead: say which question the screenshots
> cannot answer and propose a measurement (a token-contract test, a geometry probe, a size
> assertion) that settles it without my eyes.
>
> **Motion is not screenshottable.** For any of the eight named hooks you touch, ask for a 5-second
> screen recording (`./scripts/shots.sh mN --motion`) instead of a still, and say which hook, what
> should happen, and how long it should take.

#### C — system milestones (M6, M7, M9)

> This milestone touches things no test on my side can reach: notification delivery, launch at
> login, App Group sharing, widget rendering, Gatekeeper, VoiceOver. For each, decide up front
> whether it is (i) unit-testable in `DailyCore`, (ii) checkable by a command I run, or (iii) only
> observable on my Mac — and put each checklist line in one of those three buckets in your first
> message.
>
> For bucket (iii), write the verification as a numbered script in
> `docs/verify-mN.md` — every step an action I take and a single observable result I report back
> (`3. Quit the app, wait for 21:00. Expected: one banner, title "Nothing done today yet."
> Report: seen / not seen / wrong text`). Keep it under fifteen steps; anything longer means you
> should have automated more of it.
>
> State clearly when a step needs a one-time system permission (Accessibility for window scripting,
> Notifications, Screen Recording) and what I will see when macOS asks.
>
> Anything that depends on code signing identity is a fact about my machine, not about the code:
> report what you observed, never conclude from a CI result that it works for a user.

#### Good habits that keep the loop tight

- **M1 first and alone.** It is pure Swift with tests Claude can run; let it iterate without you.
- **One screenshot round per milestone, batched.** Never a running conversation of one-off shots.
- **Keep `SPEC.md` the truth.** Interpretations land in `docs/interpretations.md` during the
  milestone and are folded into `SPEC.md` in the same PR.
- **Pre-split the big milestones, do not discover the split.** M2, M5 and M6 are each 2,000+ lines;
  they open as M2a/M2b, M5a/M5b, M6a/M6b (see §3).
- **Use the mockups as an input, not a gate.** `design/mockups/*.png` are files Claude can read and
  copy values from; only you can tell whether the result matches, so mockup comparison belongs in
  the screenshot round's checklist, never in a "Done when" cell.

---

## 2. "Done when" conversion table

Class **(a)** = a command that exits 0 or 1. **(b)** = a human settles it from a screen. **(c)** = an untestable opinion, or a deliverable *listed* with no statement of what correct means. Clause counts: **49 total — 4 (a), 6 (b), 39 (c)**. Every (c) below is converted.

Where `spec-auditor` (`review/01-spec-coverage.md` §2, F1–F28) already wrote a replacement, I cite it and add only the executable half — the command, the script, or the shot list. Commands assume `./scripts/lint-theme.sh`, `./scripts/coverage.sh`, `./scripts/shots.sh` and `-ToDewFixture` from §§3–5 below exist; M0 creates all four.

| # | Current cell, clause by clause (`PLAN.md` line) | Class | Replacement gate |
|---|---|---|---|
| **0** | "`swift test` runs empty" (L79) | **a** | Keep. `swift test --package-path Packages/DailyCore && swift test --package-path Packages/DailyUI` both exit 0 with ≥1 passing placeholder test each. |
| 0 | "Dock icon appears" (L79) | **b** | Keep, make it specific: `xcodebuild -scheme ToDew build && open build/Debug/ToDew.app` → screenshot of the Dock showing the placeholder icon (`SPEC.md:458`) and a 360×480 empty window. One shot, `review-shots/m0/dock.png`. |
| 0 | "**widget App Group works or is ruled out under free signing**" (L79) | **c** | Per `spec-auditor` §2-M0 / F25, plus the runnable half: `./scripts/spike-appgroup.sh` writes `docs/spike-appgroup.md` and exits 0 only if the file contains a verdict line `RESULT: (personal-team\|adhoc-zip)=(pass\|fail)` for **both** environments with pasted console output. `grep -Eq '^RESULT: personal-team=(pass\|fail)$' docs/spike-appgroup.md && grep -Eq '^RESULT: adhoc-zip=(pass\|fail)$' docs/spike-appgroup.md`. The disjunction "works **or** is ruled out" is deleted — the gate is that both answers exist, not that either is yes. |
| 0 | *(missing)* | — | Add: "`./scripts/release.sh` produces a launchable `ToDew.zip` locally (`spec-auditor` F26); `./scripts/lint-theme.sh`, `./scripts/coverage.sh` and `./scripts/shots.sh` exist and exit 0 on the empty tree; `.github/workflows/ci.yml` runs gates G1–G4 and G8 of §5 and is green on the M0 PR." |
| **1** | "Every row of the spec's acceptance table passes from `swift test`" (L80) | **a** (false as scoped) | Use `spec-auditor` F1 verbatim: fourteen logic rows here, 618/629→M3, 663/666→M7, 669/672→M9. Executable half: every test function name ends `_specNNN`, and `./scripts/acceptance-map.sh` fails unless the fourteen line numbers each appear in exactly one test name in `Packages/DailyCore/Tests`. |
| 1 | "`QuickEntryParser` and `RecurrenceRule` at 100% branch coverage" (L80) | **c** (asserted, not measured) | `./scripts/coverage.sh QuickEntryParser.swift RecurrenceEngine.swift` wrapping `swift test --package-path Packages/DailyCore --enable-code-coverage` + `xcrun llvm-cov report ... --show-region-summary`, exiting 1 unless region coverage is 100.00% for each named file. (`spec-auditor` §2-M1 proposed the command; this makes it a script CI can call.) |
| **2** | "`Theme` protocol, `SageLilyTheme`, `TestTheme`" (L81) | **c** | `swift test --package-path Packages/DailyUI --filter TokenContractTests` — every token in `design/theme-sage-lily.json` has a member on the protocol (§3's enum-backed resolver), both themes implement every member, and `ThemeTokenCoverageTests` fails if any token is read by no catalog entry. |
| 2 | "components: TaskRow, Checkbox, ProgressRing, DayHeader, EntryField, EmptyState, **each with an Xcode preview of every state**" (L81) | **c** | `swift test --filter PreviewCatalogTests`: every component id in `PLAN.md` §4 appears in `PreviewCatalog.all`; each has the six universal states of `CLAUDE.md`'s quality bar plus its §4 row's states; ids and state names are compared against a checked-in `Tests/Fixtures/required-previews.json` generated from §4, so adding a §4 state fails the build until a preview exists. |
| 2 | "add/complete/edit/reorder/drop/undo" (L81) | **c** | `swift test --package-path Packages/DailyCore --filter StoreMutationTests`: each of the six has a test asserting the store change **and** that its inverse is registered and restores the prior snapshot byte-for-byte (`CLAUDE.md`: "Every mutation is undoable"), plus one test that each mutation requested a widget reload through the injected reload protocol. |
| 2 | "keyboard table from the spec" (L81) | **c** (and unbuildable — `spec-auditor` F4) | Take F4's re-scoping, then: `swift test --package-path Packages/DailyUI --filter KeyboardTests` sends each of the eight Today-scoped key equivalents to the command router and asserts the intent it emits; `./scripts/lint-keymap.sh` fails if any of the twelve `SPEC.md:190–213` rows lacks either a live binding or an explicit `.disabled(reason:)` entry. |
| 2 | "data persists" (L81) | **c** | `xcodebuild test -scheme ToDew -only-testing:ToDewUITests/PersistenceSmokeTests` — type a task, quit, relaunch, assert it is present (this is one of the three XCUITests `spec-auditor` F22 re-homes; M2 is where it first becomes true). |
| 2 | "window min 360×480" (L81) | **b** → **a** | `swift test --filter WindowConfigTests` asserts `contentMinSize == theme.sizes.windowMin` and that `windowFrameAutosaveName` is set (`spec-auditor` F16); the screenshot round confirms nothing clips at 360. |
| 2 | "hidden title bar" (L81) | **b** | Screenshot `01-empty-720-light.png` and `07-one-360-dark.png`: traffic lights present and vertically centred in the content, no title bar separator, content runs edge to edge (`SPEC.md:445–446`). |
| **3** | "Rollover on launch/wake/focus/clock change/6 AM timer" (L82) | **c** | `swift test --filter RolloverTriggerTests`: a `RolloverCoordinator` takes the five triggers as an injected event stream; one test per trigger asserts exactly one `runRollover` call, and one test fires all five within a second and asserts exactly one run (idempotence at the coordinator, not just the engine). The three real `NSNotification` names are asserted by a separate test that the coordinator subscribes to them by name. |
| 3 | "review screen with ReviewCard, K/L/S/D keys, Keep all / Drop all, Someday pull, Skip" (L82) | **c** | `swift test --filter ReviewFlowTests` — one test per choice asserting the store outcome from `SPEC.md:237–248` (Keep → `carryCount+1` and stays today; Later → scheduled day set; Someday → `day == nil`; Drop → `status == .dropped`, still in history; Skip → every leftover kept with `carryCount+1`, `SPEC.md:648`); Keep all / Drop all apply to every undecided card only. Plus screenshots `m3` fixtures `review-3`, `review-nag`, `review-decided`. |
| 3 | "carry-count nag at threshold" (L82) | **c** | `swift test --filter ReviewNagTests`: at `carryCount == threshold-1` no nag; at `threshold` the card exposes the nag string; the threshold comes from `Settings`, not a literal (`SPEC.md:249–250`). Screenshot `04-review-nag-720-light.png` confirms it reads in `accentSecondary`, not by color alone. |
| 3 | "reopen from View menu" (L82) | **c** | `swift test --filter ReviewReopenTests`: the menu item is enabled after a rollover with leftovers and becomes disabled the moment the first task of the day is completed (`SPEC.md:258–259`, `spec-auditor` UNASSIGNED #27); re-running a reopened review never increments a carry count twice. |
| 3 | *(missing)* | — | Add the two acceptance rows F1 re-homes: `SPEC.md:618` (live rollover with the app open — a test that advances the injected clock across 06:00 and asserts the list and review update with no relaunch) and `SPEC.md:629` (kill the process mid-rollover with `./scripts/crash-rollover.sh`; on relaunch the store is fully old or fully new, asserted by a checksum of the day's rows). |
| **4** | "Grouped Upcoming with drag between days" (L83) | **c** | `swift test --filter UpcomingGroupingTests` asserts the `SPEC.md:267` grouping (Tomorrow → next 7 weekdays → by date) from a fixture; drag is tested at the model layer (`move(task:toDay:)`) and confirmed visually in the `m4` screenshot round, which also carries `spec-auditor` F15's `Nav`. |
| 4 | "Someday with stale marker" (L83) | **c** | `swift test --filter SomedayTests`: a task 60 days undated is not stale, 61 days is, and nothing is ever auto-deleted (`SPEC.md:278–279`) — with the injected clock, never `Date()`. |
| 4 | "templates with pause and 7-day history row" (L83) | **c** | `swift test --filter RecurringTemplateTests`: a paused template generates nothing and, on resume, generates today only and no catch-up burst (`SPEC.md:95, 286`); the history row returns exactly seven entries each `done`/`missed`/`none` for the last seven logical days. Plus `spec-auditor` F20's instance-vs-template detachment tests. |
| 4 | "quick-entry scheduling tokens" (L83) | **c** | `swift test --filter QuickEntryScheduleTests` — a table test over `["tomorrow", "fri", "next mon", "3pm", "!", "tomorrow 3pm !"]` asserting the exact `ParsedEntry`, run against a frozen clock on a Wednesday and on a Sunday. |
| **5** | "Month heat map with CalendarCell, day detail, search, duplicate-to-today, StatTile row, JSON/Markdown export, import, delete-older-than" (L84) | **c** ×8 | Use `spec-auditor` §2-M5 / F21 verbatim for the six named stats, the round-trip and the golden file. Executable form: `swift test --package-path Packages/DailyCore --filter 'StatsTests|ExportTests'` where `ExportTests` does export → wipe → import → re-export and `#expect(first == second)` on bytes, and `MarkdownExportTests` diffs against `Tests/Fixtures/golden-day.md` with `--record` guarded behind an env var CI does not set. Search and duplicate-to-today get `HistorySearchTests` (title and note, case- and diacritic-insensitive) and `DuplicateToTodayTests` (new id, `carryCount == 0`, original untouched). Heat map and day detail go to the `m5` screenshot round with the `month-90` fixture. |
| **6** | "All four notification types with refreshed text" (L85) | **c** | `spec-auditor` F9's replacement, made runnable: `swift test --filter NotificationSchedulingTests` against an injected `UNUserNotificationCenter` protocol asserts the four request identifiers, the category with `Done`/`Snooze 15 min`, the interruption levels, and **zero** `requestAuthorization` calls on a launch where no due time is set. Delivery itself is `docs/verify-m6.md` steps 1–6 (bucket iii). |
| 6 | "badge modes" (L85) | **c** | `swift test --filter BadgeTests`: three modes × (0, 1, 12 open, 3 flagged) → expected badge string, `nil` when off. |
| 6 | "Dock menu with five tasks" (L85) | **c** | `swift test --filter DockMenuTests`: items are New Task, then at most five open tasks in list order with titles truncated to the menu width, then Show Today (`SPEC.md:389–390`); with zero open tasks the five rows are absent, not blank. |
| 6 | "Settings window (every setting in the spec)" (L85) | **c** | `spec-auditor` F3's `Settings` struct plus: `swift test --filter SettingsCompletenessTests` enumerates `Settings.CodingKeys` and fails unless all eighteen `SPEC.md:551–555` controls are present with the spec defaults, and `SettingsUITests` asserts every key has a control bound to it (a key with no control is the failure mode). |
| 6 | "launch at login" (L85) | **c** | `swift test --filter LoginItemTests` against an injected `SMAppService` protocol (register/unregister/status); the real behaviour is `docs/verify-m6.md` step 7, because it depends on signature and install location. |
| 6 | "floating `NSPanel` icon behind a setting (**try for a week, then keep or cut**)" (L85) | **c** | `spec-auditor` §2-M6 / F2 verbatim: eight verifiable behaviours, keep-or-cut moved out of the gate into `SPEC.md`'s "Still open" with an M9 deadline. Executable half: `PanelConfigTests` asserts `.nonactivatingPanel`, `.floating` level, `.canJoinAllSpaces`/`.fullScreenAuxiliary`, and a per-display frame key; the remaining four behaviours are `docs/verify-m6.md` steps 8–11. |
| **7** | "Small/medium/large" (L86) | **b** | Screenshot round `m7`: all three families in the widget gallery and placed on the desktop, light and dark. |
| 7 | "App Intent checkboxes" (L86) | **c** | `swift test --filter ToggleTaskIntentTests` — the intent mutates through the same `Store` entry point as the app and returns a refreshed snapshot; plus `docs/verify-m7.md`: check a task in the widget with the app open, app list updates within 1 s (`SPEC.md:663`, re-homed here by F1). |
| 7 | "timeline entry at next rollover" (L86) | **c** | `swift test --filter TimelineProviderTests` with a frozen clock at 05:30, 06:00, 23:59: the returned policy is `.after(nextRollover)` computed from the *settings* rollover minute, and the entry set contains exactly one entry at that instant. |
| 7 | "renders in tinted and clear styles without color-only meaning" (L86) | **c** | Two gates. Automated: render each widget family under `.widgetRenderingMode` accent and full-color to a bitmap, convert to greyscale, and assert done/open rows still differ by ≥1 non-color signal (checked glyph present, count text differs) via a `WidgetLegibilityTests` assertion on the view tree, not the pixels. Human: `docs/verify-m7.md` step — tint the widget in the gallery and screenshot (`SPEC.md:415–416`). *(`review/02-feasibility.md` F10 disputes the mode names; use whatever it lands on.)* |
| **8** | "Sage Lily applied end to end against `design/mockups`" (L87) | **c** | `spec-auditor` §2-M8 / F10 for the token-coverage gate. Add the precondition as a gate, not a hope: M8 does not open until `ls design/mockups/{today,review,history,widget}.png` exits 0 — CI gate G13. |
| 8 | "motion hooks implemented per theme" (L87) | **c** | `swift test --filter MotionContractTests`: all eight hooks exist on `ThemeMotion`; each is read at least once across `PreviewCatalog` interaction tests using `RecordingTheme` (§3); `TestTheme` returns `.linear(duration: 1)` and a Reduce-Motion theme returns `.none` for all eight. Timing and curve are checked by the human from a 5-second recording, not a still. |
| 8 | "completion sound" (L87) | **c** | `swift test --filter FeedbackTests`: off by default (`SPEC.md:454`); enabling it plays exactly one sound per completion and none on undo; `TestTheme` silences it. Haptics per `spec-auditor` F23. |
| 8 | "layered app icon" (L87) | **b** | Screenshot: the icon in Finder, the Dock, and System Settings at 16/32/128/512, in default, dark, clear and tinted appearances (`SPEC.md:457`). |
| 8 | "light + dark checked on a real screen" (L87) | **c** | Replaced by §4's M8 shot list: four surfaces × two appearances × two window sizes + Reduce Motion + Increase Contrast, produced by `./scripts/shots.sh m8`, each with a named checklist line. "Checked" becomes twenty-eight pass/fail verdicts. |
| 8 | "Reduce Motion / Increase Contrast honored" (L87) | **c** | `swift test --filter AccessibilityAppearanceTests`: with `accessibilityReduceMotion` true every hook resolves to an instant opacity change; with `accessibilityIncreaseContrast` true the theme swaps to its high-contrast color set and `line`-on-`surfaceAlt` contrast is ≥3:1 and `ink`-on-`surface` ≥7:1, computed in the test from the token values (this catches the contrast bug that no screenshot will). |
| **9** | "VoiceOver pass" (L88) | **c** | `spec-auditor` §2-M9 / F11, plus the automatable part: `xcodebuild test -only-testing:ToDewUITests/AccessibilityAuditTests` calling `XCUIApplication().performAccessibilityAudit()` on Today, Review, History and Settings, failing on any issue; and `swift test --filter AccessibilityLabelTests` asserting every `PreviewCatalog` entry exposes a non-empty label and that `TaskRow` exposes toggle-done, flag and drop as custom actions. The rotor walk stays human, in `docs/verify-m9.md`. |
| 9 | "500-task perf pass" (L88) | **c** | `./scripts/perf.sh` seeds the 500-task fixture, launches with `-ToDewFixture fivehundred`, measures cold launch three times with `XCTOSSignpostMetric`/`XCTApplicationLaunchMetric` and fails over 1.0 s (`SPEC.md:670`); scroll hitches measured by the `XCTOSSignpostMetric.customInstantMetric` animation-hitch API, failing on any hitch >16 ms (`SPEC.md:464`). Run nightly, not on PRs — it is machine-dependent. |
| 9 | "README with screenshots and Gatekeeper steps" (L88) | **b** | A human follows `README.md` on a Mac that has never built the project and reports at which step it fails, if any — the only honest test of an install doc. |
| 9 | "tagged `v1.0.0`" (L88) | **a** | Keep. |
| 9 | "release zip built by CI" (L88) | **a** | Strengthen: the tag workflow must also *unzip and launch* the artifact on the runner (`open -W --args -ToDewFixture empty`, assert exit 0 within 10 s) so a zip that cannot start never becomes a release. |

---

## 3. The theme-enforcement gap

> `PLAN.md:110–111` — "Snapshot-test each preview in both themes and both color schemes so the "no literal styling" rule **is enforced by CI, not by review**."

### 3.1 The claim fails on its own mechanics, before any question of coverage

A snapshot test compares a render against a **baseline recorded from the same code**. If `TaskRow` contains `.padding(12)` instead of `theme.space.m`, the first run records 12 points of padding into the Sage Lily baseline *and* into the `TestTheme` baseline, both tests go green, and they stay green forever. Snapshot tests detect **change**, not **wrongness**. As written, `PLAN.md:110–111` enforces nothing at all — it makes the hard-coded value permanent and CI becomes the thing that defends it.

There is a real assertion hiding in the sentence — *the two themes' renders must differ* — but `PLAN.md` never states it, and it is far weaker than it sounds. It fails only when a component's rendering is **entirely** hard-coded. A component that correctly reads nine tokens and hard-codes one padding produces two images that differ, and passes.

Two further mechanical problems make even that assertion unreliable here:

- **The themes are not different enough.** `design/SageLilyTheme.swift` gives both themes `windowMin: 360×480`, `materials.window = .solid` and `materials.rows = .solid`. A view that writes `.solid` or `360` as a literal is invisible to any two-theme comparison. `TestTheme.space` is `2·4·8·12·8·16` against Sage Lily's `4·8·12·16·22·32`: a literal `8` is a legal value of `space.s` in one theme and `space.m` in the other, so the leak lands inside the range of plausible correct output.
- **The renders will use the wrong fonts.** `swift test --package-path Packages/DailyUI` runs outside the app bundle, so `ATSApplicationFontsPath` never applies and `.custom("Jost", size: 15)` silently resolves to SF Pro. Every Sage Lily baseline is recorded in the fallback face, so the entire typography half of the theme is unexercised — and, worse, the baselines *look* right to anyone reviewing them. See finding W4.

### 3.2 What a two-theme pixel diff can and cannot catch

Thirteen classes of styling literal can appear in these views. The design documents demand most of them explicitly (`design/theme-sage-lily.md` specifies 45% opacity on done rows, a 1.5 pt checkbox border, a 1 pt hairline, a 2 pt selected-cell border, line-height 1.25, tracking 0.08em).

| Literal class | Two-theme snapshot with self-recorded baselines | With an explicit "renders differ" assertion |
|---|---|---|
| Color | no — baked into both baselines | only if *every* color is hard-coded |
| Font family / size | no | only if every text style is hard-coded; and see the fallback-font problem above |
| Spacing / padding | no | rarely — the value stays plausible in both themes |
| Corner radius | no | only if every radius is hard-coded (`TestTheme` uses 0, so a single leak *can* show) |
| Stroke / border width | no | no — no token exists (W7) |
| Opacity | no | no — no token exists (W7) |
| Shadow | no | no — no token on the protocol (W7) |
| Material | no | no — both themes are `.solid` for window and rows |
| Animation duration / curve | **structurally impossible** — a still has no time axis | impossible |
| SF Symbol weight / scale | no | no |
| Hard-coded frame sizes | no | sometimes |
| `@Environment(\.colorScheme)` branches in a view | no — both schemes are snapshotted, both look intentional | no |
| Sound | not rendered | not rendered |

**Honest fraction: 0 of 13 as `PLAN.md` describes it; about 2 of 13, partially, with a differs-assertion added.** Snapshots are worth keeping — they catch unintended visual regressions, which is a real and different job — but they are not the enforcement mechanism for the no-literal rule, and describing them that way is the most dangerous sentence in the plan, because it tells everyone the rule is already handled.

### 3.3 The prerequisite nobody has noticed: previews are not enumerable

`PLAN.md:110` says "Snapshot-test each preview". An Xcode `#Preview` block expands to a type the preview runtime discovers; a Swift Testing suite cannot enumerate it, and `PLAN.md` never says how the tests reach the previews. The fix is small and must land in M2 or everything in this section is unbuildable:

```swift
// Packages/DailyUI/Sources/DailyUI/PreviewCatalog.swift
public struct PreviewEntry: Sendable {
    public let id: String            // "TaskRow/fifty"
    public let component: String     // "TaskRow"
    public let state: String         // "fifty"
    public let size: CGSize
    public let tokens: Set<TokenID>  // every token this entry is allowed to read
    public let view: @MainActor @Sendable () -> AnyView
}
public enum PreviewCatalog { public static let all: [PreviewEntry] = [ /* … */ ] }

// TaskRow.swift
#Preview("TaskRow") { PreviewCatalog.grid(for: "TaskRow") }   // Xcode and CI see the same thing
```

### 3.4 The mechanism that actually enforces the rule

Four gates. Together they cover eleven of the thirteen classes, and the two they miss are the two only a human can judge anyway.

**(1) A syntactic lint — `scripts/lint-theme.sh`, gate G4.** Cheap, instant, and the only thing that catches a literal whose value happens to be correct. It runs on `Packages/DailyUI/Sources` excluding the `Theme/` directory:

```bash
#!/usr/bin/env bash
# scripts/lint-theme.sh — a styling literal in a view fails the build.
set -uo pipefail
SRC=Packages/DailyUI/Sources/DailyUI
fail=0
rule() { # $1 = name, $2 = ERE
  local hits
  hits=$(grep -rnE "$2" "$SRC" --include='*.swift' \
         | grep -v '// theme-lint:allow' | grep -v "^$SRC/Theme/") || true
  [ -n "$hits" ] && { printf '\n[%s]\n%s\n' "$1" "$hits"; fail=1; }
}
rule "literal color"     '\.(foregroundStyle|foregroundColor|fill|stroke|tint|border|background)\(\s*(Color[.(]|\.(red|blue|green|black|white|gray|orange|yellow|pink|purple|mint|teal|indigo|brown|cyan))'
rule "literal font"      '\.(font|fontWeight|fontDesign)\(\s*(\.system|\.custom|Font\.)'
rule "numeric padding"   '\.padding\(\s*(\.[a-zA-Z]+\s*,\s*)?[0-9]'
rule "numeric spacing"   '(VStack|HStack|LazyVStack|LazyHStack|Grid|Spacer)\([^)]*spacing:\s*[0-9]'
rule "numeric frame"     '\.frame\([^)]*(width|height):\s*[0-9]'
rule "numeric radius"    'cornerRadius:\s*[0-9]|\.cornerRadius\(\s*[0-9]|RoundedRectangle\(cornerRadius:\s*[0-9]'
rule "numeric stroke"    'lineWidth:\s*[0-9]'
rule "literal opacity"   '\.opacity\(\s*[0-9.]+\s*\)'
rule "literal shadow"    '\.shadow\(\s*(color:|radius:\s*[0-9])'
rule "literal animation" '\.animation\(\s*\.|withAnimation\(\s*\.|\.transition\(\s*\.|\.easeIn|\.easeOut|\.spring\('
rule "literal material"  '(ultraThin|thin|regular|thick|ultraThick)Material'
rule "colorScheme branch" '@Environment\(\\\.colorScheme\)|colorScheme\s*=='
rule "symbol styling"    '\.imageScale\(|\.symbolRenderingMode\(|\.symbolVariant\('
rule "bare Text literal" 'Text\("'          # String Catalog rule, review 01 F7
exit $fail
```

`// theme-lint:allow <reason>` is the escape hatch; CI counts them (gate G4b) and fails above ten, and the PR body must list each one. The last rule enforces `spec-auditor` F7's String Catalog requirement in the same pass.

**(2) A token-read contract — `TokenContractTests`, gate G7.** This is the gate that makes "every value comes from the theme" observable, and it needs one structural change to the starter theme in `design/SageLilyTheme.swift`: today `ThemeColors` is a struct of *stored* `Color`s, so reading `theme.colors.accent` is invisible. Make every token a computed property over a resolver, which keeps every call site in `CLAUDE.md` unchanged (`theme.colors.accent`, `theme.type.body`, `theme.radius.card`, `theme.motion.taskComplete`):

```swift
public enum TokenID: String, CaseIterable, Sendable { case accent, ink, surface, spaceM, radiusCard, motionTaskComplete /* … all of them */ }

public struct ThemeColors: Sendable {
    let resolve: @Sendable (TokenID) -> Color
    public var accent: Color { resolve(.accent) }
    public var ink: Color    { resolve(.ink) }
    // …
}
```

Then a `RecordingTheme` wraps `SageLilyTheme` and logs every `TokenID` read during a render, and the test compares that set against the entry's declared `tokens`:

```swift
@Test(arguments: PreviewCatalog.all)
@MainActor func readsExactlyItsDeclaredTokens(_ e: PreviewEntry) {
    let probe = RecordingTheme(base: SageLilyTheme())
    _ = ImageRenderer(content: e.view().theme(probe)).nsImage
    #expect(probe.read == e.tokens,
            "\(e.id): unexpected \(probe.read.subtracting(e.tokens)), missing \(e.tokens.subtracting(probe.read))")
}
```

A hard-coded value shows up as a **missing** token read. This is the only gate that works for animations (no time axis needed — you assert the hook was *read*), materials, shadows and sound. It also gives `spec-auditor`'s M8 replacement ("every token group is read by at least one view") for free: `#expect(Set(PreviewCatalog.all.flatMap(\.tokens)) == Set(TokenID.allCases))`.

**(3) Sentinel-palette and geometry probes, gate G7b.** Two synthetic themes that turn a leak into a loud failure:

- `SentinelTheme` assigns each color token a unique, otherwise-impossible RGB (`#FF0001`, `#FF0002`, …). Render each catalog entry, collect every pixel appearing more than 50 times, and assert each is a convex combination of at most two sentinels. A hard-coded opaque color fails with its own RGB printed. (Caveat, stated honestly: a hard-coded *opacity* over a sentinel is itself a convex combination, so it passes here — gate 2 catches that one.)
- `BumpedTheme(token:by:)` adds 64 pt to one metric token. For each catalog entry, the entry's ideal size must grow if and only if the entry declares that token. This turns spacing and sizing into arithmetic, which no pixel diff can do.

**(4) Two-theme + two-scheme snapshots, gate G2 — kept, but relabelled.** Their job is visual-regression detection and reviewability of design changes, not rule enforcement. For them to be worth running at all: fonts registered in the test bundle (W4), `ImageRenderer` at a fixed scale rather than window capture, baselines stored per architecture (`Tests/__Snapshots__/arm64/`), a 0.2% perceptual tolerance, and re-recording only via `SNAPSHOT_RECORD=1`, which CI never sets.

**What still cannot be automated, and belongs to the human:** whether the *right* token was used (`danger` where `accent` was meant renders as a perfectly legal image), and whether the result looks like `design/mockups/*.png`. Those two are the entire justification for §4's screenshot protocol — and they are a much smaller, better-posed question than "does this look right", which is what the human is being asked today.

**Replacement text for `PLAN.md:110–111`:**

> Every component's previews live in `PreviewCatalog.all`, and CI runs four gates over that catalog:
> `scripts/lint-theme.sh` (no styling literal survives in `Sources/DailyUI`), `TokenContractTests`
> (each entry reads exactly the tokens it declares, which is also how animation, material and shadow
> tokens are enforced — a still image cannot show them), the sentinel-palette and metric-bump probes,
> and snapshots in both themes and both color schemes. The snapshots are a **regression** gate: they
> prove nothing changed, not that nothing is hard-coded, because baselines are recorded from the code
> under test. The no-literal-styling rule is enforced by the first three; the snapshots and the
> screenshot round in §5 cover what is left — whether the correct token was chosen, and whether the
> result matches `design/mockups/`.

---

## 4. Screenshot protocol

`PLAN.md:18–19` is the whole of the current protocol: "Claude cannot see the running app. After each UI milestone, build, run, screenshot, and paste the screenshots back", plus `PLAN.md:126`, "Include one light, one dark." Nothing says what to put on screen, how big the window is, when in the milestone this happens, or what Claude does with the images. Two shots of whatever state the app happened to be in cannot check any of the six states `CLAUDE.md` requires.

### 4.0 The three things that must exist first (M0 and M2)

1. **Fixtures.** A debug-only launch argument `-ToDewFixture <name>` loads a deterministic store into a temporary container, and `-ToDewNow 2026-09-21T09:00:00-0400` freezes `DayClock`. Without this the human is hand-typing fifty tasks, which means the 50-item, long-title and all-done states are never actually looked at. Fixtures: `empty`, `one`, `fifty`, `long` (a 200-character title, an emoji title, an RTL title), `alldone`, `loading`, `carried` (three leftovers, one at carry 3), `review3`, `month90`, `someday`, `recurring`, `fivehundred`.
2. **`scripts/shots.sh <milestone> [--motion] [--only <n,n>]`.** Builds, then for each (fixture, size, appearance) triple in that milestone's list: launches with the fixture, sets the window frame, sets the appearance, captures the window only, quits. Writes `review-shots/mN/NN-<fixture>-<width>-<appearance>.png`, a `contact.png` contact sheet, and `manifest.txt` (the checklist line for each file). The pieces are all scriptable — appearance with `osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to true'`, the frame with `tell process "ToDew" to set size of window 1 to {360, 480}` (needs a one-time Accessibility grant, which the script explains on first run), the capture with `screencapture -o -l<windowid> out.png`, `--motion` with `screencapture -v -V 5`.
3. **One round, at a fixed point.** The round happens when the code compiles, both packages' tests are green and `lint-theme.sh` exits 0 — not "after the milestone", which is where `PLAN.md:18` puts it and which guarantees findings arrive with no budget left to fix them. Maximum two rounds; a third means the question is wrong and Claude must convert it into a test instead (see Template B).

### 4.1 Per-milestone shot lists

Sizes: **360** = 360×480, the spec minimum and where everything breaks; **720** = 720×560, the default frame; **1100** = 1100×800 for wide-layout milestones. Appearance: **L** light, **D** dark. Unless noted, the theme is Sage Lily; `TestTheme` shots exist to prove the swap, not to be admired.

**M2 — Today (20 stills).**

| # | Fixture | Size | Appearance | What Claude checks |
|---|---|---|---|---|
| 01 | `empty` | 720 | L | Morning empty copy centred; traffic lights in place; no title bar seam; window padding = `space.window` |
| 02 | `empty` | 720 | D | Same, and `background`/`surface` are distinguishable in dark |
| 03 | `one` | 720 | L | Row height ≥ `sizes.rowMinHeight`; checkbox 22 pt; baseline of title vs due pill |
| 04 | `one` | 360 | L | Nothing clipped at the minimum width; entry field still usable |
| 05 | `fifty` | 720 | L | Even row rhythm; done rows sunk below open; scroll bar not overlapping content |
| 06 | `fifty` | 360 | D | Carry badge and recurring glyph survive the narrow width |
| 07 | `long` | 360 | L | **The 200-char, emoji and RTL rows each readable in full** (`SPEC.md:465, 672`) — this is the shot that decides `spec-auditor` F28 |
| 08 | `long` | 720 | D | Same at width |
| 09 | `alldone` | 720 | L | All-done empty state; progress ring at 100%; streak line |
| 10 | `alldone` | 720 | D | |
| 11 | `loading` | 720 | L | Skeleton state exists and is not a spinner on a blank window |
| 12 | `one` | 720 | L | Entry field with parsed chips mid-typing ("Call dentist 3pm !") |
| 13 | `one` | 720 | L | Inline title edit in progress |
| 14 | `one` | 720 | L | Row selected, keyboard focus ring visible without color alone |
| 15–18 | `fifty`, `alldone` | 720 | L+D | `TestTheme` — must be visibly hideous and *structurally identical*; if any of these looks like Sage Lily, something is hard-coded |
| 19 | `fifty` | 720 | L | Larger-Text accessibility setting on (`PLAN.md:140`) |
| 20 | `empty` | 1100 | L | The layout does not stretch into a band of whitespace |

Recordings: `taskComplete`, `taskAdd`, `taskRemove`, `reorder` (4 × 5 s).

**M3 — Rollover and review (10 stills, 2 recordings).** `review3`/720/L+D (three cards, undecided); `review3` with one card in each of the four decided states; `carried`/720/L (nag at threshold — check it reads in text, not only in `accentSecondary`); `review3`/360/D (four choice buttons at minimum width — the layout most likely to break); `empty` after Skip; Today with "Start the day" focus in the entry field. Recordings: `dayRollover` crossfade, `reviewCardSwipe`.

**M4 — Upcoming / Someday / Recurring / Nav (10 stills).** Each of the four views at 720/L and 360/D; `someday` with a stale marker; `recurring` with a paused template and its 7-day history row; the `Nav` pill with each segment selected at 360 (the width where a five-segment pill is hardest); one drag-in-progress between two day groups.

**M5 — History (8 stills).** `month90`/720/L+D (heat map — check that a neutral day and a zero-completion day are distinguishable **without color**, `SPEC.md:463`); day detail with done/dropped/carried/missed rows; search results; empty history; the six StatTiles at 720 and at 360 (where a six-tile row must wrap, not truncate).

**M8 — Final pass (28 stills, 8 recordings).** The four surfaces `SPEC.md:468` names (Today, Review, History, Widget) × L+D × 360+720 = 16; plus Reduce Motion on, Increase Contrast on, system accent set to something clashing (the theme must override it, `SPEC.md:451`), wallpaper token visible behind a solid window, the lily sticker placement, the app icon in four macOS 26 appearances, and the widget in four rendering modes. One 5-second recording per motion hook. Each of the 16 gets its mockup counterpart named in `manifest.txt` so Claude's verdict line is "matches `today.png` except the carry badge sits 4 pt low", not "looks good".

**M6, M7, M9** are not screenshot milestones but still need eyes, via `docs/verify-mN.md` rather than `shots.sh`: notification banners (Focus off, with the exact expected text to compare), the Dock menu open, the Settings window's five panes, the floating panel over a full-screen app and on a second display, the widget in the gallery and placed in all three sizes, and the Gatekeeper "Open Anyway" sequence for the README.

### 4.2 What Claude does with the images

1. One verdict line per file, in the manifest's order: `PASS` or `FAIL: <what is wrong> · cause: <file:line or "unknown"> · fix: <token or change>`. No prose summary, no "looks great".
2. Anything that cannot be judged from the image — a color that is subtly wrong, a 1 pt offset — is not guessed at. Claude says `UNJUDGEABLE` and either converts it into a metric-bump or contrast assertion, or asks for one specific re-shot with a ruler overlay.
3. Fixes go in one commit, and round 2 re-shoots only the failed files (`./scripts/shots.sh m2 --only 05,07,11`).
4. The verdict table goes in the PR body under `## Screenshot round`, with the images attached, so the reason for every visual change is on the record.
5. If the same file fails twice, Claude stops and says so. A third round is a signal that the prompt, not the code, is wrong.

---

## 5. Proposed CI gates

> `PLAN.md:48` — "└── .github/workflows/ci.yml    # swift test on DailyCore/DailyUI each push; release zip on tags"

That is two gates. It cannot build `App/` or `Widget/` (SwiftPM does not build Xcode targets), so the two products that ship are never compiled by CI; it has no gate for the theme rule that §4 says CI enforces; and it does not check the coverage, the acceptance mapping or the release artifact's ability to launch.

### 5.1 The gate set

| Gate | Runs | Command | Fails when |
|---|---|---|---|
| **G1** core tests | every push | `swift test --package-path Packages/DailyCore` | any logic test fails |
| **G2** UI + snapshot tests | every push | `swift test --package-path Packages/DailyUI` | a snapshot differs beyond tolerance, or a catalog entry fails to render |
| **G3** coverage | every push | `./scripts/coverage.sh QuickEntryParser.swift RecurrenceEngine.swift` | region coverage < 100% for either (`PLAN.md:80`) |
| **G4** theme lint | every push | `./scripts/lint-theme.sh` | any styling literal in `Sources/DailyUI` |
| **G4b** allow budget | every push | `grep -rc 'theme-lint:allow' Packages/DailyUI/Sources \| awk -F: '{s+=$2} END{exit s>10}'` | more than ten escape hatches |
| **G5** preview completeness | every push | `swift test --filter PreviewCatalogTests` | a `PLAN.md` §4 component or state has no catalog entry, or an entry lacks one of `CLAUDE.md`'s six universal states |
| **G6** font registration | every push | `swift test --filter FontRegistrationTests` | `NSFont(name: "Jost-Regular", …)` or `NSFont(name: "CormorantGaramond-Medium", …)` does not resolve **inside the test bundle** (`spec-auditor` F18 — and see W4: without this, every snapshot baseline is recorded in the wrong typeface) |
| **G7** token contract | every push | `swift test --filter 'TokenContractTests\|SentinelPaletteTests\|MetricBumpTests'` | a component reads a token set other than the one it declares, an unknown color reaches the framebuffer, or a metric bump fails to move a component that declares that metric |
| **G8** app + widget compile | every push | `xcodebuild -project ToDew.xcodeproj -scheme ToDew -configuration Debug -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO build` and the same for the widget scheme | either target stops compiling — the single most common way a package-only CI goes green on a broken app |
| **G9** XCUITest smoke | nightly + release tags | `xcodebuild test -scheme ToDew -only-testing:ToDewUITests` | launch, add-and-relaunch, or Settings open/close fails (`spec-auditor` F22) |
| **G10** paperwork | pull requests | `git diff --name-only origin/main... \| grep -q '^CHANGELOG.md$'` | a PR changes code without a changelog line (`CLAUDE.md`: "Update `CHANGELOG.md` in every PR") |
| **G11** no network | every push | `grep -rn 'URLSession\|NWConnection\|CFSocket\|Network\.' Packages App Widget --include='*.swift' \| grep -v 'App/Update/ReleaseCheck.swift'` must be empty | any network call outside the one permitted release check (`SPEC.md:577–579`, `CLAUDE.md`) |
| **G12** acceptance map | every push | `./scripts/acceptance-map.sh` | any `SPEC.md` acceptance line assigned to this milestone lacks a `_specNNN` test, or a `_specNNN` name cites a line that is not an acceptance row |
| **G13** M8 precondition | the `m8-design` branch only | `ls design/mockups/{today,review,history,widget}.png` | M8 opens before its only stated reference exists (`spec-auditor` F10) |
| **G14** release | version tags | `./scripts/release.sh` then unzip, `open -W ToDew.app --args -ToDewFixture empty`, assert clean exit | the zip cannot be produced, or the produced app cannot launch |
| **G15** performance | nightly | `./scripts/perf.sh` | cold launch with 500 tasks > 1.0 s, or any animation hitch > 16 ms (`SPEC.md:464, 670`) |

Suggested split so a PR stays fast: G1–G8 and G10–G12 on `pull_request` (target: under eight minutes); G9 and G15 on `schedule`; G13 gated on branch name; G14 on `push: tags: v*`.

```yaml
# .github/workflows/ci.yml (sketch)
on: { pull_request: {}, push: { branches: [main], tags: ['v*'] }, schedule: [{ cron: '0 7 * * *' }] }
jobs:
  checks:
    runs-on: macos-26            # see 5.2 — if unavailable, macos-15 + xcode-select to a 26 beta
    steps:
      - uses: actions/checkout@v4
      - run: sudo xcode-select -s /Applications/Xcode_26.app
      - run: swift test --package-path Packages/DailyCore            # G1
      - run: swift test --package-path Packages/DailyUI              # G2 G5 G6 G7
      - run: ./scripts/coverage.sh QuickEntryParser.swift RecurrenceEngine.swift  # G3
      - run: ./scripts/lint-theme.sh                                 # G4
      - run: ./scripts/acceptance-map.sh                             # G12
      - run: xcodebuild -project ToDew.xcodeproj -scheme ToDew -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO build   # G8
      - run: xcodebuild -project ToDew.xcodeproj -scheme ToDewWidgetExtension -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO build
```

### 5.2 What CI on this project honestly cannot do

- **It cannot prove the App Group works.** An App Group identifier is Team-ID-prefixed and the repo's `DEVELOPMENT_TEAM` is blank by rule (`CLAUDE.md`), so a GitHub-hosted runner can compile the entitlement but never exercise it. (`review/02-feasibility.md` F1/F5 develops this.) The App Group stays a human gate, owned by M0's spike report and re-checked on the release zip.
- **Snapshot baselines are architecture- and OS-bound.** Baselines recorded on the author's Mac will not match a runner byte for byte. Record on the runner (`SNAPSHOT_RECORD=1` in a manual workflow that opens a PR with the new baselines), store them under `Tests/__Snapshots__/<arch>/`, pin the runner image, and use a perceptual tolerance rather than exact equality.
- **XCUITests need a GUI session** and are slow and flaky on hosted runners. Nightly, never blocking a PR, and kept to `spec-auditor` F22's three.
- **Performance numbers are machine-dependent.** G15 protects against a collapse (a 3 s launch), not a regression of 40 ms; the real 500-task check is M9's on a real Mac.
- **Notifications, launch-at-login, Gatekeeper and the widget gallery cannot be automated at all.** They belong to `docs/verify-m6.md`, `docs/verify-m7.md` and `docs/verify-m9.md`.
- **Nothing here checks that the app is any good.** Every gate above is necessary and none is sufficient; that is what §4 is for.

### 5.3 The per-milestone exit checklist `PLAN.md` is missing

Add a §3.1 to `PLAN.md`. Every milestone's PR body opens with this block, filled in, and Claude self-checks it before handing back — this is the concrete form of the "first message back" instruction in §1's preamble.

```markdown
## Exit checklist — milestone N
Gates (paste the real output of each, not a claim):
- [ ] G1 core tests           swift test --package-path Packages/DailyCore
- [ ] G2 UI tests             swift test --package-path Packages/DailyUI
- [ ] G3 coverage             ./scripts/coverage.sh …            (M1+)
- [ ] G4 theme lint           ./scripts/lint-theme.sh            (M2+)
- [ ] G5 preview catalog      …                                  (M2+)
- [ ] G7 token contract       …                                  (M2+)
- [ ] G8 app + widget build   xcodebuild … CODE_SIGNING_ALLOWED=NO build
- [ ] G12 acceptance map      ./scripts/acceptance-map.sh
"Done when" clauses (one line per clause of PLAN.md §3 row N):
- [ ] <clause>  →  <command or shot file>  →  pass / fail / not-run
Screenshot round (UI milestones):
- [ ] ./scripts/shots.sh mN run, N files posted, verdict table in this PR
- [ ] every FAIL fixed or carried with an issue link and a reason
Paperwork:
- [ ] CHANGELOG.md updated under [Unreleased]
- [ ] docs/interpretations.md rows added for every SPEC.md judgement call
- [ ] SPEC.md edits proposed in this PR for anything I had to interpret (CLAUDE.md)
- [ ] no new dependency; no edit to CLAUDE.md, Config/ or .github/ without an explicit yes
- [ ] nothing disabled: no skipped test, no widened tolerance, no re-recorded baseline,
      no new theme-lint:allow beyond those listed here with reasons
Handback:
- [ ] first sentence of my final message names every fail / not-run line, or says there are none
```

---

## 6. Findings

Seven blockers, six should-fix, three nits. Each is a change to `PLAN.md` (or, where noted, to `CLAUDE.md`) that the integrator can paste.

---

### W1 — One prompt for ten milestones, and it never says what to do when blocked or when the documents disagree · **blocker**

> `PLAN.md:115` — "Per milestone, open a branch and start Claude Code in the repo with a prompt of this shape:"
> `PLAN.md:117–121` — "> Read CLAUDE.md, SPEC.md and PLAN.md. We are on milestone **N** (`branch-name`). Implement the deliverable in PLAN.md §3 row N. Work test-first in DailyCore where the milestone touches logic. Do not hard-code any color, font, size, radius or animation in a view — read the theme from the environment. **When you need to see the app, stop and tell me what to run and screenshot.** Finish by updating CHANGELOG.md and listing anything in SPEC.md you had to interpret."

**Consequence.** Three failures, each of which costs a milestone. (1) "When you need to see the app" is left to Claude's judgement, so the stop happens either too early (asking for screenshots of a half-built view) or, far more likely, never — the model completes the milestone, declares it done, and the human discovers at M8 that six milestones of views were never looked at. (2) There is no blocked protocol, so an agent that hits the App Group signing wall (M0), a SwiftData transaction that will not roll back (M3) or a missing settings store (M6) will invent a workaround, stub it, or silently narrow the scope — and `PLAN.md` has told it to "Finish by updating CHANGELOG.md", which it will do, on a milestone that is not finished. (3) `SPEC.md` and `PLAN.md` already contradict each other in at least five places that `review/01-spec-coverage.md` documents; the prompt says to read both and gives no precedence rule, so the resolution is whichever document the model read last. "Listing anything in SPEC.md you had to interpret" has no destination, no format and no consumer (see W10).

**Proposed replacement text.** Replace `PLAN.md:113–131` with §1 of this review in full: the common preamble (scope, the checklist-first message, the precedence rule, the four-part BLOCKED format, the never-without-asking list, the ordered handback) plus addendum A for M0/M1, B for M2–M5 and M8, and C for M6/M7/M9.

---

### W2 — The no-literal-styling rule is not enforced by CI, and saying it is will stop anyone from enforcing it · **blocker**

> `PLAN.md:110–111` — "Snapshot-test each preview in both themes and both color schemes so the "no literal styling" rule is **enforced by CI, not by review**."
> `PLAN.md:139` — "| Theme layer leaks (a literal color somewhere) | Snapshot tests in `TestTheme` from M2; **a leaked value shows up as a wrong color in CI** |"

**Consequence.** A snapshot baseline is recorded from the code under test. `.padding(12)` is written into the Sage Lily baseline and the `TestTheme` baseline on the first run; both tests pass, and they pass forever. A leaked value does not "show up as a wrong color in CI" — there is nothing for it to be wrong against. Meanwhile `§6`'s risk table declares this risk retired, so no one builds the mechanism that would retire it, and the rule degrades into exactly the review-by-eye that `PLAN.md` says it has replaced. Nine of thirteen literal classes are invisible to any pixel comparison — animation curves have no time axis in a still, and both shipped themes agree on `materials.window`, `materials.rows` and `windowMin`, so those literals are invisible even in principle (§3.2).

**Proposed replacement text.** For `PLAN.md:110–111`, the paragraph at the end of §3.4 above. For the `PLAN.md:139` risk row:
> `| Theme layer leaks (a literal color, size, curve or material) | scripts/lint-theme.sh (syntactic) + TokenContractTests against a RecordingTheme (a hard-coded value shows up as a token that was never read) + sentinel-palette and metric-bump probes, all from M2. Snapshots are a regression gate, not an enforcement one: they record whatever the code does. |`

---

### W3 — "Snapshot-test each preview" is not implementable: a test cannot enumerate `#Preview` blocks · **blocker**

> `PLAN.md:110` — "**Snapshot-test each preview** in both themes and both color schemes…"
> `PLAN.md:95` — "Build each once in M2–M5, **with a preview that shows every state listed**:"

**Consequence.** `#Preview` expands to a type discovered by the Xcode preview runtime; a Swift Testing suite has no portable way to list them. Claude Code will hit this on the first day of M2 and resolve it by hand-writing a second, parallel set of test views — which drift from the previews within a milestone, so the suite stops testing what the human is shown in Xcode and `PLAN.md` §4's state lists quietly become aspirational. `CLAUDE.md`'s "Snapshot tests run every component preview in both themes" inherits the same impossibility.

**Proposed replacement text — add after `PLAN.md:95`:**
> `Previews and tests read the same source. \`PreviewCatalog.all\` in \`Sources/DailyUI\` is an array of \`PreviewEntry\` (id, component, state, size, the set of theme tokens the entry is allowed to read, and a view builder); every \`#Preview\` block renders \`PreviewCatalog.grid(for:)\` rather than an inline view, and every snapshot, token-contract and accessibility test iterates the same array. A component or state named in the table below that has no catalog entry fails \`PreviewCatalogTests\` — which is what makes this table a gate instead of a wish list.`

---

### W4 — `swift test` on `DailyUI` cannot see the app's fonts, so every Sage Lily snapshot is recorded in the wrong typeface · **blocker**

> `PLAN.md:44` — "│       └── Tests/DailyUITests  # snapshot tests per component state"
> `PLAN.md:150` — "…and put the two font families' TTFs into `App/Fonts/`."

**Consequence.** `ATSApplicationFontsPath` registers fonts from the **app bundle**. A SwiftPM test run is not the app, so `.custom("Jost", size: 15)` silently falls back to SF Pro and `.custom("Cormorant Garamond Medium", size: 34)` to New York. Every Sage Lily baseline is therefore recorded in the wrong faces — and looks entirely plausible, because SwiftUI's fallback is silent. The typography half of the theme is never exercised by any gate; a hard-coded `.font(.system(size: 15))` and the correct `theme.type.body` render **identically** in CI, which removes the one literal class a snapshot diff could otherwise have caught. `spec-auditor` F18 catches the app-side registration; this is the test-side half, and without it F18's fix does not reach the suite.

**Proposed replacement text — amend `PLAN.md:44` and append to M2's "Done when":**
> §1 L44: `│       ├── Sources/DailyUI/Resources/Fonts   # the five TTFs, .process()'d into the package bundle`
> M2: `…; the five font files live in \`Packages/DailyUI/Sources/DailyUI/Resources/Fonts\` and are declared as a package resource, \`App/Fonts\` is a symlink or a copy-phase reference to the same files so app and tests can never diverge, \`DailyUI\` registers them at first use via \`CTFontManagerRegisterFontsForURL\`, and \`FontRegistrationTests\` fails if \`NSFont(name: "Jost-Regular", size: 15)\` or \`NSFont(name: "CormorantGaramond-Medium", size: 34)\` resolves to a fallback — snapshot baselines are only valid once this test passes.`

---

### W5 — There is no way to put the app into the states the quality bar requires, so they will never be screenshotted · **blocker**

> `PLAN.md:18–19` — "**Human in the loop for UI.** Claude cannot see the running app. After each UI milestone, build, run, screenshot, and paste the screenshots back."
> `CLAUDE.md` — "Every component preview shows: empty, loading, one item, 50 items, very long title, all done."

**Consequence.** To photograph "50 items" the human types fifty tasks. To photograph "very long title" they paste a 200-character string. To photograph the morning review they must wait for 6 AM or change the system clock. To photograph a 3-day carry they must use the app for three days. None of that will happen, so the states that actually break layouts — fifty rows, a 200-character title at 360 pt, an RTL title, the nag at threshold, a 90-day heat map — are the exact states no one ever sees, and `SPEC.md:672`'s acceptance row is verified by nobody. The screenshots that do get taken will all be of one or two hand-typed tasks in a default-size window, which is the state least likely to be wrong.

**Proposed replacement text — replace `PLAN.md:18–19`:**
> `5. **Human in the loop for UI, on rails.** Claude cannot see the running app and neither can I, casually. From M0 the app accepts \`-ToDewFixture <name>\` (debug builds only) to load a deterministic store into a temporary container, and \`-ToDewNow <ISO-8601>\` to freeze \`DayClock\`. Fixtures: empty, one, fifty, long (200-char + emoji + RTL), alldone, loading, carried, review3, month90, someday, recurring, fivehundred. \`scripts/shots.sh <milestone>\` builds, then for every (fixture, window size, appearance) in that milestone's list launches, sets the frame, sets light or dark, captures the window and quits, writing numbered PNGs plus a \`manifest.txt\` of what each one is for. A UI milestone has exactly one screenshot round, taken the moment the tests and the theme lint are green — see §5's protocol.`

---

### W6 — The screenshot loop happens *after* the milestone, which is the one time findings cannot be acted on · **blocker**

> `PLAN.md:18–19` — "…**After each UI milestone**, build, run, screenshot, and paste the screenshots back."
> `PLAN.md:126` — "- **Paste screenshots, not descriptions,** for every UI milestone. **Include one light, one dark.**"

**Consequence.** "After" means the PR is written, the changelog is updated and the agent has declared the milestone done before anyone looks at a pixel. Every finding then arrives as rework against a closed context, and the pressure is to accept it and move on — which is how M8 turns into the rewrite `PLAN.md:91` promises it is not. "One light, one dark" of an unspecified screen at an unspecified size is two images; §4 shows M2 needs twenty and M8 twenty-eight. And with no cap on rounds, the alternative failure is the opposite one: an open-ended exchange of one-off screenshots, the classic way a UI milestone thrashes for a day without converging.

**Proposed replacement text — replace `PLAN.md:126`:**
> `- **One screenshot round per UI milestone, at a fixed point and with a fixed list.** It happens when the code compiles, both packages' tests pass and \`scripts/lint-theme.sh\` exits 0 — not after the PR is written. Claude posts a single request naming \`./scripts/shots.sh mN\`, what it will check in each numbered file and which token governs it, then stops. I run one command and drag in a folder. Claude replies with one PASS/FAIL verdict line per file and fixes the failures. Round 2 re-shoots only the failures. There is no round 3: if a question survives two rounds, Claude converts it into a test (a contrast assertion, a metric-bump probe, a size assertion) instead of asking again. Motion is requested as a 5-second recording, never a still.`

---

### W7 — The theme has no token for opacity, stroke width, border width, line height, tracking or shadow, so the no-literal rule cannot be obeyed in M2 · **blocker**

> `PLAN.md:11–13` — "**One theme layer.** No literal colors, fonts, sizes, radii or animation curves inside views. Everything comes from `@Environment(\.theme)`."
> `PLAN.md:81` — "| 2 | `m2-today` | Theme layer + Today list | `Theme` protocol, `SageLilyTheme`, `TestTheme`; …"

**Consequence.** `design/theme-sage-lily.md` requires, in M2's own components, a 45% opacity on done rows, a 1.5 pt `accent` checkbox border, a 1 pt `line` hairline on cards, line-height 1.25 on body text and tracking 0.08em on labels; M5 adds a 2 pt selected-cell border. The `Theme` protocol in `design/SageLilyTheme.swift` has `colors`, `type`, `radius`, `space`, `sizes`, `motion`, `materials` — and no opacity, no stroke width, no line height, no shadow (the JSON ships `shadow.window`; the protocol drops it), no icon metrics. So on day two of M2 the agent must either write `0.45`, `1.5` and `1.0` as literals — breaking the rule the same milestone establishes it, and setting the precedent for every milestone after — or stop and invent tokens, which the prompt does not authorise. The first is far likelier, and once `lint-theme.sh` exists those become ten `// theme-lint:allow` comments in the first component.

**Proposed replacement text — extend `PLAN.md:11–13` and add a §2 bullet:**
> §0.2: `**One theme layer.** No literal colors, fonts, sizes, radii, **stroke widths, opacities, shadows, materials** or animation curves inside views. Everything comes from \`@Environment(\.theme)\`. If a value has no token, the missing token is the bug — add it to the protocol and to both themes, never the number to the view.`
> §2 (new bullet): `- **Theme surface.** \`Theme\` exposes \`colors\`, \`type\` (including \`lineHeight\` and \`tracking\` per style), \`space\`, \`radius\`, \`sizes\`, \`stroke\` (hairline, checkboxBorder, ringStroke, selectedBorder), \`opacity\` (done, disabled, idleIcon, decidedCard), \`shadow\`, \`materials\` and \`motion\` — one member per key in \`design/theme-sage-lily.json\`, checked by \`ThemeTokenCoverageTests\`. Every token is a computed property over a resolver closure rather than a stored value, so a \`RecordingTheme\` can observe which tokens a view actually read; call sites are unchanged (\`theme.colors.accent\`, \`theme.space.m\`).`

---

### W8 — CI never builds the two things that ship · **should-fix**

> `PLAN.md:48` — "└── .github/workflows/ci.yml    # swift test on DailyCore/DailyUI each push; release zip on tags"

**Consequence.** SwiftPM cannot build an Xcode app or widget target. As specified, `App/` and `Widget/` are compiled by nobody between M0 and the first release tag, so a PR can be fully green while the app does not build — and the first time anyone finds out is `./scripts/release.sh` on the `v1.0.0` tag, which is also the first time `release.sh` has ever run (`spec-auditor` F26). Nor does this workflow run any of the gates §4 depends on.

**Proposed replacement text — replace the comment on `PLAN.md:48` and add a §3.2:**
> §1 L48: `└── .github/workflows/ci.yml    # PRs: both packages' tests, coverage, theme lint, acceptance map, xcodebuild of App and Widget with signing off. Nightly: XCUITest smoke + 500-task perf. Tags: release zip, unzipped and launched.`
> §3.2 (new): the gate table in §5.1 of this review, with the note that no CI job can verify the App Group, snapshot baselines are recorded on the runner and stored per architecture, and hosted-runner performance numbers guard against collapse only.

---

### W9 — Nine of the ten "Done when" cells are deliverable lists, not gates, and no milestone has a definition of done · **should-fix**

> `PLAN.md:75` — "**Each ends in something that runs and can be checked.** Suggested prompt to open each one is in §5."
> `PLAN.md:84` — "| 5 | `m5-history` | History + stats + export | Month heat map with CalendarCell, day detail, search, duplicate-to-today, StatTile row, JSON/Markdown export, import, delete-older-than |"

**Consequence.** Of the 49 clauses across the ten cells, 4 are commands and 39 are lists of nouns. M5's cell names eight deliverables and states a success condition for none of them: an agent satisfies "export, import" by writing functions that round-trip lossily, and "StatTile row" by shipping two tiles. Because nothing distinguishes "built" from "correct", the milestone closes on the agent's own say-so, which is precisely the judgement the human cannot check from here. `PLAN.md:75` asserts the opposite is true, which means nobody goes looking.

**Proposed replacement text.** Replace every cell per §2's table, and add after `PLAN.md:75`:
> `Each cell below is a list of **gates**, not of features: every clause names the command that settles it or the numbered screenshot that shows it. A clause that names neither is a bug in this plan — report it instead of interpreting it. Before writing code, Claude turns the cell into the exit checklist in §3.1 and posts it; before handing back, Claude fills it in with real command output. A milestone is done when every line reads pass, and not before.`

---

### W10 — Interpretations of `SPEC.md` have nowhere to go · **should-fix**

> `PLAN.md:121` — "> Finish by updating CHANGELOG.md and **listing anything in SPEC.md you had to interpret**."
> `PLAN.md:127–128` — "- **Keep SPEC.md the truth.** When a decision changes in conversation, ask Claude to edit SPEC.md in the same PR."

**Consequence.** "Listing" means listing in chat, where it scrolls away. `CLAUDE.md` asks for something stronger — "If you have to interpret something in `SPEC.md`, say so in the PR description and propose the edit to `SPEC.md` in the same PR" — but gives no format, so the interpretations arrive as prose in ten different shapes and no one can tell at M9 which ambiguities were resolved, how, or whether `SPEC.md` was ever updated. `review/01-spec-coverage.md` lists thirty unassigned requirements; each one will be interpreted by somebody during some milestone.

**Proposed replacement text — in the §5 preamble (see §1) and as a new §1 tree entry:**
> §1: `├── docs/interpretations.md     # every SPEC.md judgement call: milestone, SPEC line, what was ambiguous, what was built, proposed SPEC edit`
> §5: `Every interpretation is a row in \`docs/interpretations.md\` — \`| Milestone | SPEC.md line | PLAN.md line | The ambiguity | What I built | Proposed SPEC.md edit |\` — added during the milestone, repeated in the PR body, and folded into SPEC.md in the same PR. A milestone with an empty interpretations section on a spec this size is a claim I will check, not a good sign.`

---

### W11 — The diff-size rule fires after the damage · **should-fix**

> `PLAN.md:129` — "- **Short PRs.** If a milestone grows past ~800 lines of diff, split it (e.g. M3a rollover, M3b review)."

**Consequence.** By the time a diff is 800 lines the milestone's design is committed; splitting then means unpicking it, so in practice it will not be split and M2 lands as a 2,500-line PR that no human can review and that carries every early theme decision inside it. Three milestones are obviously over the line before a line is written: M2 (theme layer + six components + previews + keyboard + persistence + window chrome), M5 (heat map + detail + search + six stats + two exporters + importer + pruning) and M6 (four notification types + badge + Dock menu + eighteen settings + login item + floating panel). M3's split is already predicted in the sentence itself, which is the tell.

**Proposed replacement text:**
> `- **Short PRs, split in advance.** Four milestones open as two branches each, decided now rather than discovered at 800 lines: **M2a** theme layer, PreviewCatalog, Checkbox, TaskRow, EmptyState, snapshot and token gates · **M2b** Today list, entry field, keyboard, persistence, window chrome. **M3a** rollover triggers and engine wiring · **M3b** morning review UI. **M5a** history, heat map, day detail, search · **M5b** the six stats, export, import, pruning. **M6a** notifications and Dock · **M6b** Settings, launch at login, floating panel. Each half is a PR with its own exit checklist; only the second half of each pair closes the milestone row in §3.`

---

### W12 — §7 tells the human to expect one question, which trains the agent not to ask · **should-fix**

> `PLAN.md:147–148` — "2. Open Claude Code on `m0-scaffold` with the §5 prompt. **Its only question back should be the bundle prefix** — answer `com.<your GitHub username>.todew`."

**Consequence.** This sets the norm for the whole project on day one: questions are a sign something has gone wrong. But M0 alone has to settle the App Group spike across two signing environments (`review/02-feasibility.md` F1/F5), whether `swift test` can run under the available toolchain, and what the placeholder icon is — all of which should produce questions. An agent primed to ask nothing will decide these silently, and the human will read "M0 complete" as confirmation the plan was right.

**Proposed replacement text:**
> `2. Open Claude Code on \`m0-scaffold\` with the §5 prompt and addendum A. Expect its first message to be M0's exit checklist, with the App Group spike flagged as the one item it cannot settle alone, and at least one question — the bundle prefix (answer \`com.<your GitHub username>.todew\`) and probably the placeholder icon and which Xcode 26 toolchain CI should select. A milestone that opens with no questions on a spec this size means the ambiguities were resolved silently; ask which ones.`

---

### W13 — "Match `today.png` spacing" is an instruction with no checkable outcome, against files that may not exist · **should-fix**

> `PLAN.md:130–131` — "- **Use the mockups.** Export the Sage Lily row of the canvas to `design/mockups/` and reference the files by name in prompts ("**match `today.png` spacing**")."

**Consequence.** Claude can read `today.png` and copy values *out* of it, but it cannot see its own output, so "match" is a claim it can never verify and the human is left comparing two images by eye with no stated tolerance. And `design/mockups/` does not exist — its creation is item 3 of the §7 to-do list with no owner and no gate (`spec-auditor` F10), so the reference may be missing at the moment M8 needs it. The predictable result is an M8 whose central instruction is unexecutable and whose acceptance is a conversation.

**Proposed replacement text:**
> `- **Use the mockups as an input, and as a checklist item, never as a gate.** \`design/mockups/{today,review,history,widget}.png\` must exist before M8 opens (CI fails the \`m8-design\` branch if they do not). Claude reads them to derive token values and writes what it derived into \`design/theme-sage-lily.json\`, so the comparison happens between two files rather than between an image and a memory. Whether the built app matches is settled in the screenshot round: each numbered shot's manifest line names its mockup counterpart, and Claude's verdict is specific ("matches \`today.png\` except the carry badge sits 4 pt low"), never "matches".`

---

### W14 — A legitimate visual change has no documented way to update a baseline · **nit**

> `PLAN.md:44` — "│       └── Tests/DailyUITests  # snapshot tests per component state"

**Consequence.** Every intentional design change from M2 to M8 breaks every snapshot it touches. With no recorded procedure, the agent will do the fastest thing — delete the baselines, or widen the tolerance until the suite is green — and neither leaves a trace in the diff that a reviewer would notice. That converts the regression gate into noise in exactly the milestone (M8) where it is most needed.

**Proposed replacement text — amend `PLAN.md:44`:**
> `│       ├── Tests/DailyUITests/__Snapshots__/<arch>/  # baselines, per architecture, committed`
> `│       └── Tests/DailyUITests   # one snapshot per PreviewCatalog entry × theme × scheme; re-record only with SNAPSHOT_RECORD=1, which CI never sets, and only in a commit that changes nothing else, so the visual diff is reviewable on its own`

---

### W15 — Nothing says CI must be green before a milestone merges · **nit**

> `PLAN.md:4` — "How to go from the product spec (`SPEC.md`) and the chosen theme (`design/theme-sage-lily.md`) to a shipped 1.0, with Claude Code doing the coding. **One milestone per branch and pull request.**"

**Consequence.** All the gates in §5 are advisory unless merging is conditioned on them. On a solo repo the merge button is always available, and after a long milestone the temptation is to merge a red PR and "fix it in the next one" — which is how M1's coverage gate, the one with a hard 100% threshold, gets quietly abandoned.

**Proposed replacement text — append to `PLAN.md:4`:**
> `One milestone per branch and pull request. \`main\` is protected: the \`checks\` job (§3.2) must pass and the PR body's exit checklist must have no fail or not-run line before merge. A milestone that needs a gate relaxed changes the gate in its own PR, with the reason in the description — it never merges around it.`

---

### W16 — `CLAUDE.md`'s command list omits every script the plan depends on, so Claude will not know they exist · **nit**

> `PLAN.md:26` — "├── CLAUDE.md                   # build/test commands + rules for Claude Code"
> `CLAUDE.md`, Commands: `swift test` ×2, `xcodebuild build`, `xcodebuild test`, `./scripts/release.sh`

**Consequence.** `CLAUDE.md` is the only file guaranteed to be read on every run. The theme lint, the coverage gate, the screenshot harness and the fixture flags are the difference between this plan working and not working, and none of them is discoverable from it — so each new milestone's agent re-derives its own way of checking, or does not check.

**Proposed replacement text — for `CLAUDE.md`'s Commands block (integrator to apply there, not in `PLAN.md`):**
> ```bash
> # Gates — run these before handing back; CI runs the same ones
> ./scripts/lint-theme.sh                                  # no styling literal in a view
> ./scripts/coverage.sh QuickEntryParser.swift RecurrenceEngine.swift
> ./scripts/acceptance-map.sh                              # every SPEC acceptance row has a _specNNN test
> xcodebuild -project ToDew.xcodeproj -scheme ToDew -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO build
>
> # Screenshots — I run this, you read the PNGs. One round per UI milestone.
> ./scripts/shots.sh m2                 # all shots for a milestone
> ./scripts/shots.sh m2 --only 05,07    # re-shoot failures
> ./scripts/shots.sh m8 --motion        # 5-second recordings of the motion hooks
>
> # Fixtures (debug builds only)
> open build/Debug/ToDew.app --args -ToDewFixture fifty -ToDewNow 2026-09-21T09:00:00-0400
> ```

---

*End of review 04.*
