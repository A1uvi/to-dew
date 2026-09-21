# 00 — Adjudication

**Integrator:** `plan-editor` · **Date:** 2026-09-21 · **Mode:** adjudicate-only. No file other than this
one was written. `PLAN.md`, `SPEC.md`, `CHANGELOG.md` and `review/01`–`review/04` are untouched.

Inputs: `PLAN.md` (151 lines) read in full, `review/01`–`review/04` (2,980 lines) read in full,
plus `SPEC.md`, `CLAUDE.md` and `design/SageLilyTheme.swift` consulted to check claims I was not
willing to take on trust.

**Verdict counts:** 77 findings — **48 accept · 25 accept-modified · 1 reject · 3 needs-human-decision.**
Those three, plus two product consequences carried inside accepted findings, make **six decisions for
the human** (§2). The count of outright rejections is low because all four reviewers found real
problems; the discipline is in the 25 modifications and in §7, which rejects roughly half the
*machinery* they proposed.

---

## 1. Executive summary

`PLAN.md` is a good plan with three real defects and one false comfort.

**The §2 decisions are wrong in ways M1's tests would then encode.** `logicalDate` subtracts six
hours of absolute time, which lands an hour wrong on both DST days while still passing the spec's
DST acceptance row — I checked the arithmetic myself and it is correct. `RecurrenceRule` declares
`weekdays` twice and will not compile. "Rollover is one transaction" describes something SwiftData
does not provide. "One store actor so the app and the widget never conflict" is false across two
processes. Undo as a closure cannot leave the actor.

**Scope the spec requires is in no milestone.** Nothing stores the eighteen settings, nothing
declares a SwiftData schema version (the only requirement here that cannot be retrofitted), nothing
navigates between the five views, nothing opens the task detail that `Cmd I` is bound to, and
nothing builds the update check.

**The "Done when" cells are lists of nouns.** Four cannot be settled at all: M0's gate is a
disjunction that passes if nobody runs the spike, M1 asserts a coverage number it never measures,
M6 embeds a seven-day wait, and M8/M9 say "pass".

**The false comfort:** §4 claims two-theme snapshots enforce the no-literal-styling rule. Baselines
are recorded from the code under test, so a hard-coded `12` is written into both baselines on the
first run and passes forever. Because §6 then lists that risk as retired, nobody builds the thing
that would retire it.

Size is the fifth problem and the one that hides the others: seven of ten milestones are 1.5–4× the
plan's own PR budget, and the budget counts tests, so it will be abandoned at M1.

---

## 2. Decisions needing the human

Six. Each is a product or authorship call, not a plan defect, so I have not decided it.

### D1 — The widget: pre-agree the kill clause, or decide at the time? *(decide first)*

`review/02` establishes the macOS rule with sources: an app extension may open an App Group
container only under a Mac App Store deployment, a **Team-ID-prefixed** identifier, or an embedded
provisioning profile. Two consequences, at two different confidence levels:

- **High confidence:** CI has no signing identity, so the release zip is ad-hoc signed and its
  widget is dead on arrival. `SPEC.md`'s stated fallback ("the zip ships without the widget") is
  almost certainly the outcome, decided on day one rather than discovered at M9.
- **Uncertain — this is what the spike is for:** whether a *local* build under a free Personal Team
  with a Team-ID-prefixed group works. `review/02` says "likely". Nobody has run it.

`review/03` adds a conclusion its teammate missed and I agree with: if that local case fails there
is **no snapshot-file fallback** either, because a sandboxed extension with no group container has
no shared path to read. The widget would be gone from every install path, not just the zip.

> **(A)** The widget becomes **milestone 4** (up from 7), gated on the M0 spike, and `PLAN.md`
> carries a pre-agreed clause: *if the free-Personal-Team case fails, milestone 4 is deleted from §3
> and `SPEC.md`'s widget section is struck, in the M0 PR.*
> **(B)** The widget stays late and best-effort; if the spike fails you decide then.
>
> **My recommendation: A.** Consequence of A: you sign off now on possibly deleting a spec'd
> feature, and in exchange the plan's only milestone-scale binary risk is retired before ~5,800
> lines of unrelated work are built on it. Consequence of B: the question stays open through six
> milestones and is answered by an empty widget on someone else's Mac.

### D2 — "Dynamic text size is supported" (SPEC:452) vs. macOS having no Dynamic Type

`UIFontMetrics` is iOS-only and `Font.custom(_:size:relativeTo:)` compiles on macOS with nothing to
scale against — `design/SageLilyTheme.swift` already uses `relativeTo:` on all eight type styles, so
the starter theme encodes the misunderstanding. Whether macOS 26's Accessibility ▸ Display text size
moves anything for a third-party app is genuinely unknown and needs a human at a screen.

> **(A)** The app owns its own text size: a **nineteenth setting** and a `typeScale` factor on the
> `Theme` protocol, decided in `2a` **before any component is written**.
> **(B)** Amend `SPEC.md:452` to drop the claim and ship a fixed type scale.
>
> **My recommendation:** run the spike in M0, default to **B** unless it shows the system setting
> moves something. Consequence of deciding this *late*: `typeScale` changes the protocol's shape, so
> it means editing every component and re-recording every snapshot baseline. This is the one item
> where "we'll see" is the expensive answer.

### D3 — Does an absence break a streak?

A user away four days returns to four `DayRecord`s with carried tasks (`totalCount > 0`) and
`doneCount == 0`. Under §2 as written that is four failures, and the streak breaks.

> **(A)** A day the app was never opened on is **neutral** and skipped when walking the streak.
> **(B)** It counts as a failure, as written today.
>
> **My recommendation: A.** Costs one field (`DayRecord.wasReviewed` or equivalent) decided now;
> costs a rewrite of `StreakCalculator` and its tests if decided after `1b`.

### D4 — `wallpaper` has no dark value

`SPEC.md:450` says every token has light and dark values; `theme-sage-lily.json` ships `wallpaper`
with only a light value.

> **(A)** Add a dark wallpaper to the token file. **(B)** Record in `SPEC.md` that the wallpaper is
> light-only and the dark scheme uses flat `background`. **My recommendation: B** — one line, and
> a dark radial-gradient ground is a design decision you should make at M8, not now.

### D5 — The pink star sticker and the About screen

`design/theme-sage-lily.md` says `star-pink.png` is "used on the About screen only". `SPEC.md`
has no About screen and no milestone builds one.

> **(A)** Add a small About window to `7a`. **(B)** Drop `star-pink.png` from the token file.
> **My recommendation: B.**

### D6 — Dock icon reflecting day state

`SPEC.md:391` makes it a stretch goal "decided with the visual design". M8 is the visual design and
does not mention it.

> **(A)** Build it in M8. **(B)** Cut for 1.0 and write the decision into `SPEC.md`'s answered-questions
> table. **My recommendation: B** — the layered icon already carries four macOS 26 appearances.
> Either way the point is that the decision gets *recorded*, so the next reader does not re-open it.

---

## 3. Adjudication table

77 rows, blockers first. "Edit" describes what I will write into `PLAN.md` on the next run.

### 3.1 Blockers (25)

| ID | Rev | Sev | Summary | Verdict | Edit / reason |
|---|---|---|---|---|---|
| F1 | 01 | blocker | M1 claims six acceptance rows `DailyCore` structurally cannot run | accept | M1's cells name their **fourteen** logic rows; 618/629 → `3a`, 663/666 → widget milestone, 669/672 → `9`. Test names end `_specNNN` so traceability is greppable. |
| F2 | 01 | blocker | M6's gate is a subjective judgment plus a seven-day wait | accept-modified | Replace the parenthetical with the eight concrete behaviours from `SPEC.md:145–155`. **Reject the second half** — the keep-or-cut decision is *already* in `SPEC.md`'s "Still open" list; it does not need adding, only removing from the gate. |
| F3 | 01 | blocker | Nothing stores the eighteen settings | accept | New §2 bullet: one `Settings` `Codable` struct in `DailyCore` with the spec defaults, persisted through `Store` into the App Group `UserDefaults` suite so the widget reads the same values. Built in `1a`; the window is `7a`. |
| F4 | 01 | blocker | M2 promises a keyboard table three rows of which need M4/M5 | accept | `2d` ships the eight Today-scoped shortcuts, each with a key-equivalent test. `Cmd T`, `Cmd Shift S`, `Cmd 1`–`5` are present in the menus, disabled with a visible reason, and go live in `5a`. |
| F5 | 01 | blocker | `RecurrenceRule` does not compile; `everyNDays` anchor contradicts the spec | accept-modified | **Conflict C1** with 02/F13. Resolution: 02's naming (`.weekly(Set<Weekday>)` with `.weekdays` a static convenience), 01's anchor (`lastGeneratedDay` on the template, never in the rule — otherwise pause-then-resume fires a catch-up burst). |
| F6 | 01 | blocker | No milestone declares the SwiftData schema version | accept | `1a`: `SchemaV1: VersionedSchema` with all four entities, `ToDewMigrationPlan` with V1 as its only stage, `AppState.schemaVersion` written on first launch, a checked-in fixture store that opens and migrates. The one item here that cannot be bought back later at any price. |
| F1 | 02 | blocker | App Group must be Team-ID-prefixed; CI cannot produce one | accept-modified | Assert what is certain: the identifier rule, `APP_GROUP = $(DEVELOPMENT_TEAM).$(BUNDLE_PREFIX)` in the xcconfig, a build phase that fails readably when the team is blank. Do **not** assert the widget's fate — see §5/U1 and D1. |
| F2 | 02 | blocker | `logicalDate` is an hour wrong on both DST transition days | accept | **I verified the arithmetic.** 06:00 EDT on 2027-03-14 is 10:00 UTC; minus 6h is 04:00 UTC, still EST, = 23:00 on Mar 13. `logicalDate` reads the **wall-clock** hour and subtracts a day if it is before `rolloverMinutes`; it never does absolute-time arithmetic on a `Date`. Timer uses `Calendar.nextDate(…matchingPolicy:.nextTime, repeatedTimePolicy:.first)` so a 02:30 rollover in the spring-forward gap fires once. Two new acceptance rows. |
| F3 | 02 | blocker | "Runs in one transaction" is not something SwiftData provides | accept-modified | Reword: rollover mutates a dedicated `ModelContext` with `autosaveEnabled = false` and commits with a **single `save()`**; `ModelContext.transaction(_:)` is not used; idempotency is a guard written inside that same save. The crash-atomicity *guarantee* is verified by the M0 spike, not asserted as fact (see §5/U4). |
| F4 | 02 | blocker | "The app and the widget never conflict" is false across processes | accept | Fix §0 rule 3 and the §2 `Store` bullet: an actor serialises one process. The app is the only writer; the widget opens read-only; the one exception is a checkbox intent scoped to `complete(TaskID)` that posts a change notification the app refetches on. |
| F5 | 02 | blocker | M0's gate conflates three signing environments and never tests a second Mac | accept | Merges with 01/F25 and 03/S2. `docs/m0-signing.md` records three results with pasted `codesign -d --entitlements -` output: Xcode + free Personal Team; ad-hoc as CI builds; a zip of the first on a Mac not registered to the builder. |
| F6 | 02 | blocker | A repeating notification's body is frozen at scheduling time | accept | `7b` schedules a rolling seven-day queue of **non-repeating** dated requests, bodies computed at scheduling time from `RolloverEngine.preview(for:)` (added in `1c`), rewritten on launch, wake and mutation. Tested by quitting and waiting **two** mornings — the stated test passes on delivery one and fails on delivery two. §6's risk row replaced. |
| S1 | 03 | blocker | The ~800-line rule counts tests, so it is unusable and will be abandoned at M1 | accept | Budget **~800 lines of production diff**; tests, previews, baselines and project-file churn are excluded and required in the same PR. Never split a component from its previews or a view from its keyboard handling. |
| S2 | 03 | blocker | M0's gate controls a shell-script switch when it should control whether a milestone exists | accept-modified | Adopt the three recorded results and the widget gating. The **kill clause** is a product decision → **D1**. |
| S3 | 03 | blocker | The plan's only milestone-scale binary risk is retired last | accept | Widget moves from 7 to **4**, directly after live rollover; planning / history / system shift to 5 / 6 / 7. Its dependencies are all satisfied at 4 and it needs nothing from the three milestones it currently sits behind. Subject to D1. |
| S4 | 03 | blocker | M2 is one table row containing ~3,000 production lines, on the critical path | accept | Split into `2a` theme · `2b` components · `2c` Today + window + persistence · `2d` entry, detail, mutations, undo, keys. This is the milestone that would have sunk the plan. |
| S5 | 03 | blocker | M1 is one row over ~2,000 lines and silently claims M5's export/import | accept | Split into `1a` model/time/schema/settings · `1b` engines · `1c` store + rollover. Export/import codecs live in `DailyCore` but are **built in `6b`** with the UI that calls them; §3 says so explicitly. |
| S6 | 03 | blocker | "M1 first and alone" serialises the one strand with no dependency on M1 | accept | `2a` (theme protocol, both themes, fonts, catalog, snapshot harness) imports nothing from `DailyCore` and may start the day M0 closes. Everything from `2b` on is strictly serial, so nothing else is worth parallelising. |
| W1 | 04 | blocker | One prompt for ten milestones; no blocked protocol, no precedence rule | accept-modified | Extend the §5 preamble with: read only row N and the `SPEC.md` ranges it cites; post the exit checklist before writing code; `SPEC.md` wins on *what*, `PLAN.md` on *how and when*; a four-part `BLOCKED` format; a never-without-asking list; an ordered handback. Then **three 3–4 line addenda** (logic / UI / system), not three full pages. **Reject** replacing §5 with review 04's §1 verbatim — it is ~55 lines and would make §5 the longest section in the plan. |
| W2 | 04 | blocker | Snapshots cannot enforce the no-literal rule; claiming they do stops anyone enforcing it | accept-modified | The most important finding in the four reviews. Rewrite §4's claim and §6's risk row: snapshots are a **regression** gate. Enforcement is `scripts/lint-theme.sh` (syntactic, created in `2a`) plus a requirement that `TestTheme` differ from `SageLilyTheme` in **every** token group. **Reject** the sentinel-palette and metric-bump probes (see §7/R2). |
| W3 | 04 | blocker | A test suite cannot enumerate `#Preview` blocks | accept-modified | Real and mechanical. Fix: previews and tests read one array of preview states in `Sources/DailyUI`; each `#Preview` renders from it. **Reject** the per-entry declared token set (`tokens: Set<TokenID>`) and the generated `required-previews.json` (see §7/R2). |
| W4 | 04 | blocker | `swift test` on `DailyUI` cannot see the app's fonts, so every baseline is the wrong typeface | accept | **Conflict C5** with 01/F18, and 04 is mechanically right: `ATSApplicationFontsPath` registers from the *app bundle*, so a SwiftPM test run falls back to SF Pro silently and a hard-coded `.system(size: 15)` renders identically to `theme.type.body`. Fonts ship as a `DailyUI` package resource, registered by `DailyUI` at first use; `App/Fonts` references the same files; `FontRegistrationTests` fails on a fallback. |
| W5 | 04 | blocker | No way to put the app into the states the quality bar requires | accept-modified | Also real: nobody hand-types fifty tasks, so the states that break layouts are the states never seen. `2c` adds debug-only `-ToDewFixture <name>` and `-ToDewNow <ISO-8601>` with the named fixture list. **Reject** `scripts/shots.sh` as specified (see §7/R3). |
| W6 | 04 | blocker | The screenshot round happens after the milestone, when findings cannot be acted on | accept-modified | Round happens when the code compiles, both suites are green and the theme lint exits 0 — **before** the PR is written. One round per UI PR; the row's "Done when" names the shots; a second round re-shoots only failures; no third round — convert the question into a test. **Reject** the per-file token-attribution manifest format. |
| W7 | 04 | blocker | The theme has no token for opacity, stroke width, shadow or line height | accept | **I verified this against `design/SageLilyTheme.swift`:** the protocol has `colors, type, radius, space, sizes, motion, materials` — no opacity, no stroke group, no shadow (though the JSON ships `shadow.window`), no line height. The design doc requires 45% opacity on done rows, a 1.5 pt checkbox border and a 1 pt hairline *in M2's own components*, so the rule breaks in the milestone that establishes it. §0 rule 2's list gains stroke widths, opacities, shadows and materials; a §2 bullet names the full token surface. **Reject** the resolver-closure restructuring bundled with it (§7/R2). |

### 3.2 Should-fix (37)

| ID | Rev | Sev | Summary | Verdict | Edit / reason |
|---|---|---|---|---|---|
| F7 | 01 | should-fix | No milestone introduces a String Catalog | accept | One clause in `2a`, plus one rule in the theme lint (`Text("` with a bare literal). |
| F8 | 01 | should-fix | The GitHub Releases update check is in no milestone | accept-modified | Lands in **`7a`** with the Settings window that hosts its toggle, not in M9. Off by default; at most one fetch per launch; a CI grep asserts it is the only network call in the tree. |
| F9 | 01 | should-fix | M6 names four notification types but none of their four behaviours | accept | Folded into `7b`'s cell: authorization requested at the first due time and never at launch (asserted by a test), a category with Done and Snooze 15 min, tap routing to the task or the review, `.timeSensitive` only for due time so Focus modes are honoured. |
| F10 | 01 | should-fix | M8's gate is opinion and depends on an artifact no milestone produces | accept-modified | Take the token-coverage test ("every token group is read by at least one view"). Mockups move into **M0's** "Done when" (03/S9). **Reject** the CI branch-name precondition gate (04/G13). |
| F11 | 01 | should-fix | "VoiceOver pass" and "500-task perf pass" are undefined | accept-modified | Take the numbers: Accessibility Inspector reports zero issues; no animation hitch over 16 ms on a seeded 500-task day; cold launch under 1 s measured three times. Compressed — the proposed cell is eight clauses long. Labels and actions move into each UI row per S11. |
| F12 | 01 | should-fix | §4 says components ship M2–M5 but two are M6/M7 | accept | Superseded in detail by S14's remapping, which is the same fix against the new numbering. |
| F13 | 01 | should-fix | §4's preview states omit "loading" and "50 tasks" | accept | One sentence above the §4 table: every component's preview set also carries `CLAUDE.md`'s six universal states. |
| F14 | 01 | should-fix | Motion hooks first appear at M8, contradicting "M8 is polish" | accept-modified | **Conflict C3.** Hooks are declared on the protocol in `2a` and invoked in the milestone that creates each call site; M8 changes values, adds no call sites. **Reject** "`TestTheme` returns `.none` for all eight" — the shipped starter returns `.linear(duration: 1)`, which is the better test value; `.none` belongs to the Reduce Motion path (04's version). |
| F15 | 01 | should-fix | Nothing builds the navigation between the five views | accept | `Nav` component (segmented pill) hosted in the single main window, in `5a`, with `Cmd 1`–`5` going live there. New §4 row. Without it `5a`/`6a` are unreachable UI. |
| F16 | 01 | should-fix | Window size and position persistence is dropped | accept | `2c`: minimum 360×480 **and** the frame restored via a named `.windowFrameAutosaveName`. |
| F17 | 01 | should-fix | The `materials` token group is consumed by no milestone | accept | §0 rule 2 gains "materials"; `2a`'s theme surface includes it; glass on the toolbar and entry bar only, never on a content row. |
| F18 | 01 | should-fix | Font bundling is a §7 human to-do with a silent failure mode | accept-modified | Problem accepted; **mechanism replaced by 04/W4** (conflict C5) — the proposed `DailyUI` test cannot pass against an app-bundle-only registration. |
| F19 | 01 | should-fix | `Cmd I` is bound to a detail view nothing builds | accept | `TaskDetail` inspector in `2d` (note with clickable links, due time) plus a §4 row. Three spec'd behaviours — due-time notifications, the permission moment, setting fields ahead in Upcoming — all fall over on this one missing view. |
| F20 | 01 | should-fix | M4 does not say what editing a recurring instance does to its template | accept | `5b`: editing an instance detaches it (`templateID` kept for history, template untouched); editing a template changes only instances generated after the edit. Both covered by `DailyCore` tests. |
| F21 | 01 | should-fix | "StatTile row" names no statistics; export/import has no correctness criterion | accept | Six named stats, computed in `1b` and rendered in `6a`; `6b` requires export → wipe → import → **byte-identical re-export**, a golden Markdown fixture, and a scoped delete-older-than. |
| F22 | 01 | should-fix | No milestone creates the XCUITest smoke tests | accept-modified | Three smoke tests, created in **`2c`** (where "data persists" first becomes true) rather than retrofitted at M9. **Run nightly and on tags, not on every PR** — hosted-runner UI tests are slow and flaky, and a flaky required check is how gates get disabled. |
| F7 | 02 | should-fix | `WidgetCenter` in `DailyCore` breaks the no-UI-import rule | accept | §2 as written violates `CLAUDE.md`'s first architecture rule. Mutations publish a change event; the **app target** calls `reloadTimelines(ofKind:)` on a ~250 ms trailing debounce, so a 500-task drag-reorder is one reload. |
| F8 | 02 | should-fix | Undo as a closure does not survive the actor or the widget | accept | Each mutation returns a `Sendable` `InverseAction` **value** capturing no `@Model`; the app layer turns it into an `UndoManager` registration; `DailyCore` imports no `UndoManager`. The stack is cleared where rollover commits — otherwise ⌘Z after 06:00 desynchronises a frozen `DayRecord` from tasks, silently and permanently. |
| F9 | 02 | should-fix | macOS is not a Dynamic Type platform | accept-modified | The §6 risk row is replaced with the fact (the stated check "passes by looking unchanged"). The proposed `typeScale` + nineteenth setting is a **product change** → **D2**; `PLAN.md` records the open question and the spike, not the conclusion. |
| F10 | 02 | should-fix | Mac widget rendering modes are not "tinted and clear" | accept-modified | Use `\.widgetRenderingMode` and require legibility in **both values the Mac desktop produces**, with the widget milestone confirming which those are — 02 marks the specific names "likely", so the plan does not assert them. Also accepted: the widget never runs rollover (it writes), and its 06:00 entry comes from `preview(for:)`. |
| F11 | 02 | should-fix | `SMAppService` and notification auth are signature- and location-sensitive | accept-modified | Spikes recorded in M0. `7b`'s fallback affordances ("notifications unavailable" state, "move to Applications" step) are written as **conditional on the spike result**, not asserted as needed (§5/U5). |
| F12 | 02 | should-fix | `Day` has no stated inverse; "the current zone" is captured, not tracked | accept | `DayClock.date(for:atMinutes:)` is the only `Day`→`Date` conversion in the package (three call sites would otherwise each pick a time zone); `TimeZone.autoupdatingCurrent` read at each call against `Calendar(identifier: .gregorian)`; the user's system calendar is used for display only. |
| F13 | 02 | should-fix | `RecurrenceRule` will not compile and cannot be used in a `#Predicate` | accept-modified | Naming taken from here; anchor taken from 01/F5 (conflict C1). The `#Predicate` note is kept — templates are fetched whole and matched in memory, bounded by template count. Cheap now, a surprise in `5b` otherwise. |
| F14 | 02 | should-fix | A blank `DEVELOPMENT_TEAM` must fail the build, not the widget | accept | The committed state is blank by design, so every fresh clone builds an app that looks fine and a widget that is silently dead. A run-script phase fails the build with a readable message. |
| S7 | 03 | should-fix | The seven-day floating-icon wait blocks the widget in a serial plan | accept | M6 splits into `7a` settings · `7b` notifications + Dock + login · `7c` floating icon, last and explicitly droppable — nothing depends on it, so cutting it is a revert rather than unpicking a 1,670-line PR. |
| S8 | 03 | should-fix | "M8 is polish, not a rewrite" is an ordering claim the table does not support | accept | Amend the paragraph under §3: the protocol declares materials and all eight hooks from `2a`; M8 changes values, never call sites. (With C3's `TestTheme` correction.) |
| S9 | 03 | should-fix | `design/mockups/` is a dependency of M8 with no owner, date or gate | accept | Both the mockups and the font files move from §7's untracked to-do into **M0's "Done when"**. Every UI milestone from `2b` on is reviewed against them; M8 gates on them. |
| S10 | 03 | should-fix | M0 has preconditions the plan never lists | accept | §7 rewritten: a second Mac not registered to your account (if unavailable, record that result as UNKNOWN and treat it as false), ~20 minutes at the keyboard for the text-size spike, and waits long enough for a notification to be delivered after a quit. M0 is not an unattended milestone. |
| S11 | 03 | should-fix | M9 carries an unbudgeted accessibility retrofit across fourteen views | accept-modified | Right that labels and custom actions belong to the milestone that creates each view. **Compressed:** stated once in a sentence above the §3 table rather than repeated as a clause in nine cells. M9 audits; it does not implement. |
| S12 | 03 | should-fix | The 500-task budget is first measured after every view that spends it | accept-modified | Measured **in `2c` and `6a`**, with M9 re-measuring on the full app plus cold launch. **Reject** the nightly perf CI job — hosted-runner numbers are machine-dependent and would only catch a collapse. |
| S13 | 03 | should-fix | §6 names six risks and omits eleven, including the unrecoverable one | accept-modified | Replace §6, but at **~13 rows, not 17**: the two free-signing rows merge, the read-path / executor / perf rows merge into one "the 500-task budget is decided at M0" row, and "the human-screenshot round trip is the real schedule" moves to §5 as prose, where it is advice rather than a risk anything retires. |
| W8 | 04 | should-fix | CI never builds the two things that ship | accept | The highest-value new gate in the four reviews. SwiftPM cannot build Xcode targets, so `App/` and `Widget/` are compiled by nobody between M0 and the first tag. Add `xcodebuild … CODE_SIGNING_ALLOWED=NO build` for both schemes on every PR. |
| W9 | 04 | should-fix | Nine of ten "Done when" cells are deliverable lists, not gates | accept | Adopted in spirit throughout §3, plus a §3.1 exit checklist and a sentence after the table: a clause that names neither a command nor a numbered screenshot is a bug in the plan — report it rather than interpreting it. |
| W10 | 04 | should-fix | Interpretations of `SPEC.md` have nowhere to go | accept | `docs/interpretations.md` with a fixed six-column shape, added during the milestone and folded into `SPEC.md` in the same PR. `CLAUDE.md` already demands this; nothing gave it a destination. |
| W11 | 04 | should-fix | The diff-size rule fires after the damage | accept-modified | Merged with S1 (budget production lines) and the pre-declared lettered split. **Conflict C7:** where 04's proposed boundaries differ from 03's, 03's win — it did the size audit that produced them. |
| W12 | 04 | should-fix | §7 tells the human to expect one question, training the agent not to ask | accept | Rewritten: expect the exit checklist first, expect the signing spike flagged as unsettleable alone, and expect at least the bundle prefix, the placeholder icon and the CI toolchain as questions. A milestone that opens with no questions on a spec this size resolved its ambiguities silently. |
| W13 | 04 | should-fix | "Match `today.png` spacing" has no checkable outcome, against files that may not exist | accept-modified | Mockups are an input Claude reads values *out of*, and the comparison is a specific verdict in the screenshot round ("matches `today.png` except the carry badge sits 4 pt low"), never a "Done when" cell. **Reject** the CI branch gate. |

### 3.3 Nits (15)

| ID | Rev | Sev | Summary | Verdict | Edit / reason |
|---|---|---|---|---|---|
| F23 | 01 | nit | Haptics dropped from the Feedback service | accept | One clause in M8: a `Feedback` service plays the completion sound (off by default) and fires an alignment haptic, both routed through the theme so `TestTheme` silences them. |
| F24 | 01 | nit | `wallpaper` and `stickers` unconsumed; `wallpaper` has no dark value; no About screen | needs-human-decision | The mechanical half — a test that every token group is read by at least one view — is folded into M8 either way. The finding's substance is two authorship calls I will not make: → **D4** (wallpaper's missing dark value vs `SPEC.md:450`) and **D5** (the pink star's About screen, which `SPEC.md` does not have). |
| F25 | 01 | nit | M0's spike gate passes without running the spike | accept | Merged into the M0 row with 02/F5 and 03/S2. The disjunction is deleted: the gate is that all three results exist in writing, not that any of them is yes. |
| F26 | 01 | nit | `CLAUDE.md` documents `scripts/release.sh`, absent from §1's tree | accept | Add `scripts/release.sh` to the tree and to M0's "Done when" — otherwise its first invocation ever is at M9, on a tag, in CI. |
| F27 | 01 | nit | The Dock-icon stretch goal is neither assigned nor explicitly cut | needs-human-decision | `SPEC.md:391` routes this to the design phase, so it is a product call, not a plan defect → **D6**. Whichever way it goes, M8's cell says the decision is *recorded* in `SPEC.md` so the next reader does not re-open it. |
| F28 | 01 | nit | "Text never truncates without a way to read it in full" has no owner | accept | `2b`/`2c`: the full title is reachable as tooltip and VoiceOver label, snapshot-tested at 360 pt with a 200-character, an emoji and an RTL title. At 360 pt a 200-character title *must* truncate, so this needs a deliberate affordance, not a wish. |
| F15 | 02 | nit | The clock closure and the Swift language mode are unstated | accept | §0 rule 4: `now: @Sendable () -> Date` and `timeZone: @Sendable () -> TimeZone`; M0 pins **Swift 6 language mode** in both `Package.swift` files and the xcconfig, so M1 cannot quietly downgrade to Swift 5 to silence a concurrency error. |
| F16 | 02 | nit | "Neutral" is defined by task count, but an unopened day looks like a failure | needs-human-decision | The reviewer identifies it as a product question itself, and it is → **D3**. Cheap to state now, a rewrite of `StreakCalculator` and its tests after `1b`. |
| F17 | 02 | nit | CI needs a macOS 26 runner and an explicit Xcode 26 toolchain | accept | One comment line on §1's `ci.yml` entry plus a clause in M0 — otherwise the first red CI is "fixed" by lowering the deployment target. |
| S14 | 03 | nit | §4's "M2–M5" is wrong in six of eleven rows under the new order | accept | Replace the sentence with the per-component milestone mapping, and add the `Nav` and `TaskDetail` rows. |
| S15 | 03 | nit | "Each ends in something that runs" is false for four rows | accept | Say which rows end in a `swift test` run (`1a`, `1b`, `1c`, `6b`) and which end in decision records (`0`), so the human knows which PRs will stop and ask for eyes. |
| S16 | 03 | nit | §7 budgets M0 and the design export as one day | accept | Retitle and reframe §7: M0 is the only milestone whose output is mostly decisions, and seven dependency edges start there. |
| W14 | 04 | nit | No documented way to update a snapshot baseline legitimately | accept | Re-record only with `SNAPSHOT_RECORD=1`, which CI never sets, and only in a commit that changes nothing else so the visual diff is reviewable alone. Otherwise the fastest fix is deleting baselines, which leaves no trace. |
| W15 | 04 | nit | Nothing says CI must be green before a milestone merges | accept | One clause: `main` is protected; the checks job passes and the exit checklist has no fail or not-run line before merge; a milestone that needs a gate relaxed changes the gate in its own PR. |
| W16 | 04 | nit | `CLAUDE.md`'s command list omits every script the plan depends on | **reject** | Right problem, wrong document and wrong time. This is an edit to `CLAUDE.md`, which is not in scope for a `PLAN.md` revision and which `CLAUDE.md` itself gates on you. It also front-runs reality: none of those scripts exists yet, so the commands would be dead text on every run until `2a`. The substance survives inside W1's never-without-asking list and the PR-creates-the-script convention — when `2a` writes `lint-theme.sh`, that PR proposes the `CLAUDE.md` line for it. |

**Tally.** 25 blockers: 15 accept, 10 accept-modified. 37 should-fix: 22 accept, 15 accept-modified.
15 nits: 11 accept, 0 accept-modified, 1 reject, 3 needs-human-decision.
**Totals: 48 accept · 25 accept-modified · 1 reject · 3 needs-human-decision = 77.**

Only one finding is rejected outright, because all four reviewers found real problems — the
disagreements are almost never about *whether*, they are about *how much*. The judgment therefore
lives in the 25 modifications and in §7, which rejects seven pieces of proposed machinery: roughly
half the new process by volume, including the token-contract suite, the probe themes, eight of the
fifteen CI gates and the screenshot harness.

---

## 4. Conflicts found

Eleven places where two reviewers proposed incompatible edits to the same line. Each resolved one
way; neither view is carried into `PLAN.md` alongside the other.

| # | Where | 01/02 says | 03/04 says | Resolution |
|---|---|---|---|---|
| **C1** | §2 `RecurrenceRule` | 01/F5: `.onWeekdays(Set<Weekday>)`, `.everyNDays(Int)`, anchor from the template | 02/F13: `.weekly(Set<Weekday>)` + static `.weekdays`, keeps `.everyNDays(n, from: Day)` | **Split.** Take 02's naming — `.weekly` is honest and a static convenience avoids inventing a case name. Take 01's anchor — `SPEC.md:306` counts from the last *generated* instance, which lives on the template (`lastGeneratedDay`, `SPEC.md:538`); baking it into the rule makes a resumed template fire a catch-up burst that `SPEC.md:95` forbids. |
| **C2** | Widget fallback if App Group access is denied | 02: `snapshotForWidget` is "also the fallback if the App Group route dies: a snapshot file the widget reads" | 03: there is no fallback — a sandboxed extension with no group container has no shared path to read | **03 wins.** The reasoning is sound and 03 flagged the disagreement itself. `snapshotForWidget` stays as the right *method shape* (a `Sendable` value for the timeline) but is not a signing fallback. §6's risk row says so, because `PLAN.md:137` currently reads as though a source build always gets a widget. |
| **C3** | What `TestTheme` returns for the motion hooks | 01/F14: `.none` for all eight, so a missing hook shows as an unanimated diff | 04: `.linear(duration: 1)` for `TestTheme`, `.none` for a Reduce-Motion theme | **04 wins.** `design/SageLilyTheme.swift` already ships `.linear(duration: 1)`, and `.none` would make the two-theme comparison differ for an uninteresting reason while conflating "hook missing" with "Reduce Motion on". |
| **C4** | How the no-literal rule is enforced | 01 leans on two-theme snapshots throughout (and §6's L139 row) | 04/W2 proves self-recorded baselines enforce nothing | **04 wins on the mechanism.** Snapshots are relabelled a regression gate; a syntactic lint plus a "`TestTheme` differs in every token group" requirement does the enforcing. 01's findings that *relied* on the snapshot suite (F13, F17) keep their scope but point at the lint instead. |
| **C5** | Where the fonts live and how they are tested | 01/F18: `App/Fonts/` + `ATSApplicationFontsPath` + a `DailyUI` test asserting `NSFont` resolves | 04/W4: that test cannot pass — registration is app-bundle-only; fonts must be a `DailyUI` package resource | **04 wins.** Mechanically correct, and it is the difference between a gate and a gate that always fails. `App/Fonts` references the same files so the two cannot diverge. |
| **C6** | Which milestone owns the widget | 01/F1 re-homes acceptance rows 663/666 "→ M7" | 03/S3 moves the widget to position 4 | **03 wins**, and 01's milestone references are remapped. Every "M*n*" in an accepted 01 or 02 finding is renumbered to the new order; I will not leave two numbering schemes in one document. |
| **C7** | How M2, M5 and M6 split | 04/W11: M2a/M2b, M5a/M5b, M6a/M6b (two-way each, different content) | 03/S4, S7: 2a–2d, 6a–6b, 7a–7c | **03 wins.** 03 produced a line-by-line size audit; 04 proposed splits by intuition, and its M2 two-way split leaves an ~1,800-line half. |
| **C8** | When the screenshot round happens | 01: silent; `PLAN.md` says "after each UI milestone" | 04/W6: when tests and lint are green, before the PR is written | **04 wins.** "After" guarantees findings arrive with no budget left, which is exactly how M8 becomes the rewrite `PLAN.md:91` promises it is not. |
| **C9** | What M0 must produce | 03/S10: six spikes, a second Mac, wall-clock waits, decision records | 04: additionally `lint-theme.sh`, `coverage.sh`, `shots.sh`, `acceptance-map.sh`, fixtures and 15 CI gates, all in M0 | **Split.** M0 gets the spikes, the scaffolding CI, the release script and the mockups. The theme lint is created in `2a`, the fixtures and capture in `2c` — the milestone that first needs each. Building `shots.sh` in M0 is building a screenshot harness before there is a view to screenshot. |
| **C10** | `design/mockups/` | 01/F10 and 03/S9: move it into M0's "Done when" | 04/W13: plus a CI gate that fails the `m8-design` branch if the PNGs are missing | **01/03 win.** Once M0 commits the four PNGs, a branch-name-conditional CI job defends against a file being deleted — a failure mode that has never happened and would be obvious. |
| **C11** | The floating-icon keep-or-cut decision | 01/F2: move it to `SPEC.md`'s "Still open" list | — | **Partly moot.** It is already there ("Keep or cut the floating icon after trying it in milestone 6"). The edit is one-sided: remove it from `PLAN.md`'s gate; add nothing to `SPEC.md` beyond updating the milestone number. |

---

## 5. Uncertain claims not being asserted

`review/02` graded its own verdicts, and `review/03` tagged the re-cuts that rest on them. I followed
each chain. Where it bottoms out in "uncertain — needs a spike", `PLAN.md` will carry the open
question and the spike, and will not state the conclusion as fact.

| # | Claim | Confidence at source | What `PLAN.md` would have said | What it will say instead |
|---|---|---|---|---|
| **U1** | A widget can read an App Group container under a **free Personal Team** with a Team-ID-prefixed identifier | 02/B1: "**likely works**" — untested | 03's `4a` row: "Gated on E1 = true", and its risk table treats the answer as known | M0 runs the spike and records three results in `docs/m0-signing.md`. The widget row states it is gated on that record. The *consequence* of a negative result is **D1**, signed off by the human in advance, not assumed by me. What **is** asserted (high confidence, sourced, and independently true of the spike): the identifier must be Team-ID-prefixed, denial to an extension is silent, and CI's ad-hoc build cannot satisfy the rule. |
| **U2** | A SwiftUI `@Query` does not reliably observe a save made on a background/actor `ModelContext` | 02/B2: explicitly **not asserted** ("I will not assert it") | 03's `2c` row: "if that document says `@Query` cannot be trusted … views consume `Sendable` snapshots" — already hedged, but its edge table treats the read path as decided at M0 | §2 gains an **open question** bullet: *the view read path is undecided; the M0 spike settles `@Query` vs. `Store`-vended `Sendable` snapshots, and `2c` is written against whichever it records.* What **is** asserted (certain): `@Model` is not `Sendable` and never crosses the actor boundary, so `Store` takes and returns value types either way. That constraint holds under both answers, so it can be a rule now. |
| **U3** | macOS 26's Accessibility ▸ Display text size moves anything for a third-party app | 02/B5: the *absence* of Dynamic Type is certain; whether the macOS 26 control does anything is **uncertain** (needs a human at a screen) | 03's `2a` row: "`typeScale` and its Settings-backed control are decided in this PR" — asserts a nineteenth setting into existence | §6's risk row states the certain half: macOS has no Dynamic Type, `relativeTo:` scales against nothing, and the current "check Larger Text in M2" passes by looking unchanged. The spike is named. Whether the app grows its own text-size control is **D2**. |
| **U4** | A single `ModelContext.save()` is atomic across a crash | 02/B3: the `transaction(_:)` no-rollback claim is sourced and confident; "crash before the save persists nothing" is an **inference** from Core Data behaviour | 03's `1c` row and risk table state the atomicity as the design's guarantee | The design (scratch context, `autosaveEnabled = false`, one `save()`, `rollback()` on error, never `transaction(_:)`) is asserted — it is right under either answer. The *guarantee* that satisfies `SPEC.md:629` is verified by the M0 spike and re-checked live in `3a`; `PLAN.md` names the check rather than claiming the property. |
| **U5** | `SMAppService.register()` and `requestAuthorization` fail for an ad-hoc build in `~/Downloads` | 02/F11: "**reports suggest**" — uncertain | 03's `7b` row: "with a Settings affordance and a README step if it requires `/Applications`" — conditional, which is correct | Kept conditional, and the condition is named: the spike result in M0 decides whether `7b` ships those affordances at all. `PLAN.md` does not budget work for a failure nobody has observed. |
| **U6** | The Mac desktop's widget rendering modes are `.fullColor` and `.vibrant` | 02/F10: "likely"; the underlying point (that "tinted and clear" is iOS vocabulary) is stronger | 03's `4a` row names both values as fact | The row requires legibility in **both rendering modes the Mac desktop produces**, reads them from `\.widgetRenderingMode`, and has the widget PR record which values it actually observed. |
| **U7** | There is no snapshot-file fallback if group access is denied | 03's own conclusion, contradicting 02 (conflict C2) | Stated flatly | Stated, but attributed as a consequence to confirm in the spike: the spike report answers "is there any location the app can write and the extension can read" as an explicit line, so the fallback question is closed by evidence rather than by either reviewer's reasoning. |

---

## 6. Edit plan for `PLAN.md`

Section by section. Line deltas are estimates; the projected total is at the bottom.

**§0 Ground rules (L6–19) — +9 lines, 14 → 23.**
Rule 2 gains stroke widths, opacities, shadows and materials, and the sentence "if a value has no
token, the missing token is the bug". Rule 3 is corrected: the actor serialises one process; the app
is the only writer and the widget is read-only. Rule 4 gains `@Sendable` and the injected time zone.
Rule 5 gains the fixtures and the "round happens when tests and lint are green" timing. New rule 6:
`main` is protected and a milestone closes only on a clean exit checklist.

**§1 Repository layout (L21–49) — +9 lines, 29 → 38.**
Add `scripts/release.sh`, `scripts/lint-theme.sh`, `docs/` (spike records and
`docs/interpretations.md`), `Packages/DailyUI/Sources/DailyUI/Resources/Fonts/`, and
`Tests/DailyUITests/__Snapshots__/<arch>/`. Rewrite two comments: the xcconfig line gains
`APP_GROUP = $(DEVELOPMENT_TEAM).$(BUNDLE_PREFIX)` and the build-fails-when-blank note; the `ci.yml`
line gains `runs-on: macos-26`, the explicit toolchain, and the app + widget compile.

**§2 Core design decisions (L51–71) — +16 lines, 21 → 37.**
Rewrite six of seven bullets (logical date with the wall-clock rule and the inverse; rollover with
the scratch-context commit; streaks pending D3; recurrence per conflict C1; store as `@ModelActor`
with value types, read-only widget and the debounced reload moved to the app target; undo as
`InverseAction`). Add four bullets: **Settings** (the eighteen controls), **Schema** (`SchemaV1` and
the migration plan), **Theme surface** (the full token group list including stroke, opacity, shadow,
materials), and **Open question: the view read path** with its spike.

**§3 Milestones (L73–91) — +14 lines, 19 → 33.**
The table goes from 10 rows to **20** (0 · 1a-1c · 2a-2d · 3a-3b · 4 widget · 5a-5b · 6a-6b ·
7a-7c · 8 · 9), with the widget at position 4 and `2a` marked startable in parallel with M1. Cells
become gates rather than noun lists, so the rows are long but the row count is what drives line
count. Two sentences above the table (which rows end in a test run and which need eyes; the
per-milestone VoiceOver rule stated once instead of nine times), and one paragraph added to the two
that follow it.

**§3.1 Exit checklist (new) — +13 lines.**
The PR-body block: the gates with real output pasted, one line per "Done when" clause marked
pass/fail/not-run, the screenshot round, the paperwork, and the handback rule that any fail or
not-run is named in the first sentence.

**§4 Component library (L93–111) — +7 lines, 19 → 26.**
Replace the "M2–M5" sentence with the per-component milestone mapping. Add the sentence about
`CLAUDE.md`'s six universal states. Add `Nav` and `TaskDetail` rows. Add the one-sentence preview-
enumeration rule. Replace the two-line enforcement claim (L110–111) with the corrected four-line
version: lint enforces, snapshots detect regressions, the human judges token choice.

**§5 Working with Claude Code (L113–131) — +20 lines, 19 → 39.**
The preamble grows from 5 lines to ~16 (scope, checklist-first, precedence, `BLOCKED` format,
never-without-asking, ordered handback). Three 3-line addenda. The habits list is rewritten: M1 with
`2a` alongside it, the screenshot-round discipline, mockups as input, the interpretations file, the
production-line PR budget with the split pre-declared.

**§6 Risks (L133–142) — +8 lines, 10 → 18.**
Six rows become **13**. Four existing rows are replaced because their mitigations cannot work
(Dynamic Type, repeating notification content), point at a test the defect survives (DST), or land
six milestones late (500-task perf). New rows: schema versioning (unrecoverable after 1.0),
cross-process staleness, CI has no signing identity, crash mid-rollover, undo across a rollover,
settings storage, free-signing runtime collisions, theme-layer leaks (re-pointed at the lint),
mockups.

**§7 Starting (L144–151) — +4 lines, 8 → 12.**
Retitled. Lists what M0's spikes need and cannot fake, sets the expectation that the agent asks
questions, and moves the mockups and fonts out of the to-do list and into M0's gate.

> **Projected total: ~151 → ~255 lines (+69%).**
> §3's cells carry most of the new weight and they are the point: they are where "done" stops being
> the agent's opinion. If the draft exceeds ~265 I will compress §5's addenda and §3.1 first, since
> both restate things `CLAUDE.md` already says, and I will not compress §2 or §6, which are where the
> factual corrections live. The register stays as it is — numbered sections, terse tables, no
> hedging, one person's voice.

---

## 7. Scope rejected, with rationale

The four reviewers each optimised one lens and collectively proposed a 14-rule lint script, a
token-declaring preview catalog, a resolver-indirection theme rewrite, two synthetic probe themes, a
scripted screenshot harness, 15 CI gates, 21 PRs and a three-page prompt library — for a free,
local-only, single-developer hobby app that has not yet compiled a line of Swift. Individually most
are defensible. Together they are a process built on speculation, before M2 ships a single view.
What I am not doing, and why:

**R1 — The 15-gate CI set, cut to 7.**
Keeping: core tests, UI tests, coverage on the two named files, theme lint, **the app and widget
xcodebuild** (04/W8 — the one genuinely missing gate; SwiftPM never compiles what ships), the
no-network grep (it defends a headline product promise in one line), and the release zip actually
launching. Cutting: the `theme-lint:allow` budget counter, the token-contract and probe suites (R2),
the separate preview-completeness and font-registration jobs (fold into the UI test run), the
acceptance-map script (the `_specNNN` naming convention is free; a script to check it is not), the
changelog grep (`CLAUDE.md` already says it and a solo author does not need CI to enforce his own
notes), the M8 branch-name precondition (C10), and the nightly perf job (machine-dependent, catches
only a collapse). XCUITest smoke moves to nightly and tags: a flaky required check is how gates get
disabled, and then all of them are.

**R2 — The token-contract mechanism: `RecordingTheme`, per-entry declared token sets, the sentinel
palette and the metric-bump probes.**
The diagnosis behind these (04/W2) is correct and I have accepted it. The cure is not proportionate.
It requires rewriting every token in `design/SageLilyTheme.swift` from a stored value to a computed
property over a resolver closure — restructuring the theme layer before a single view exists, to
support a test that then demands every component declare and maintain an exact allowlist of the
tokens it may read. Every legitimate refactor thereafter breaks that allowlist, so it becomes
ten `// theme-lint:allow`-shaped exemptions by M5. `scripts/lint-theme.sh` catches the same leaks
syntactically, in milliseconds, with no architectural commitment, and the "`TestTheme` must differ in
every token group" rule catches the rest. If the lint proves insufficient during M2, the token
contract is still available — and by then there will be evidence for it. Building it now is
speculative tooling on the critical path.

**R3 — `scripts/shots.sh` as specified.**
Accepted: the fixtures (`-ToDewFixture`, `-ToDewNow`). They are load-bearing — without them the
states that break layouts are the states nobody ever looks at, and the plan's own quality bar is
decorative. Rejected: the scripted capture apparatus around them — osascript appearance toggling, a
one-time Accessibility grant, per-milestone shot lists of 20 and 28 files, contact sheets, a
`manifest.txt` with a token attributed to each frame, and a formal two-round verdict protocol with
`UNJUDGEABLE` as a reserved word. The human is one person with a Mac. "Run the app with these four
fixtures, at 360 and at 720, light and dark, and drag the folder in" is the same instruction without
a harness to maintain, and each UI row's "Done when" naming its shots gets the batching benefit that
mattered. If the manual round proves painful at `2b`, write the script then.

**R4 — Review 04's §1 as `PLAN.md` §5 verbatim.**
~55 lines of prompt library, including a worked example of a screenshot request. Taking the
substance (precedence, `BLOCKED`, never-without-asking, checklist-first) at ~28 lines keeps §5 in
proportion to the rest of the document. Much of the rejected remainder restates `CLAUDE.md`, which
Claude Code reads on every run anyway; duplicating rules across two files is how they drift.

**R5 — The 21st PR, and the M9 accessibility clause repeated nine times.**
Merging `4a`/`4b` into one widget row (~1,100 lines, 1.4× budget) gives 20 PRs instead of 21: the
widget is already the row most likely to be cut wholesale, so splitting it to make half of it
separately cuttable is a distinction without a difference. And S11's clause appended to nine cells is
the same sentence nine times; it goes above the table once. Both are small, and both are the kind of
thing that makes a plan read like a merged review instead of one person's document.

**R6 — Pre-writing the whole verification apparatus in M0.**
04 puts `lint-theme.sh`, `coverage.sh`, `shots.sh`, `acceptance-map.sh`, the fixtures and 15 gates in
M0. M0 already has six spikes, a second Mac, two wall-clock waits and seven outbound dependency
edges — it is the node in this plan most likely to be deferred, and deferring it is the single most
expensive thing that can happen here. Every tool goes into the milestone that first needs it: the
lint in `2a`, the fixtures in `2c`, the coverage gate in `1b`. M0 builds the scaffold, runs the
spikes, and closes.

**R7 — Deciding D1–D6 myself.**
Six findings propose changing what the product *is* — whether the widget survives a failed spike,
whether a nineteenth setting exists, whether an absence breaks a streak, whether there is an About
screen, whether the Dock icon reflects the day, whether the wallpaper gets a dark value. Reviewers
are entitled to surface those; an integrator is not entitled to settle them. They are in §2 as
either/ors with recommendations, and `PLAN.md` will not be edited on any of them until you answer.

---

*End of adjudication. No edit to `PLAN.md` has been made or staged.*
