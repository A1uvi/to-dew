# Review 01 — Spec Coverage Audit of `PLAN.md`

**Reviewer:** `spec-auditor` · **Date:** 2026-09-21 · **Lens:** does every requirement in `SPEC.md` land in a milestone in `PLAN.md` §3?

**Sources read:** `SPEC.md` (808 lines), `design/To Dew Product Spec.pdf` (20 pages, text-extracted via pypdf to verify the mangled tables), `PLAN.md`, `CLAUDE.md`, `design/theme-sage-lily.md`, `design/theme-sage-lily.json`.

> **Note on the PDF.** I extracted all 20 pages and diffed them against `SPEC.md`. The extraction in `SPEC.md` is faithful: every table (Task fields p.4–5, Keyboard p.5, Review choices p.6, Recurrence rules p.7–8, Stats p.9, Notifications p.10, Widget sizes p.11, Architecture p.13, Data model p.14, Distribution p.15, Acceptance tests p.16–17, Milestones p.17–18) retained all of its columns and rows. No requirement was lost in extraction, so `SPEC.md` line numbers are cited throughout as the primary reference, with PDF pages given alongside.

---

## 1. UNASSIGNED scope

Requirements in `SPEC.md` (or in the chosen theme's token file) that **no milestone row in `PLAN.md` §3 claims**. Ordered roughly by blast radius.

1. **Settings persistence — where do the ~18 settings live?**
   `SPEC.md:551–555` (PDF p.14) lists 18 user-adjustable settings. `SPEC.md:543–544` gives `AppState` exactly four fields: `lastOpenedLogicalDay, rolloverMinutes, longestStreak, schemaVersion`. `PLAN.md` §2 (L53–71) defines `Day`, `RolloverEngine`, `StreakCalculator`, `QuickEntryParser`, `RecurrenceRule`, `Store`, `Undo` — and no settings model. M6 (L85) says "Settings window (every setting in the spec)" but nothing gives it storage.
   *If it ships missing:* M6 invents an ad-hoc `@AppStorage` scatter outside the `Store` actor, so the widget (which reads the App Group container, `SPEC.md:414`) cannot see `rolloverMinutes`, `badge mode` or `show streaks`, and the widget's rollover-aware timeline (`SPEC.md:411`) computes the wrong rollover hour.

2. **Schema versions declared from the first release.**
   `SPEC.md:520–521` (PDF p.14): "Schema versions are declared from the first release, so later updates can migrate user data safely." No milestone mentions `VersionedSchema`, `SchemaMigrationPlan` or `schemaVersion` wiring. M0 (L79) and M1 (L80) are both silent.
   *If it ships missing:* this is the one requirement that cannot be retrofitted. Ship 1.0 on an unversioned SwiftData container and every post-1.0 model change either wipes user history or requires a hand-written migration from an unnamed schema.

3. **Six acceptance-table rows that cannot run in `DailyCore`.**
   M1's gate (L80) is "Every row of the spec's acceptance table passes from `swift test`". These six rows are not `DailyCore`-testable and no other milestone claims them:
   - `SPEC.md:618` "App open across 6:00 AM → List rolls over live; review appears; no restart needed" (needs the running app — M3)
   - `SPEC.md:629–630` "Crash in the middle of rollover → On relaunch, the day is either fully old or fully new" (needs a crash/kill harness against a real store)
   - `SPEC.md:663–664` "Task checked in the widget while the app is open → App list updates within 1 second" (needs the widget — M7)
   - `SPEC.md:666–667` "Widget visible at 6:00 AM with the app closed → Widget switches to the new day on its own" (M7)
   - `SPEC.md:669–670` "500 tasks in one day → Scrolling stays smooth; launch under 1 second" (UI perf — M9)
   - `SPEC.md:672–673` "Title of 200 characters, or emoji, or right-to-left text → Displays fully; no clipping" (rendering — M2/M9)
   *If it ships missing:* M1 is either blocked forever on rows it structurally cannot satisfy, or Claude Code quietly declares them "N/A" and six of the spec's twenty stated guarantees are never verified by anyone.

4. **GitHub Releases update check, off by default.**
   `SPEC.md:577–579` (PDF p.15): "The app can check the GitHub Releases feed and show a 'new version available' link. This is the only network call and it is off by default." `CLAUDE.md` repeats it ("No network calls except the optional, off-by-default release check"). No milestone row contains it; M9 (L88) covers README and tagging only.
   *If it ships missing:* users on the prebuilt zip path — who by definition have no automatic updates (`SPEC.md:577`) — have no way at all to learn a new version exists.

5. **String Catalog for all user-facing text.**
   `SPEC.md:524–525` (PDF p.14): "English only at 1.0. All user-facing text still goes through a String Catalog." No milestone names it.
   *If it ships missing:* every literal string gets inlined across M2–M9 and adding a second language later means touching every view — exactly the rework the spec wrote this rule to prevent.

6. **Notification permission request timing.**
   `SPEC.md:379–380` (PDF p.10): "Permission is requested the first time the user sets a due time or enables a reminder, **not at first launch**." M6 (L85) says only "All four notification types with refreshed text."
   *If it ships missing:* the default `requestAuthorization` at launch — a permission prompt in the first three seconds of the app, for a product whose principle is "Local and private" (`SPEC.md:23`).

7. **Notification tap routing.**
   `SPEC.md:383` (PDF p.10): "Clicking a notification opens the app to the relevant task or to the morning review." Not in M6's cell or anywhere else.
   *If it ships missing:* tapping the morning notification opens the app to whatever view was last shown; the notification becomes decoration.

8. **Due-time notification actions: Done and Snooze 15 min.**
   `SPEC.md:371` (PDF p.10): "At a task's due time, with Done and Snooze 15 min actions." M6 names the four *types* but not the action categories or their handlers.
   *If it ships missing:* the due-time notification is text-only; "Snooze 15 min" has no implementation and no re-scheduling logic anywhere in the plan.

9. **Focus-mode respect and interruption level.**
   `SPEC.md:384` (PDF p.10): "Respect Focus modes. No custom sounds by default."
   *If it ships missing:* the evening nudge and morning notification fire through Do Not Disturb, in an app whose headline decision is "Silent by default" (`SPEC.md:63`).

10. **Window size and position persistence.**
    `SPEC.md:135–136` (PDF p.4): "Window size and position persist. Minimum size 360 by 480 points." M2 (L81) delivers "window min 360×480; hidden title bar" — the minimum only.
    *If it ships missing:* the app reopens at the default frame every launch, defeating the stated narrow-side-panel use.

11. **In-window navigation chrome, and the `Nav` component.**
    `SPEC.md:137–139` (PDF p.4): "Sidebar or toolbar navigation to four other views… views switch inside it." `design/theme-sage-lily.md` specifies a **Nav** component ("segmented pill in surfaceAlt"). M4 (L83) delivers the three planning *views* but no milestone delivers the switcher, and `PLAN.md` §4's component table (L97–108) has no `Nav` row.
    *If it ships missing:* M4 produces three views with no way to reach them, and `Cmd 1`–`Cmd 5` (`SPEC.md:212`) have no target.

12. **Task detail editor (`Cmd I` → note, due time).**
    `SPEC.md:200` (PDF p.5) and the Note/Due-time fields at `SPEC.md:163, 165`. No milestone names a detail view; §4's component table has no `TaskDetail` / inspector row. M2 (L81) says only "edit".
    *If it ships missing:* notes and due times are unreachable in the UI, which in turn makes the due-time notification (`SPEC.md:371`) untriggerable and the permission-request moment (`SPEC.md:379`) unreachable.

13. **Clickable links in notes.**
    `SPEC.md:163` (PDF p.4): "Multi-line plain text; links are clickable." Named in no milestone and in no `§4` preview state.

14. **Hide-completed toggle in the Today view.**
    `SPEC.md:131` (PDF p.4): "Completed tasks stay visible, dimmed, and sink below open tasks. **A toggle hides them.**" The Settings entry is inside M6's blanket phrase, but the in-view toggle and the filtering behavior are in no milestone.
    *If it ships missing:* a 50-task day is unreadable by evening because done rows never leave the list.

15. **Flagged-tasks-pin-to-top sort behavior.**
    `SPEC.md:126` (PDF p.3): "Flagged tasks can optionally pin to the top (Settings)." M6's blanket "every setting in the spec" creates the toggle; no milestone makes the Today list honor it (M2's cell lists add/complete/edit/reorder/drop/undo).
    *If it ships missing:* a settings toggle that does nothing.

16. **Recurring: editing an instance vs editing the template.**
    `SPEC.md:284–285` (PDF p.7): "Editing an instance changes only that day. Editing the template changes future instances." M4 (L83) delivers "templates with pause and 7-day history row" and `PLAN.md` §2 (L66–67) defines `RecurrenceRule` with `nextOccurrence(after:)` only.
    *If it ships missing:* editing today's "Gym" instance silently rewrites the template and changes every future Monday, with no undo semantics defined.

17. **Haptics.**
    `SPEC.md:454–456` (PDF p.12): "A Feedback service handles completion sounds **and trackpad haptics**." M8 (L87) delivers "completion sound" only. No `Feedback` service appears in `PLAN.md` §1 or §2.

18. **The `materials` token group — solid / system material / Liquid Glass.**
    `SPEC.md:447–449` (PDF p.12): "Background supports solid, system material and Liquid Glass options through the theme. Glass is applied only to floating chrome such as toolbars and the entry field, never to content rows." `theme-sage-lily.json` ships `"materials": { "window": "solid", "toolbar": "ultraThin", "entryBar": "ultraThin", "rows": "solid" }`. No milestone's "Done when" consumes it; M2 (L81) lists the `Theme` protocol but not materials, M8 (L87) says "Sage Lily applied end to end" without naming it.
    *If it ships missing:* the one macOS-26-specific visual affordance in the spec is absent, and the "glass never on content rows" rule has no gate to enforce it.

19. **Bundling and registering the Cormorant Garamond / Jost font files.**
    `design/theme-sage-lily.md` Typography: "bundle the TTF/OTFs in the app and register them in `Info.plist` (`ATSApplicationFontsPath`)"; `theme-sage-lily.json` `fonts` names five files. `PLAN.md` puts this in §7 L150 as a *human* to-do ("put the two font families' TTFs into `App/Fonts/`") with no milestone gate.
    *If it ships missing:* `.custom("Jost", …)` silently falls back to SF Pro, and every screenshot the human reviews from M2 onward is of the wrong typeface — the failure is invisible in code review and in CI.

20. **The `wallpaper` token group.**
    `theme-sage-lily.json` defines `wallpaper` (two radial gradients) and `theme-sage-lily.md` scopes it "behind the window, optional, only when material = solid". No milestone consumes it. It also has **only a `light` value** — no dark counterpart, violating `SPEC.md:450` "Every token has light and dark values."

21. **The `stickers` token group and the About screen.**
    `theme-sage-lily.md`: "one lily cut-out (`design/stickers/lily.png`)… A small pink star is used on the **About screen** only." `PLAN.md` §1 L36 lists `design/stickers/` in the repo tree, but no milestone consumes either asset and **no milestone builds an About screen** (nor does `SPEC.md` mention one — this is an interpretation the plan must resolve one way or the other).

22. **"Loading" and "50 tasks" preview states.**
    `SPEC.md:461` (PDF p.12): "Every state is designed for: empty, **loading**, one task, **50 tasks**, very long titles, all done." `CLAUDE.md` repeats it verbatim. `PLAN.md` §4's state lists (L99–108) contain neither `loading` nor `50 tasks` for any of the ten components.
    *If it ships missing:* the snapshot suite (L110–111) — the plan's only automated defense of the no-literal-styling rule — never renders a loading or high-density state, so both are designed ad hoc at M8.

23. **"Text never truncates without a way to read it in full."**
    `SPEC.md:465` (PDF p.12), repeated in `CLAUDE.md`. No milestone names it; M9 (L88) covers VoiceOver and perf only.

24. **XCUITest smoke tests.**
    `SPEC.md:493–494` (PDF p.13): "Swift Testing for the logic package; **a few XCUITest smoke tests**." `PLAN.md` §1 L48 defines CI as "swift test on DailyCore/DailyUI each push" — package tests only. No milestone creates a UI test target.

25. **Dock icon reflecting day state.**
    `SPEC.md:391–392` (PDF p.10): "The Dock icon can optionally reflect the day state (clear, in progress, all done). This is a stretch goal, decided with the visual design." The spec routes the decision to the design phase; M8 (L87) does not mention it, and neither does M6.
    *If it ships missing:* no harm to the product, but the plan contains no record that it was considered and cut — the next reader re-litigates it.

26. **Placeholder app icon for M0–M7.**
    `SPEC.md:458` (PDF p.12): "A placeholder ships until the design phase." M0 (L79) requires "Dock icon appears" but never says what icon; M8 (L87) delivers the final layered icon.

27. **Review reopen window: "until the first task is completed."**
    `SPEC.md:258–259` (PDF p.7). M3 (L82) says "reopen from View menu" but omits the terminating condition.
    *If it ships missing:* the review stays reopenable all day and can be re-run after leftovers were already resolved, double-incrementing carry counts.

28. **Rollover-time change triggers an immediate rollover.**
    `SPEC.md:645–646` (PDF p.17, acceptance row): "User changes rollover time from 6 AM to 4 AM at 5 AM → Rollover happens immediately, once." The engine logic is M1, but the *Settings→rollover* wiring is in M6's cell nowhere.

29. **Floating icon: per-display position memory and View-menu toggle.**
    `SPEC.md:151` "remembers its position per display" and `SPEC.md:153` "Toggled in Settings **or the View menu**." M6 (L85) says only "floating `NSPanel` icon behind a setting."

30. **Escape dismisses parsed quick-entry tokens.**
    `SPEC.md:184–185` (PDF p.5): "Parsed tokens are highlighted and can be dismissed with Escape." §4's `EntryField` previews "with parsed chips" but no milestone or preview state covers dismissal. *(Borderline — plausibly folded into M2's EntryField, but the Escape key is a specific behavior with a specific conflict: Escape also cancels inline title editing per `SPEC.md:198`.)*

---

## 2. Milestones with unverifiable "Done when"

Six of the ten rows contain at least one cell that a human could not settle by running a command or reading a screen.

### M0 — `PLAN.md:79`
> "**widget App Group works or is ruled out under free signing** (decides whether the prebuilt zip ships the widget)"

"…or is ruled out" makes the clause trivially satisfiable: an agent can declare it ruled out without running the spike, and the milestone passes. There is also no artifact produced.

**Proposed replacement:** `A spike report at docs/spike-appgroup.md records, for each of (a) a local build signed with a free Personal Team and (b) an ad-hoc-signed zip built by scripts/release.sh, whether the widget process can read a value written by the app to the shared UserDefaults suite — with the console output pasted in. README.md and §6's fallback row are updated to match the (b) result.`

### M1 — `PLAN.md:80`
> "`QuickEntryParser` and `RecurrenceRule` at 100% branch coverage"

No command is given, and `swift test` does not report branch coverage by default, so "100%" is asserted rather than measured.

**Proposed replacement:** `swift test --package-path Packages/DailyCore --enable-code-coverage, then xcrun llvm-cov report reports 100% region coverage for QuickEntryParser.swift and RecurrenceRule.swift; the command and its output go in the PR body.`

*(M1's other cell — "Every row of the spec's acceptance table passes from `swift test`" — is objectively checkable but **false as scoped**; see Finding F1.)*

### M5 — `PLAN.md:84`
> "Month heat map with CalendarCell, day detail, search, duplicate-to-today, **StatTile row**, JSON/Markdown export, import, delete-older-than"

"StatTile row" does not say which statistics, and `SPEC.md:337–350` names six with precise definitions. "export… import" has no correctness criterion.

**Proposed replacement:** `…all six stats from SPEC.md:337–350 rendered as StatTiles (current streak, longest streak, completion rate over 7 and 30 days, tasks completed this week / this month / all time, busiest weekday, most carried task), each with a DailyCore unit test for its definition; JSON export → wipe store → JSON import reproduces a byte-identical re-export (round-trip test in DailyCoreTests); Markdown export of a known fixture day matches a checked-in golden file; delete-older-than removes DayRecords and Tasks strictly before the cutoff and nothing else.`

### M6 — `PLAN.md:85`
> "floating `NSPanel` icon behind a setting (**try for a week, then keep or cut**)"

This is the clearest offender: it is a subjective judgment *and* it embeds a seven-day wall-clock wait inside a milestone's completion gate, so M6 can never be closed on the day its code lands.

**Proposed replacement:** `…floating NSPanel icon behind a setting (off by default), verified: non-activating at .floating level, visible on every Space and over full-screen apps, ring + open count that becomes a check when done, click toggles the main window, right-click shows the same five-task menu as the Dock, drags and snaps to screen edges, restores its frame per-display across a relaunch, and never steals key focus. The keep-or-cut decision is not a gate on M6: it is logged as an open item in SPEC.md "Still open" and resolved before M9 tags 1.0.`

### M8 — `PLAN.md:87`
> "Sage Lily applied end to end against `design/mockups`; … **light + dark checked on a real screen**"

Both clauses are opinion. Worse, `design/mockups/` does not exist — `PLAN.md:149–150` makes exporting it an untracked human task in §7, so M8's only stated reference may never be produced.

**Proposed replacement:** `Every token group in design/theme-sage-lily.json (fonts, type, colors, wallpaper, radius, space, sizes, shadow, materials, motion, sound, stickers) is read by at least one view, proven by a DailyUI test that fails if a token is never accessed; all eight named motion hooks exist as Theme members and are invoked at their call sites; SageLilyTheme and TestTheme snapshots differ for every component in §4 in both light and dark; Reduce Motion and Increase Contrast each produce a distinct snapshot set. The human sign-off is a separate, explicitly non-blocking step: build, screenshot Today / Review / History / Widget in light and dark, paste into the PR, against design/mockups/*.png which M8 may not begin without.`

### M9 — `PLAN.md:88`
> "**VoiceOver pass, 500-task perf pass**, README with screenshots and Gatekeeper steps, tagged `v1.0.0`, release zip built by CI"

"Pass" is undefined for both. The spec gives hard numbers (`SPEC.md:464` 60 fps with 500 tasks; `SPEC.md:669–670` launch under 1 second) that the cell does not use.

**Proposed replacement:** `Accessibility Inspector's audit reports zero issues on Today, Review, History and Settings; every interactive element has a VoiceOver label and every row exposes toggle-done, flag, and drop as custom actions; Instruments' Animation Hitches template shows no hitch over 16 ms while scrolling a seeded 500-task day, and cold launch with that store is under 1 second measured three times; a 200-character title, an emoji title and an RTL title each render in full with a way to read the remainder (SPEC.md:465, 672); README.md contains screenshots of all four surfaces and the Open Anyway walkthrough; CI builds the release zip from tag v1.0.0 and the zip launches on a Mac that has never built the project.`

**Objective as written:** M2, M3, M4, M7.

---

## 3. Full traceability matrix

`M?` = covered-implicitly (a milestone's deliverable plausibly contains it, but the "Done when" cell does not name it). **UNASSIGNED** items are numbered to match §1.

| Requirement | Source | Milestone | Notes |
|---|---|---|---|
| **Day model** | | | |
| Day runs 06:00–05:59; 1:30 AM Tue counts to Mon | SPEC 76–78 / p.2 | M1 | §2 L53–55 `DayClock.logicalDate` |
| `DayClock.logicalDate(for:)` is the only date function | SPEC 80–82 / p.2 | M1 | §2 L53–56; enforced by CLAUDE.md |
| Rollover is a state check, not a timer; `lastOpenedLogicalDate` | SPEC 83–85 / p.2 | M1 + M3 | §2 L56–60 |
| Check runs on launch / wake / focus / clock change / TZ change / 6 AM timer | SPEC 90–91 / p.3 | M3 | L82 names all five |
| Missed 6 AM while asleep or closed → review at next launch/wake | SPEC 92–93 / p.3 | M1 + M3 | acceptance rows |
| Several days missed → one review, leftovers grouped by original day | SPEC 94–96 / p.3 | M1 | §2 L59 |
| Recurring generates for today only, not per skipped day | SPEC 95–96 / p.3 | M1 | §2 L58 |
| Days stored as y-m-d with no time zone | SPEC 97–98 / p.3 | M1 | §2 L54–55 |
| Backward clock → do nothing | SPEC 99–100 / p.3 | M1 | §2 L60 |
| Rollover time adjustable 12:00 AM–12:00 PM in 30-min steps, default 6 AM | SPEC 101–102 / p.3 | M6? | M6 blanket "every setting"; the 30-min-step constraint is unnamed |
| Rollover is one DB transaction | SPEC 115–116 / p.3 | M1 | §2 L60 |
| **Today window** | | | |
| Header: logical date, progress indicator, current streak | SPEC 124–125 / p.3 | M2 | `DayHeader`, §4 L103 |
| Manual order; drag to reorder | SPEC 126 / p.3 | M2 | L81 "reorder" |
| Flagged tasks optionally pin to top | SPEC 126 / p.3 | **UNASSIGNED #15** | setting exists (M6); sort behavior homeless |
| Completed stay visible, dimmed, sink below open | SPEC 131 / p.4 | M2? | `TaskRow` "done" state, §4 L100 |
| Toggle hides completed | SPEC 131 / p.4 | **UNASSIGNED #14** | |
| Carry marker "2d" | SPEC 132 / p.4 | M2 | §4 L100 "carried (2d)" |
| Empty state morning / all done | SPEC 133–134 / p.4 | M2 | `EmptyState`, §4 L107 |
| Window minimum 360×480 | SPEC 135–136 / p.4 | M2 | L81 |
| Window size and position persist | SPEC 135 / p.4 | **UNASSIGNED #10** | |
| Sidebar/toolbar nav to four other views; one main window | SPEC 137–139 / p.4 | **UNASSIGNED #11** | views exist (M4/M5); switcher and `Nav` component do not |
| Settings is the only other window | SPEC 138–139 / p.4 | M6 | L85 |
| **Floating icon** | | | |
| ~44 pt, every Space, over full-screen | SPEC 145–146 / p.4 | M6? | L85 names it generically |
| Ring with open count → check when done | SPEC 147–148 / p.4 | M6 | §4 L108 `FloatingIcon` states |
| Click shows/hides window; right-click = Dock's five tasks | SPEC 149–150 / p.4 | M6? | |
| Drag, snap to edges, remembers position **per display** | SPEC 151 / p.4 | **UNASSIGNED #29** | |
| Fades when idle; never takes key focus | SPEC 152 / p.4 | M6? | §4 "idle-faded" |
| Off by default; toggled in Settings **or the View menu** | SPEC 153 / p.4 | **UNASSIGNED #29** | View-menu item unnamed |
| Non-activating `NSPanel` at floating level | SPEC 154–155 / p.4 | M6 | L85 names `NSPanel` |
| Keep-or-cut after a week | SPEC 143, 799 / p.4, p.20 | M6 | see §2 — unverifiable gate |
| **Task fields** | | | |
| Title required, ≤200 chars | SPEC 161 / p.4 | M1 + M2 | §4 "200-char title" |
| Note: multi-line plain text | SPEC 163 / p.4 | M1 + M2? | §4 "with note collapsed/expanded" |
| Note: **links are clickable** | SPEC 163 / p.4 | **UNASSIGNED #13** | |
| Due time (fires a notification) | SPEC 165 / p.4 | M1 + M6 | §4 `TaskRow` "with due time" |
| Flag | SPEC 167 / p.4 | M1 + M2 | |
| Day (date or none = Someday) | SPEC 174 / p.5 | M1 | §2 L54 |
| Status open/done/dropped/missed | SPEC 176, 548 / p.5, p.14 | M1 | |
| Carry count | SPEC 178 / p.5 | M1 | |
| **Quick entry** | | | |
| Entry field at bottom; Return adds and keeps typing | SPEC 181–182 / p.5 | M2 | `EntryField` |
| NL parse: "3pm" → due time | SPEC 183 / p.5 | M1 + M2 | §2 L64 |
| NL parse: trailing "!" → flag | SPEC 184 / p.5 | M1 | §2 L64 |
| NL parse: "tomorrow" / "fri" → schedule | SPEC 184 / p.5 | M1 + M4 | L83 "quick-entry scheduling tokens" |
| Parsed tokens highlighted | SPEC 184–185 / p.5 | M2 | §4 "with parsed chips" |
| Escape dismisses parsed tokens | SPEC 185 / p.5 | **UNASSIGNED #30** | conflicts with Escape = cancel inline edit |
| Multi-line paste → one task per line | SPEC 186 / p.5 | M1 + M2 | §2 L65; §4 "multi-line paste" |
| **Keyboard shortcuts** (SPEC 190–213 / p.5) | | | |
| `Cmd N` focus entry field | SPEC 192 | M2 | L81 "keyboard table from the spec" |
| `Up` / `Down` move selection | SPEC 194 | M2 | |
| `Space` or `Cmd Return` toggle done | SPEC 196 | M2 | |
| `Return` edit title inline | SPEC 198 | M2 | |
| `Cmd I` open detail (note, due time) | SPEC 200 | **UNASSIGNED #12** | shortcut in M2; the detail view it opens has no owner |
| `Cmd Shift F` toggle flag | SPEC 202 | M2 | |
| `Cmd Option Up/Down` reorder | SPEC 204 | M2 | |
| `Cmd T` move to tomorrow | SPEC 206 | M2 → **conflict** | needs Upcoming/scheduling (M4) — see F4 |
| `Cmd Shift S` move to Someday | SPEC 208 | M2 → **conflict** | needs Someday (M4) — see F4 |
| `Delete` drop task (with `Cmd Z`) | SPEC 210 | M2 | |
| `Cmd 1`–`Cmd 5` switch view | SPEC 212–213 | M2 → **conflict** | views 2–4 are M4, view 5 is M5 — see F4 |
| Full undo **and redo** via the Edit menu | SPEC 218 / p.6 | M2? | L81 "undo"; §2 L71 `UndoManager`; redo unnamed |
| **Morning review** | | | |
| Appears on first open after a rollover with leftovers | SPEC 221–222 / p.6 | M3 | |
| Yesterday recap line; streak updates here | SPEC 226 / p.6 | M3? | not named in L82 |
| Leftovers as cards with four choices | SPEC 227 / p.6 | M3 | `ReviewCard`, K/L/S/D |
| Pull from Someday (collapsed, "Add to today") | SPEC 228–229 / p.6 | M3 | L82 "Someday pull" |
| "Start the day" button → Today with entry focused | SPEC 230–231 / p.6 | M3? | not named in L82 |
| Keep (K / →) — carry count +1 | SPEC 237 / p.6 | M3 | |
| Later (L) — pick tomorrow / weekday / date | SPEC 239 / p.6 | M3? | the date-picker UI is unnamed |
| Someday (S) | SPEC 241 / p.6 | M3 | |
| Drop (D / ←) — kept in history | SPEC 243 / p.6 | M3 | |
| "Keep all" / "Drop all" | SPEC 246 / p.6 | M3 | L82 |
| Skip/close keeps every leftover for today | SPEC 247–248 / p.6 | M3 | L82 "Skip" |
| Carry ≥3 nag, threshold is a setting | SPEC 249–250 / p.6 | M3 + M6 | L82 "carry-count nag at threshold" |
| No leftovers → no review | SPEC 251 / p.6 | M1 + M3 | §2 L59 `.fresh` |
| Unfinished recurring instances closed as `missed`, not shown | SPEC 252–253 / p.6 | M1 | §2 L57–58 |
| Reopenable from View menu **until the first completion** | SPEC 258–259 / p.7 | **UNASSIGNED #27** | reopen is M3; the cutoff is not |
| Setting turns the review off → leftovers auto-roll | SPEC 260 / p.7 | M6? | toggle in M6; the auto-roll branch is unnamed |
| Review should take under 30 seconds | SPEC 223 / p.6 | — | aspiration, not gateable; noted for completeness |
| **Upcoming** | | | |
| Grouped Tomorrow → next 7 weekdays → by date | SPEC 267 / p.7 | M4 | L83 "Grouped Upcoming" |
| Scheduled task hidden from Today until its rollover | SPEC 269–270 / p.7 | M1 + M4 | §2 L58 |
| Add directly to a future day; drag between days | SPEC 271 / p.7 | M4 | L83 |
| Due time, note, flag settable ahead | SPEC 272 / p.7 | M4? | depends on the missing detail editor (#12) |
| **Someday** | | | |
| Single undated list, manual ordering | SPEC 275 / p.7 | M4 | |
| Actions: add to today, schedule, drop | SPEC 276 / p.7 | M4? | |
| Shown in the morning review as a pull list | SPEC 277 / p.7 | M3 | |
| >60 days → "stale" marker, no auto-delete | SPEC 278–279 / p.7 | M4 | L83 "stale marker" |
| **Recurring** | | | |
| Template generates a normal instance at rollover | SPEC 282–283 / p.7 | M1 | §2 L66–67 |
| Edit instance = that day only; edit template = future | SPEC 284–285 / p.7 | **UNASSIGNED #16** | |
| Templates can be paused | SPEC 286 / p.7 | M4 | L83 "pause" |
| Rules: daily / weekdays / chosen weekdays / every N days / monthly | SPEC 290–303 / p.7–8 | M1 | §2 L66 — but see F5 (won't compile) |
| Monthly 29–31 clamps to last day | SPEC 305 / p.8 | M1 | §2 L67 "clamp-to-last-day" |
| "Every N days" counts from last **generated** instance | SPEC 306 / p.8 | M1 | §2 L66 signature is wrong — see F5 |
| Per-template history row (done/missed) | SPEC 307 / p.8 | M4 | L83 "7-day history row" |
| **Streaks** | | | |
| A day counts when ≥1 task completed | SPEC 310, 58 / p.8, p.2 | M1 | §2 L61–63 |
| Current = consecutive days ending yesterday, +today on completion | SPEC 314–315 / p.8 | M1 | §2 L62–63 |
| Today never breaks the streak mid-day | SPEC 316–317 / p.8 | M1 | |
| Zero-task day is neutral | SPEC 318–319 / p.8 | M1 | §2 L62 `totalCount == 0` |
| Longest streak stored and shown | SPEC 320 / p.8 | M1 + M2 | §2 L63; `DayHeader` |
| Un-checking the only completion removes today | SPEC 321 / p.8 | M1 | acceptance row SPEC 659 |
| Streaks hideable in Settings | SPEC 322 / p.8 | M2 + M6 | §4 "streak hidden" state |
| **History** | | | |
| Month calendar as a heat map | SPEC 325–326 / p.8 | M5 | `CalendarCell` |
| Day detail: done, dropped, carried, missed recurring | SPEC 327–328 / p.8 | M5 | L84 "day detail" |
| Search all past tasks by title and note | SPEC 329 / p.8 | M5 | L84 |
| Duplicate a history task into today | SPEC 330 / p.8 | M5 | L84 |
| `DayRecord` is a frozen summary written at rollover | SPEC 546–547 / p.14 | M1 | §2 L57, L61 |
| **Stats** (all six) | SPEC 337–350 / p.9 | M5? | L84 says only "StatTile row" — see §2 and F21 |
| History kept forever by default | SPEC 353 / p.9 | M5 | |
| Export to JSON and Markdown | SPEC 353 / p.9 | M5 | L84 |
| Import | SPEC 555 / p.14 | M5 | L84 |
| "Delete history older than" | SPEC 354 / p.9 | M5 | L84 |
| **Notifications** | | | |
| Local only, `UserNotifications`; delivered when app is closed | SPEC 360–361 / p.9 | M6 | §6 L141 |
| Morning: "Your day is ready. 3 tasks carried over." (default on) | SPEC 368 / p.10 | M6 | L85 |
| Due time (default on) | SPEC 371 / p.10 | M6 | L85 |
| Due-time **Done and Snooze 15 min actions** | SPEC 371 / p.10 | **UNASSIGNED #8** | |
| Evening nudge at 9 PM, adjustable, only if nothing done | SPEC 374 / p.10 | M6 | L85 |
| Streak milestone at 7, 30, 100, 365 | SPEC 377 / p.10 | M6 | L85 |
| Permission requested at first due time, not at launch | SPEC 379–380 / p.10 | **UNASSIGNED #6** | |
| Morning is a repeating daily trigger with refreshed text | SPEC 381–382 / p.10 | M6 | L85 "with refreshed text" |
| Clicking a notification routes to the task or the review | SPEC 383 / p.10 | **UNASSIGNED #7** | |
| Respect Focus modes; no custom sounds | SPEC 384 / p.10 | **UNASSIGNED #9** | |
| **Dock** | | | |
| Badge: open count / flagged only / off | SPEC 387–388 / p.10 | M6 | L85 "badge modes" |
| Dock menu: New Task, five open tasks, Show Today | SPEC 389–390 / p.10 | M6 | L85 "Dock menu with five tasks" |
| Dock icon reflects day state (stretch) | SPEC 391–392 / p.10 | **UNASSIGNED #25** | |
| **Widget** | | | |
| Small: ring, done/total, streak | SPEC 401–402 / p.11 | M7 | |
| Medium: top 4 tasks + progress | SPEC 404 / p.11 | M7 | |
| Large: up to 10 tasks + progress + streak | SPEC 406–407 / p.11 | M7 | |
| WidgetKit + App Intent checkboxes | SPEC 409–410 / p.11 | M7 | L86 |
| Timeline entry at the next rollover | SPEC 411–412 / p.11 | M7 | L86 |
| App reloads timelines after every data change | SPEC 413 / p.11 | M1/M2 | §2 L70 `WidgetCenter.reloadTimelines` |
| Shared App Group store | SPEC 414 / p.11 | M0 + M7 | L79 spike |
| Renders in tinted and clear; no color-only meaning | SPEC 415–416 / p.11 | M7 | L86 |
| Widget is a separate milestone; core never depends on it | SPEC 417–418 / p.11 | M7 | |
| **Design readiness** | | | |
| One `Theme` type: colors, type, spacing, radii, shadows, materials, curves | SPEC 426–428 / p.11 | M2 (partial) | materials unconsumed — #18 |
| Two themes from day one | SPEC 429–431 / p.11 | M2 | L81 `SageLilyTheme` + `TestTheme` |
| No literal colors/sizes/paddings in views | SPEC 428 / p.11 | M2 | §4 L110–111 snapshot gate |
| Ten-component library, each with a preview of every state | SPEC 436–438 / p.12 | M2–M6 | §4 — but see F12 and #22 |
| Custom checkbox with its own animation hook | SPEC 439–441 / p.12 | M2 | §4 `Checkbox` states |
| Eight named motion hooks | SPEC 442–444 / p.12 | M8 | see F14 — absent M2–M7 |
| Hidden title bar, full-size content, traffic lights in place | SPEC 445–446 / p.12 | M2 | L81 |
| Materials: solid / system material / Liquid Glass; glass never on rows | SPEC 447–449 / p.12 | **UNASSIGNED #18** | |
| Every token has light and dark values | SPEC 450 / p.12 | M2 + M8 | `wallpaper` violates this — #20 |
| System accent overridden by the theme | SPEC 451, 808 / p.12 | M8? | theme decision recorded; no gate |
| Semantic type styles; custom font swappable; Dynamic Type | SPEC 452–453 / p.12 | M2 | §6 L140 "check Larger Text in M2" |
| Font files bundled and registered | theme md Typography | **UNASSIGNED #19** | §7 L150 is a human to-do, not a gate |
| `Feedback` service: completion sound **and haptics** | SPEC 454–456 / p.12 | M8 (sound only) | haptics = **UNASSIGNED #17** |
| Icon Composer layered icon (default/dark/clear/tinted) | SPEC 457–458 / p.12 | M8 | L87 "layered app icon" |
| Placeholder icon until the design phase | SPEC 458 / p.12 | **UNASSIGNED #26** | |
| **Quality bar** | | | |
| States: empty, **loading**, one, **50**, long titles, all done | SPEC 461 / p.12 | M2–M6 (partial) | loading + 50 = **UNASSIGNED #22** |
| VoiceOver labels **and actions** | SPEC 462–463 / p.12 | M9 | L88 — undefined, see §2 |
| Complete keyboard access | SPEC 462–463 / p.12 | M2 | see F4 |
| Reduce Motion honored | SPEC 463 / p.12 | M8 | L87 |
| Increase Contrast honored | SPEC 463 / p.12 | M8 | L87 |
| No information by color alone | SPEC 463 / p.12 | M7 + M8 | L86 (widget) |
| 60 fps with 500 tasks | SPEC 464 / p.12 | M9 | §6 L142; threshold undefined |
| Text never truncates without a way to read it in full | SPEC 465 / p.12 | **UNASSIGNED #23** | |
| Design phase produces mockups of Today, Review, History, Widget | SPEC 468–470 / p.12 | M8 | §7 L149 — untracked precondition |
| **Architecture** | | | |
| Swift 6, SwiftUI, AppKit where needed | SPEC 482–483 / p.13 | M0 | |
| SwiftData (SQLite) in the App Group container | SPEC 485 / p.13 | M0 + M1 | §2 L68 |
| Dependencies: none, Apple only | SPEC 491 / p.13 | M0 | CLAUDE.md |
| Swift Testing for the logic package | SPEC 493 / p.13 | M1 | |
| **A few XCUITest smoke tests** | SPEC 493–494 / p.13 | **UNASSIGNED #24** | |
| Xcode 26; builds from the command line | SPEC 496–497 / p.13 | M0 | §1 L48 |
| `DailyCore` / `DailyUI` / App / Widget layout | SPEC 500–507 / p.13 | M0 | §1 L23–49 |
| Injected clock | SPEC 510–511 / p.13 | M1 | §0 L16–17 |
| Rollover idempotent | SPEC 512 / p.13 | M1 | §2 L60 |
| One store actor | SPEC 513 / p.13 | M1 | §2 L68–70 |
| `NSWorkspace.didWakeNotification`, `NSSystemClockDidChange`, `NSSystemTimeZoneDidChange` | SPEC 518–519 / p.14 | M3 | L82 |
| Schema versions from the first release | SPEC 520–521 / p.14 | **UNASSIGNED #2** | |
| Launch at login via `SMAppService` | SPEC 522 / p.14 | M6 | L85 |
| String Catalog for all user-facing text | SPEC 524–525 / p.14 | **UNASSIGNED #5** | |
| Floating icon = `NSPanel` hosting SwiftUI | SPEC 526–527 / p.14 | M6 | L85 |
| **Data model** `Task` / `RecurringTemplate` / `DayRecord` / `AppState` | SPEC 533–544 / p.14 | M1 | §2 |
| **Settings** — 18 controls | SPEC 551–555 / p.14 | M6 (UI) | storage = **UNASSIGNED #1** |
| **Distribution** | | | |
| Build-from-source path | SPEC 567–568 / p.15 | M0 + M9 | xcconfig, README |
| Prebuilt zip + Gatekeeper walkthrough | SPEC 570–572 / p.15 | M9 | L88 |
| Ad-hoc signed, not notarized | SPEC 575–576 / p.15 | M0 | |
| GitHub Releases update check, off by default | SPEC 577–579 / p.15 | **UNASSIGNED #4** | |
| Widget App Group signing spike | SPEC 580–583 / p.15 | M0 | L79; §6 L137 |
| Fallback: zip without widget, README says so | SPEC 584–585 / p.15 | M0 + M9 | §6 L137 |
| **Repository** | | | |
| README with screenshots and both install paths | SPEC 590–591 / p.15 | M9 | L88 |
| `SPEC.md`, `CLAUDE.md`, `LICENSE`, `CHANGELOG.md`, semver tags | SPEC 592–602 / p.15–16 | M0 | §1, §7 L146 |
| CI: build + `DailyCore` tests each push; release zip on tags | SPEC 603–604 / p.16 | M0 + M9 | §1 L48 — see F26 |
| `.xcconfig` with blank team ID | SPEC 605–606 / p.16 | M0 | §1 L31 |
| Bundle ID and App Group ID from one config value | SPEC 607–608 / p.16 | M0 | §1 L31; §7 L148 |
| **Acceptance tests** (SPEC 616–673 / p.16–17) | | | |
| 1:30 AM Tue counts to Mon | SPEC 616 | M1 | |
| App open across 6 AM, live rollover | SPEC 618 | **UNASSIGNED #3** | claimed by M1, only M3 can run it |
| Asleep 11 PM–8 AM → one review on wake | SPEC 621 | M1 + M3 | logic M1, wake path M3 |
| Closed 5 days → one review, grouped, recurring today only | SPEC 623–625 | M1 | |
| Rollover twice in a day → no-op | SPEC 627 | M1 | |
| Crash mid-rollover → fully old or fully new | SPEC 629–630 | **UNASSIGNED #3** | needs a kill harness; no owner |
| NY→LA flight | SPEC 632–633 | M1 | |
| DST night → exactly one rollover | SPEC 635–636 | M1 | |
| Clock set back a day → nothing | SPEC 638 | M1 | |
| Rollover time 6→4 AM at 5 AM → immediate, once | SPEC 645–646 | M1 + **#28** | engine M1; Settings wiring homeless |
| Review skipped → leftovers with carry +1 | SPEC 648–649 | M1 | |
| Daily recurring left undone → missed + fresh today | SPEC 651–652 | M1 | |
| Monthly 31st in a 30-day month → the 30th | SPEC 654 | M1 | |
| Task scheduled for a skipped day → leftover today | SPEC 656–657 | M1 | |
| Only completion un-checked → today leaves the streak | SPEC 659 | M1 | |
| Zero-task day → neutral | SPEC 661 | M1 | |
| Widget check → app updates within 1 s | SPEC 663–664 | **UNASSIGNED #3** | M7 at best |
| Widget flips at 6 AM with the app closed | SPEC 666–667 | **UNASSIGNED #3** | M7 |
| 500 tasks → smooth scroll, launch <1 s | SPEC 669–670 | **UNASSIGNED #3** | M9 |
| 200-char / emoji / RTL → no clipping | SPEC 672–673 | **UNASSIGNED #3** | M2/M9 |
| **Theme token groups** (`design/theme-sage-lily.json`) | | | |
| `fonts` (5 files) | json 4–10 | M2 + M8 | registration = **#19** |
| `type` (8 styles) | json 11–20 | M2 | |
| `colors` (12 tokens) | json 21–34 | M2 + M8 | |
| `wallpaper` | json 35–37 | **UNASSIGNED #20** | also missing a dark value |
| `radius` (5) | json 38 | M2 | |
| `space` (6) | json 39 | M2 | |
| `sizes` (8) | json 40 | M2 + M7 | |
| `shadow.window` | json 41 | M2? | not named in any cell |
| `materials` (4) | json 42 | **UNASSIGNED #18** | |
| `motion` (8 hooks) | json 43–52 | M8 | see F14 |
| `sound` | json 53 | M8 | L87 "completion sound" |
| `stickers` (2 assets) | json 54 | **UNASSIGNED #21** | no About screen anywhere |
| `naming.displayName` | json 55 | M8? | SPEC 806 decision; no gate |
| Sage Lily `Nav` component | theme md Components | **UNASSIGNED #11** | absent from §4's table |

---

## 4. Findings

### F1 — M1 claims acceptance rows it structurally cannot run · **blocker**

> `PLAN.md:80` — "| 1 | `m1-core` | `DailyCore` complete with tests | **Every row of the spec's acceptance table passes from `swift test`**; `QuickEntryParser` and `RecurrenceRule` at 100% branch coverage |"

**Consequence.** Six of the twenty rows (`SPEC.md:618, 629, 663, 666, 669, 672`) require the running app, the widget process, or a rendered view. `DailyCore` has no UI imports by rule, so `swift test` can never exercise them. M1 either blocks indefinitely or — far likelier — Claude Code marks them not-applicable and six stated product guarantees are silently dropped, including "app updates within 1 second when the widget checks a task" and "200-character / emoji / RTL titles display fully."

**Proposed replacement text for the M1 "Done when" cell:**
> `The fourteen logic rows of SPEC.md's acceptance table (lines 616, 621, 623, 627, 632, 635, 638, 645, 648, 651, 654, 656, 659, 661) each have a named test in DailyCoreTests and pass under swift test --package-path Packages/DailyCore. The six remaining rows are re-homed: 618 and 629 → M3, 663 and 666 → M7, 669 and 672 → M9; each milestone's row names its adopted acceptance lines. swift test --enable-code-coverage plus xcrun llvm-cov report shows 100% region coverage for QuickEntryParser.swift and RecurrenceRule.swift.`

Add the matching clauses to the M3, M7 and M9 cells.

---

### F2 — M6's gate is a subjective judgment plus a seven-day wait · **blocker**

> `PLAN.md:85` — "…launch at login; floating `NSPanel` icon behind a setting (**try for a week, then keep or cut**)"

**Consequence.** A "Done when" cell that depends on a week of lived experience cannot close a milestone, and it is an opinion, not a check. In practice M6's PR either merges with the cell unsatisfied (and the gate becomes decorative for every later milestone too) or the branch sits open for a week while M7 is blocked behind it. The eight concrete floating-icon behaviors at `SPEC.md:145–155` — per-display position, non-activating, over full-screen apps, never steals key focus — get no gate at all because the cell spends its words on the decision instead.

**Proposed replacement text:** see §2, M6. In short: replace the parenthetical with the eight verifiable behaviors from `SPEC.md:145–155`, and move the keep-or-cut decision to `SPEC.md`'s "Still open" list (`SPEC.md:794–799`) with M9 as its deadline.

---

### F3 — Nothing stores the eighteen settings · **blocker**

> `PLAN.md:85` — "…**Settings window (every setting in the spec)**; launch at login…"
> `PLAN.md:68–70` — "**Store.** `actor Store` owns the `ModelContainer` in the App Group container and exposes intent-shaped methods (`add`, `complete`, `move`, `drop`, `reorder`, `runRollover`, `snapshotForWidget`)."

**Consequence.** `SPEC.md:543–544` gives `AppState` four fields and `SPEC.md:551–555` lists eighteen settings. §2's Store exposes no settings accessor. M6 will reach for `@AppStorage` in the App target, which writes to the app's own `UserDefaults` — invisible to the widget, which reads the App Group container (`SPEC.md:414`). The widget's rollover-aware timeline (`SPEC.md:411`) then uses a hard-coded 6 AM while the user has set 4 AM, and the widget's streak display ignores "show streaks off."

**Proposed replacement text — add to `PLAN.md` §2 after the `Store` bullet:**
> `- **Settings.** A single \`Settings\` \`Codable\` struct in \`DailyCore\` holds all eighteen controls from SPEC.md:551–555 with their spec defaults (rollover 06:00, review on, carry threshold 3, pin flagged off, hide completed off, badge = open count, all four notifications on, nudge 21:00, sound off, floating icon off, show streaks on, launch at login off, theme = Sage Lily). It is persisted through the \`Store\` actor into the App Group's shared \`UserDefaults\` suite so the widget reads the same values, and exposed to views as \`@Environment(\.settings)\`. Changing \`rolloverMinutes\` re-runs \`RolloverEngine\` immediately (SPEC.md:645) and reloads widget timelines.`

And extend M6's cell: `…Settings window covering all eighteen controls in SPEC.md:551–555, each one asserted present by a test that enumerates the Settings struct's keys; changing rollover time at 5 AM from 6 to 4 triggers exactly one immediate rollover (SPEC.md:645).`

---

### F4 — M2 promises the whole keyboard table, three rows of which target features built in M4/M5 · **blocker**

> `PLAN.md:81` — "…add/complete/edit/reorder/drop/undo; **keyboard table from the spec**; data persists; window min 360×480; hidden title bar |"

**Consequence.** `Cmd T` "Move to tomorrow" (`SPEC.md:206`) needs the scheduled-day concept that M4 delivers; `Cmd Shift S` "Move to Someday" (`SPEC.md:208`) needs the Someday backlog from M4; `Cmd 1`–`Cmd 5` (`SPEC.md:212`) needs views that do not exist until M4 and M5, and a navigation host that no milestone builds at all (#11). M2 therefore cannot satisfy its own gate; the likely outcome is three shortcuts wired to no-ops that nobody revisits, because M4's cell never mentions keyboard.

**Proposed replacement text for that clause in M2, plus an addition to M4:**
> M2: `…the eight Today-scoped shortcuts from SPEC.md:190–213 (Cmd N, Up/Down, Space and Cmd Return, Return, Cmd I, Cmd Shift F, Cmd Option Up/Down, Delete with Cmd Z), each covered by a test that sends the key equivalent and asserts the store mutation; Cmd T, Cmd Shift S and Cmd 1–5 are declared in the menu now but disabled with a clear reason until M4.`
> M4 (append): `…and Cmd T, Cmd Shift S and Cmd 1–5 become live, with Cmd 1–5 switching the Nav component's selection across all five views.`

---

### F5 — The `RecurrenceRule` enum in §2 does not compile, and its `everyNDays` signature contradicts the spec · **blocker**

> `PLAN.md:66–67` — "**Recurrence.** `RecurrenceRule` enum: `.daily`, `.weekdays`, `.weekdays(Set<Weekday>)`, `.everyNDays(n, from: Day)`, `.monthly(dayOfMonth)` with clamp-to-last-day. `nextOccurrence(after:)` only."

**Consequence.** Two cases named `weekdays` is a redeclaration error — Claude Code will hit it on the first build of M1 and resolve it by guessing. Separately, `.everyNDays(n, from: Day)` pins the anchor into the rule, but `SPEC.md:306` requires counting "from the last generated instance, not the last completion", which lives on the template as `lastGeneratedDay` (`SPEC.md:538`). Baking `from:` into the rule means a paused-then-resumed template (`SPEC.md:286`) recomputes from the original anchor and fires a burst of catch-up instances — though `SPEC.md:95` says recurring tasks generate for today only.

**Proposed replacement text:**
> `- **Recurrence.** \`RecurrenceRule\` enum: \`.daily\`, \`.weekdays\` (Mon–Fri), \`.onWeekdays(Set<Weekday>)\`, \`.everyNDays(Int)\`, \`.monthly(dayOfMonth: Int)\` with clamp-to-last-day. \`RecurrenceEngine.shouldGenerate(rule:on:lastGeneratedDay:) -> Bool\` is the only entry point: the N-day anchor comes from the template's \`lastGeneratedDay\` (SPEC.md:306, 538), never from the rule, so pausing and resuming a template never produces catch-up instances (SPEC.md:95, 286).`

---

### F6 — No milestone declares the SwiftData schema version, and it cannot be added later · **blocker**

> `PLAN.md:79` — "| 0 | `m0-scaffold` | Xcode project, two packages, CI, xcconfig, App Group spike | `swift test` runs empty; Dock icon appears; …"
> `PLAN.md:80` — "| 1 | `m1-core` | `DailyCore` complete with tests | …"

**Consequence.** `SPEC.md:520–521` requires schema versions "from the first release" precisely because SwiftData cannot retroactively identify an unversioned store. Neither M0 nor M1 mentions `VersionedSchema` or `SchemaMigrationPlan`, and `AppState.schemaVersion` (`SPEC.md:544`) appears in the data model with nothing that reads or writes it. Ship 1.0 this way and the first post-1.0 model change either wipes every user's history or needs a hand-rolled SQLite migration.

**Proposed replacement text — append to M1's "Done when":**
> `…; DailyCore declares \`enum SchemaV1: VersionedSchema\` containing all four entities plus a \`ToDewMigrationPlan: SchemaMigrationPlan\` with V1 as its only stage, and \`AppState.schemaVersion\` is written to 1 on first launch. A test opens a store created by a checked-in V1 fixture and asserts it migrates cleanly.`

---

### F7 — No milestone introduces a String Catalog · **should-fix**

> `PLAN.md:81` — "| 2 | `m2-today` | Theme layer + Today list | `Theme` protocol, `SageLilyTheme`, `TestTheme`; components: TaskRow, …"

**Consequence.** `SPEC.md:524–525` requires every user-facing string to go through a String Catalog even though 1.0 is English-only. Nothing in `PLAN.md` says so, so M2–M9 will inline literals in roughly a hundred places, and the cheap future the spec was buying — "other languages can be added later without code changes" — is gone at a cost no one budgets for again.

**Proposed replacement text — append to M2's "Done when":**
> `…; a \`Localizable.xcstrings\` String Catalog exists in DailyUI and every user-facing literal goes through \`LocalizedStringKey\` — enforced by a CI grep that fails on \`Text("\` with a bare string literal in Sources/DailyUI.`

---

### F8 — The GitHub Releases update check is in no milestone · **should-fix**

> `PLAN.md:88` — "| 9 | `m9-release` | 1.0 | VoiceOver pass, 500-task perf pass, README with screenshots and Gatekeeper steps, tagged `v1.0.0`, release zip built by CI |"

**Consequence.** `SPEC.md:577–579` specifies the app's one permitted network call — an opt-in check of the Releases feed — and `CLAUDE.md` restates it as the single exception to "no network calls". It appears nowhere in §3, so it will not be built. Zip users, who have no signed update channel by design, are left with no in-app signal that a new version exists, and the Settings list (`SPEC.md:551–555`) gains no corresponding toggle.

**Proposed replacement text — append to M9's "Done when":**
> `…; an off-by-default "Check for updates" setting that, when enabled, fetches the GitHub Releases atom feed at most once per launch and shows a "new version available" link — the app's only network call (SPEC.md:577–579); a test asserts zero URLSession traffic when the setting is off.`

---

### F9 — M6 names the four notification types but none of their four behaviors · **should-fix**

> `PLAN.md:85` — "| 6 | `m6-system` | Notifications, Dock, Settings, floating icon | **All four notification types with refreshed text**; badge modes; Dock menu with five tasks; …"

**Consequence.** Four distinct requirements sit under "All four notification types" and none survives it: permission timing (`SPEC.md:379–380`), tap routing (`SPEC.md:383`), the Done / Snooze-15 actions on the due-time notification (`SPEC.md:371`), and Focus-mode respect (`SPEC.md:384`). The predictable build asks for authorization at launch — in an app whose first principle is privacy — delivers a due-time notification with no actions, and routes every tap to whatever view was last open.

**Proposed replacement text for that clause:**
> `All four notification types from SPEC.md:366–377 with the morning body refreshed on every task change; authorization requested at the moment the user first sets a due time or enables a reminder, never at launch (SPEC.md:379) — asserted by a test that launches with no settings touched and expects no authorization call; the due-time notification registers a category with Done and Snooze 15 min actions whose handlers complete the task or re-schedule +15 min (SPEC.md:371); tapping any notification routes to the named task or to the morning review (SPEC.md:383); all four use \`.timeSensitive\` only for due-time and default interruption level otherwise so Focus modes are honored, with no custom sound (SPEC.md:384).`

---

### F10 — M8's gate is opinion, and depends on an artifact no milestone produces · **should-fix**

> `PLAN.md:87` — "| 8 | `m8-design` | Final visual pass | **Sage Lily applied end to end against `design/mockups`**; motion hooks implemented per theme; completion sound; layered app icon; **light + dark checked on a real screen**; Reduce Motion / Increase Contrast honored |"
> `PLAN.md:149–150` — "3. While M0 builds, export the Sage Lily artboards (Today, Review, History, Widget) as PNGs into `design/mockups/`…"

**Consequence.** "Applied end to end" and "checked on a real screen" are both judgments; two reviewers can disagree and neither can be shown wrong. And `design/mockups/` is currently empty — its creation is item 3 of a §7 to-do list with no owner and no gate — so M8's only stated reference may not exist when M8 opens. Three token groups (`materials`, `wallpaper`, `stickers`) have no other milestone and will be skipped under a cell this loose.

**Proposed replacement text:** see §2, M8.

---

### F11 — "VoiceOver pass" and "500-task perf pass" have no definition of pass · **should-fix**

> `PLAN.md:88` — "| 9 | `m9-release` | 1.0 | **VoiceOver pass, 500-task perf pass**, README with screenshots and Gatekeeper steps, tagged `v1.0.0`, release zip built by CI |"

**Consequence.** `SPEC.md` supplies hard numbers the cell declines to use: 60 fps with 500 tasks (`SPEC.md:464`) and launch under one second (`SPEC.md:670`). "Pass" as written is satisfied by turning VoiceOver on, hearing something, and turning it off. `SPEC.md:462` asks for VoiceOver **actions**, not just labels — rotor actions for toggle-done, flag and drop — which a casual pass will not produce.

**Proposed replacement text:** see §2, M9.

---

### F12 — §4 says the components ship in M2–M5, but two of them are scheduled for M6 and M7 · **should-fix**

> `PLAN.md:95` — "Build each once in **M2–M5**, with a preview that shows every state listed:"
> `PLAN.md:108` — "| `FloatingIcon` | ring with count, all-done check, idle-faded |"

**Consequence.** `FloatingIcon` is an M6 deliverable (L85) and the widget-sized `Checkbox` / `ProgressRing` states (L99, L101) are only exercised at M7. An agent reading §4 literally will try to build `FloatingIcon` during M2–M5 — pulling `NSPanel` work forward into a UI milestone that has no window-management scope — or, reading §3 literally, will ship M5 with an unbuilt component that §4 said was due.

**Proposed replacement text for `PLAN.md:95`:**
> `Build each once in the milestone named beside it, with a preview that shows every state listed. Checkbox / TaskRow / ProgressRing / DayHeader / EntryField / EmptyState in M2; ReviewCard in M3; Nav in M4; CalendarCell / StatTile in M5; FloatingIcon in M6. The widget-sized Checkbox and ProgressRing states are added in M7.`

---

### F13 — §4's preview states omit "loading" and "50 tasks", which `SPEC.md` and `CLAUDE.md` both require · **should-fix**

> `PLAN.md:100` — "| `TaskRow` | open, done, flagged, carried (2d), recurring, with due time, with note collapsed/expanded, editing title, 200-char title, RTL, emoji |"
> `PLAN.md:107` — "| `EmptyState` | morning, all done, no history, empty Someday |"

**Consequence.** `SPEC.md:461` and `CLAUDE.md` ("Every component preview shows: empty, loading, one item, 50 items, very long title, all done") require a loading and a 50-item state on every component preview. Neither word appears anywhere in §4. Since §4's previews are the input to the snapshot suite (L110–111) — the plan's only automated enforcement of the no-literal-styling rule — the loading and high-density states are never rendered under `TestTheme`, so a hard-coded spinner colour or a row height that breaks at fifty rows reaches M8 undetected.

**Proposed replacement text — add a sentence under `PLAN.md:95` and extend the list rows:**
> `Every component's preview set also includes the six states CLAUDE.md requires of all of them — empty, loading, one item, 50 items, very long title, all done — in addition to the component-specific states below. For TaskRow and the list container that means a 50-row and a loading-skeleton preview; for ProgressRing and DayHeader an indeterminate/loading state.`

---

### F14 — The motion hooks exist only at M8, which contradicts the plan's own "M8 is polish, not a rewrite" · **should-fix**

> `PLAN.md:87` — "…Sage Lily applied end to end against `design/mockups`; **motion hooks implemented per theme**; completion sound; …"
> `PLAN.md:90–91` — "Design work is not deferred entirely to M8: from M2 on, views are built against `SageLilyTheme` so the human check after each milestone is also a design check. **M8 is polish, not a rewrite.**"

**Consequence.** `SPEC.md:442–444` and `CLAUDE.md` both say the eight named hooks exist from the start "even if they start simple". If the first mention of them is M8, then M2–M7 ship views with no animation call sites, and M8 must reopen every view in `DailyUI` to insert them — which is the rewrite L91 says M8 is not. It also means Reduce Motion (`SPEC.md:463`) has nothing to switch off until M8.

**Proposed replacement text — append to M2's "Done when", and trim M8's:**
> M2: `…; \`theme.motion\` declares all eight named hooks (taskComplete, taskAdd, taskRemove, reorder, dayRollover, reviewCardSwipe, allDoneCelebration, streakIncrement) and every one that has a call site in this milestone is invoked there, with \`TestTheme\` returning \`.none\` for all eight so a missing hook shows up as an unanimated snapshot diff; Reduce Motion collapses all eight to instant opacity changes.`
> M8: `…; the eight motion hooks carry their Sage Lily durations and curves from design/theme-sage-lily.json (no new call sites added in this milestone); …`

---

### F15 — Nothing builds the navigation between the five views · **should-fix**

> `PLAN.md:83` — "| 4 | `m4-planning` | Upcoming, Someday, Recurring | Grouped Upcoming with drag between days; Someday with stale marker; templates with pause and 7-day history row; quick-entry scheduling tokens |"

**Consequence.** `SPEC.md:137–139` requires "sidebar or toolbar navigation to four other views… views switch inside it" and `design/theme-sage-lily.md` designs a `Nav` component ("segmented pill in surfaceAlt"). No milestone cell mentions navigation and §4's component table has no `Nav` row, so M4 will produce three views with no route to them and `Cmd 1`–`Cmd 5` with no target.

**Proposed replacement text — prepend to M4's "Done when", and add a §4 row:**
> M4: `A Nav component (segmented pill per design/theme-sage-lily.md) hosted in the single main window switches between Today, Upcoming, Someday, Recurring and History with Cmd 1–5 (SPEC.md:137, 212); the selected view persists across launches. Then: grouped Upcoming…`
> §4: `| \`Nav\` | five segments, each selected, keyboard-focused, narrow window (360 pt) |`

---

### F16 — Window size and position persistence is dropped · **should-fix**

> `PLAN.md:81` — "…data persists; **window min 360×480**; hidden title bar |"

**Consequence.** `SPEC.md:135` asks for two things — "Window size and position persist. Minimum size 360 by 480 points" — and M2's cell keeps only the second. The app reopens at its default frame every launch, which specifically defeats the reason the minimum exists ("so it works as a narrow side panel").

**Proposed replacement text:** `…data persists; window minimum 360×480 and its frame restored across relaunch via a named \`.windowFrameAutosaveName\` (SPEC.md:135); hidden title bar with traffic lights in place (SPEC.md:445).`

---

### F17 — The `materials` token group — the plan's only macOS 26 Liquid Glass surface — is consumed by no milestone · **should-fix**

> `PLAN.md:12–13` — "**One theme layer.** No literal colors, fonts, sizes, radii or animation curves inside views."
> `PLAN.md:81` — "| 2 | `m2-today` | Theme layer + Today list | `Theme` protocol, `SageLilyTheme`, `TestTheme`; …"

**Consequence.** §0's list of what the theme owns omits materials, and so does M2's cell — yet `SPEC.md:447–449` requires solid / system material / Liquid Glass options through the theme with glass restricted to floating chrome, and `theme-sage-lily.json` ships `"materials": {"window":"solid","toolbar":"ultraThin","entryBar":"ultraThin","rows":"solid"}`. Nothing reads that group, so the entry-field bar and toolbar render solid, and the "never glass on content rows" rule has no enforcement point.

**Proposed replacement text — amend `PLAN.md:12` and append to M2:**
> §0: `**One theme layer.** No literal colors, fonts, sizes, radii, **materials** or animation curves inside views.`
> M2: `…; \`theme.materials\` drives the window, toolbar, entry-bar and row backgrounds, with glass (\`.ultraThinMaterial\`) applied only to the toolbar and entry bar and never to a content row (SPEC.md:447–449) — asserted by a snapshot of TaskRow over a high-contrast backdrop.`

---

### F18 — Font bundling is a human to-do, not a milestone gate, and its failure mode is silent · **should-fix**

> `PLAN.md:150` — "…and put the two font families' TTFs into `App/Fonts/`."

**Consequence.** `design/theme-sage-lily.md` requires the TTFs bundled *and* registered via `ATSApplicationFontsPath`, and names fallbacks (New York, SF Pro) that SwiftUI will use silently if registration is missing. As §7 item 3 this has no owner and no check. The result: every screenshot the human reviews from M2 onward is of the wrong typeface, the failure never appears in code review or CI, and it surfaces at M8 as "the design looks wrong" with no obvious cause.

**Proposed replacement text — append to M2's "Done when":**
> `…; the five font files from design/theme-sage-lily.json are in App/Fonts/, registered through \`ATSApplicationFontsPath\` in Info.plist, and a DailyUI test asserts \`NSFont(name: "Jost-Regular", size: 15)\` and \`NSFont(name: "CormorantGaramond-Medium", size: 34)\` both resolve — failing loudly rather than falling back to SF Pro / New York.`

---

### F19 — The task detail view (`Cmd I`) exists as a shortcut with nothing behind it · **should-fix**

> `PLAN.md:97–108` — the §4 component table (`Checkbox`, `TaskRow`, `ProgressRing`, `DayHeader`, `EntryField`, `ReviewCard`, `CalendarCell`, `StatTile`, `EmptyState`, `FloatingIcon`)

**Consequence.** `SPEC.md:200` binds `Cmd I` to "Open detail (note, due time)", and `SPEC.md:163, 165` make Note and Due time editable task fields. No component and no milestone deliver that surface. Downstream: due times can never be set, so the due-time notification (`SPEC.md:371`) can never fire, and the notification-permission moment (`SPEC.md:379`) is unreachable — three spec'd behaviors fall over on one missing view. `SPEC.md:272` ("Due time, note and flag can all be set ahead of time" in Upcoming) fails for the same reason.

**Proposed replacement text — add a §4 row and name it in M2:**
> §4: `| \`TaskDetail\` | empty note, long note, note with links, due time set, due time cleared, flagged, 200-char title, editing |`
> M2: `…; a TaskDetail inspector opened by Cmd I (SPEC.md:200) editing note and due time, with links in the note clickable (SPEC.md:163).`

---

### F20 — M4 does not say what editing a recurring instance does to its template · **should-fix**

> `PLAN.md:83` — "…Someday with stale marker; **templates with pause and 7-day history row**; quick-entry scheduling tokens |"

**Consequence.** `SPEC.md:284–285` states the rule plainly — "Editing an instance changes only that day. Editing the template changes future instances" — and it is the only place the plan could capture it, since §2's recurrence bullet defines `nextOccurrence(after:)` and nothing else. Left unstated, the natural SwiftData implementation is a relationship, and editing today's "Gym" instance rewrites every future Monday with no undo path.

**Proposed replacement text:** `…templates with pause and 7-day history row; editing a generated instance detaches it (its \`templateID\` is kept for history but the template is untouched), editing the template changes only instances generated after the edit (SPEC.md:284–285) — both covered by DailyCore tests; quick-entry scheduling tokens.`

---

### F21 — M5's "StatTile row" does not say which statistics, and export/import has no correctness criterion · **should-fix**

> `PLAN.md:84` — "| 5 | `m5-history` | History + stats + export | Month heat map with CalendarCell, day detail, search, duplicate-to-today, **StatTile row**, JSON/Markdown **export, import**, delete-older-than |"

**Consequence.** `SPEC.md:337–350` defines six statistics with precise formulas — including two that are easy to get wrong ("completion rate over 7 **and** 30 days", "busiest weekday = highest **average** completions"). "StatTile row" is satisfied by shipping two tiles. Likewise, export and import can both "exist" while round-tripping lossily; a user who exports before using "delete history older than" (`SPEC.md:354`) and re-imports would silently lose `originalDay` or `carryCount`.

**Proposed replacement text:** see §2, M5.

---

### F22 — No milestone creates the XCUITest smoke tests · **should-fix**

> `PLAN.md:48` — "└── .github/workflows/ci.yml    # swift test on DailyCore/DailyUI each push; release zip on tags"

**Consequence.** `SPEC.md:493–494` specifies "Swift Testing for the logic package; **a few XCUITest smoke tests**." CI as described runs package tests only, and no milestone creates a UI test target. Nothing then catches the classic launch-path regressions — the window not appearing, the App Group container failing to open in a signed build, the Settings window crashing — which are exactly what a smoke test is for and exactly what `swift test` cannot see.

**Proposed replacement text — append to M9's "Done when" and amend §1 L48:**
> M9: `…; three XCUITest smoke tests (SPEC.md:493) run in CI on macOS 26: the app launches and shows Today within 3 s, a task typed into the entry field appears in the list and survives a relaunch, and the Settings window opens and closes without crashing.`
> §1 L48: `# swift test on DailyCore/DailyUI each push; xcodebuild test (XCUITest smoke) on PRs; release zip on tags`

---

### F23 — Haptics are dropped from the Feedback service · **nit**

> `PLAN.md:87` — "…motion hooks implemented per theme; **completion sound**; layered app icon; …"

**Consequence.** `SPEC.md:454–456` describes "A Feedback service [that] handles completion sounds **and trackpad haptics**". M8 keeps the sound and drops the haptics, and no `Feedback` type appears in §1's layout or §2's decisions — so the sound will likely be inlined into the checkbox view instead, which is also a theme-layer violation waiting to happen.

**Proposed replacement text:** `…; a \`Feedback\` service in DailyUI plays the completion sound (off by default, SPEC.md:454) and fires an \`NSHapticFeedbackManager\` alignment pattern on completion, both routed through the theme so TestTheme can silence them; …`

---

### F24 — Two theme token groups are unconsumed, and one violates the light/dark rule · **nit**

> `PLAN.md:87` — "| 8 | `m8-design` | Final visual pass | **Sage Lily applied end to end** against `design/mockups`; …"

**Consequence.** `theme-sage-lily.json` ships a `wallpaper` group (two radial gradients, scoped to `material = solid`) and a `stickers` group (`lily.png`, `star-pink.png`, the star "used on the About screen only"). Neither is named in any milestone, so both will be skipped under "applied end to end". Separately, `wallpaper` defines **only** a `light` value, which contradicts `SPEC.md:450` ("Every token has light and dark values") — a discrepancy between the spec and the chosen theme that needs resolving in the same PR, per `CLAUDE.md`'s interpretation rule.

**Proposed replacement text — append to M8, and raise the discrepancy:**
> `…; every token group in design/theme-sage-lily.json is read by at least one view, including \`wallpaper\` (window ground when \`materials.window == "solid"\`) and \`stickers\` (the lily on the all-done empty state, one per surface). \`wallpaper\` currently has no dark value; either add one to design/theme-sage-lily.json or record in SPEC.md:450 that the wallpaper is light-only and the dark scheme uses \`background\` flat. To Dew has no About screen in SPEC.md — either drop star-pink.png from the token file or add an About window to M6's Settings work; decide in the M8 PR.`

---

### F25 — M0's spike gate is a disjunction that passes without running the spike · **nit**

> `PLAN.md:79` — "…`swift test` runs empty; Dock icon appears; **widget App Group works or is ruled out under free signing** (decides whether the prebuilt zip ships the widget) |"

**Consequence.** "works **or** is ruled out" is true under either outcome and under the outcome "nobody checked". `SPEC.md:580–583` calls this "the first technical spike in the milestones" and makes two downstream decisions depend on it (whether the zip ships the widget, and what README says). With no artifact required, M0 can close with the question still open and M7 discovers it.

**Proposed replacement text:** see §2, M0.

---

### F26 — `CLAUDE.md` documents `./scripts/release.sh`, which is absent from §1's repository layout · **nit**

> `PLAN.md:48` — "└── .github/workflows/ci.yml    # swift test on DailyCore/DailyUI each push; release zip on tags"

**Consequence.** `CLAUDE.md`'s Commands block tells Claude Code to run `./scripts/release.sh` ("CI does this on version tags"), but §1's tree has no `scripts/` directory and no milestone creates the file. M0 builds the repo from §1's tree, so the very first `release.sh` invocation — at M9, on a tag, in CI — fails.

**Proposed replacement text — add to §1's tree and to M0's "Done when":**
> §1: `├── scripts/release.sh          # builds, ad-hoc signs and zips ToDew.app (M0)`
> M0: `…; \`./scripts/release.sh\` produces a launchable ToDew.zip locally, and ci.yml calls it on version tags.`

---

### F27 — The Dock-icon-reflects-day-state stretch goal is neither assigned nor explicitly cut · **nit**

> `PLAN.md:87` — "| 8 | `m8-design` | Final visual pass | Sage Lily applied end to end…; **layered app icon**; light + dark checked on a real screen; … |"

**Consequence.** `SPEC.md:391–392` routes one decision to the design phase — "The Dock icon can optionally reflect the day state (clear, in progress, all done). This is a stretch goal, decided with the visual design." M8 is the design phase and does not mention it. Not building it costs nothing; leaving no record that it was decided means the next reader of `SPEC.md` re-opens the question during M9 or after 1.0.

**Proposed replacement text — append to M8's "Done when":**
> `…; the SPEC.md:391 stretch goal (Dock icon reflecting day state) is decided in this milestone and the decision is written into SPEC.md's "Answered questions" table in the same PR — default: cut for 1.0, since the layered icon already carries four macOS 26 appearances.`

---

### F28 — "Text never truncates without a way to read it in full" has no owner · **nit**

> `PLAN.md:88` — "| 9 | `m9-release` | 1.0 | VoiceOver pass, 500-task perf pass, README with screenshots and Gatekeeper steps, tagged `v1.0.0`, release zip built by CI |"

**Consequence.** `SPEC.md:465` and `CLAUDE.md` both state the rule, and `SPEC.md:672–673` makes it an acceptance row ("Title of 200 characters, or emoji, or right-to-left text → Displays fully; no clipping"). In a 360 pt-wide window (`SPEC.md:136`) a 200-character title *must* truncate somewhere, so this requires a deliberate affordance — a tooltip, an expanding row, or the detail view — that no milestone commissions. §4's `TaskRow` previews a "200-char title" but the cell never says what correct looks like.

**Proposed replacement text — append to M2's "Done when" and to M9's:**
> M2: `…; a title too long for the row's width stays reachable in full — the row expands on selection and the full text is the VoiceOver label and the help tooltip (SPEC.md:465); snapshot-tested at 360 pt width with a 200-character title, an emoji title and an RTL title (SPEC.md:672).`
> M9: `…; the SPEC.md:672 acceptance row is verified on a real 360 pt window in both light and dark.`

---

*End of review 01.*
