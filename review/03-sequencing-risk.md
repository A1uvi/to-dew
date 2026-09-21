# 03 — Sequencing and risk review of `PLAN.md`

Reviewer: `sequencer`. Lens: what blocks what, what is on the critical path, how big each milestone
actually is, and which risks are retired by nothing.

**Inputs.** `PLAN.md`, `SPEC.md`, `CLAUDE.md`, and both teammate reviews read in full:
`review/01-spec-coverage.md` (`spec-auditor`) and `review/02-feasibility.md` (`platform-critic`).
`review/04-agent-workability.md` did not exist when I wrote this.

**Load-bearing assumptions.** Several of my re-cuts are downstream of a teammate's factual claim
rather than of anything I verified myself. Each is tagged inline as
**[depends on: 02/B1]**, **[depends on: 01/#2]**, and so on. If the integrator disbelieves one of
those claims, the re-cut it supports should be reverted with it.

**Counts.** 6 blockers, 7 should-fix, 3 nits. 10 milestones retained; 21 pull requests.

---

## 1. Dependency graph

### 1.1 What `PLAN.md` currently implies

`PLAN.md` §3 (L77–88) is a table of ten rows in numeric order with no stated edges at all. Read
literally it is a **pure chain**: M0 → M1 → … → M9, ten nodes, nine edges, zero parallelism and
zero slack. That is the first sequencing problem — a plan with no declared edges cannot tell you
which slip is expensive and which is free, so every slip gets treated the same way.

### 1.2 What the edges actually are

Below, edges are drawn against my **revised** cut (§5). Node names use the revised numbering;
`§5` gives the mapping from the old numbers. Dotted edges are the ones `PLAN.md` does not show and
that my teammates' findings create.

```mermaid
graph TD
  M0["M0 scaffold + 6 spikes<br/>(S1 signing, S2 read path, S3 durability,<br/>S4 executor, S5/S7 free-signing, S6 text size)"]

  M1a["M1a Day / DayClock / SchemaV1 /<br/>@Model entities / Settings struct"]
  M1b["M1b QuickEntryParser /<br/>RecurrenceEngine / Streaks / Stats"]
  M1c["M1c Store @ModelActor /<br/>RolloverEngine + preview / InverseAction"]

  M2a["M2a Theme protocol + 2 themes +<br/>fonts + String Catalog + snapshot harness"]
  M2b["M2b TaskRow / ProgressRing /<br/>DayHeader / EmptyState"]
  M2c["M2c Today view + persistence + window"]
  M2d["M2d EntryField / TaskDetail /<br/>mutations + undo + keys"]

  M3a["M3a Live rollover + triggers"]
  M3b["M3b Morning review"]

  M4a["M4a Widget views + timeline"]
  M4b["M4b Widget App Intents"]

  M5a["M5a Nav + Upcoming"]
  M5b["M5b Someday + Recurring"]

  M6a["M6a History + stats tiles"]
  M6b["M6b Export / import / prune"]

  M7a["M7a Settings window"]
  M7b["M7b Notifications + Dock + login"]
  M7c["M7c Floating icon (droppable)"]

  M8["M8 Visual design pass"]
  M9["M9 Release"]

  M0 --> M1a
  M0 --> M2a
  M1a --> M1b
  M1a --> M1c
  M1b --> M1c
  M1a -.->|Settings struct 01/#3| M7a
  M1a -.->|Settings struct 01/#3| M4a
  M1c -.->|preview(for:) 02/B4| M7b
  M1c -.->|preview(for:) 02/B4| M4a
  M1c -.->|InverseAction value 02/B6| M2d
  M1c -.->|undo-stack clear at commit 02/B6| M3a
  M0 -.->|S2 read path 02/B2| M2c
  M0 -.->|S1 E1 gates the widget 02/B1| M4a
  M0 -.->|S6 typeScale 02/B5| M2a
  M0 -.->|S3 durability 02/B3| M1c
  M0 -.->|S4 executor 02/B2| M1c
  M0 -.->|S5/S7 02/F11| M7b
  M0 -.->|S8 intent process 02/B6| M4b

  M1c --> M2c
  M2a --> M2b --> M2c --> M2d
  M2b --> M4a
  M2d --> M3a --> M3b
  M3a --> M4a
  M2d --> M5a --> M5b
  M2a --> M5a
  M5a --> M6a --> M6b
  M1b --> M6a
  M5a --> M7a
  M7a --> M7b
  M4a --> M4b
  M2a --> M7c
  M3b --> M8
  M4b --> M8
  M5b --> M8
  M6b --> M8
  M7b --> M8
  M8 --> M9
```

### 1.3 Edge table

`new` marks an edge `PLAN.md` does not show today.

| From | To | Why | New? |
|---|---|---|---|
| M0 (S1/E1) | M4a widget | If the widget cannot read the App Group container under a free Personal Team, the whole widget milestone is cut, not degraded **[depends on: 02/B1]** | new |
| M0 (S2) | M2c Today | The view read path (`@Query` vs. Store-vended `Sendable` snapshots) sets every view signature in M2–M7 **[depends on: 02/B2]** | new |
| M0 (S3) | M1c rollover | "One transaction" must be replaced by scratch-context + single `save()` **before** M1 writes its durability tests **[depends on: 02/B3]** | new |
| M0 (S4) | M1c Store | `@ModelActor` inherits its executor from the construction context; built on the main actor it puts all store work on the main thread and fails the 500-task bar with no visible cause **[depends on: 02/B2]** | new |
| M0 (S6) | M2a Theme | macOS has no Dynamic Type, so `Theme` needs its own `typeScale`; deciding after the components exist means editing all of them and their baselines **[depends on: 02/B5]** | new |
| M0 (S5/S7) | M7b | Notification authorization and `SMAppService` both care about signature and bundle location; the target user's app is ad-hoc in `~/Downloads` **[depends on: 02/F11]** | new |
| M0 (S8) | M4b | Which process runs the widget's App Intent decides whether widget mutations can be undoable at all **[depends on: 02/B6]** | new |
| M1a | M2c, M4a, M7a | The `Settings` struct is the storage home for all 18 controls; without it M7a scatters `@AppStorage` the widget cannot read **[depends on: 01/#1, 01/F3]** | new |
| M1a | everything downstream | `SchemaV1` + `SchemaMigrationPlan` must exist before the first store is created; it cannot be retrofitted **[depends on: 01/#2, 01/F6]** | new |
| M1b | M1c | Rollover generates recurring instances, so `RecurrenceEngine` precedes `RolloverEngine` | implicit |
| M1b | M6a | The six statistics are pure `DayRecord` logic; the tiles that render them are not | new |
| M1c | M2d | Every mutation's inverse is a `Sendable` value the app layer turns into an `UndoManager` registration; the Store method signatures carry it **[depends on: 02/B6]** | new |
| M1c | M3a | The undo stack must be cleared in the same place rollover commits, or ⌘Z after 06:00 desynchronises a frozen `DayRecord` **[depends on: 02/B6.3]** | new |
| M1c | M4a, M7b | `RolloverEngine.preview(for:)` is the one function both the widget timeline and the notification queue need **[depends on: 02/B4]** | new |
| M2a | M2b, M2c, M2d, M5a, M7c, M8 | Nothing that draws can be written before the token protocol exists | implicit |
| M2a | M8 | Motion hooks and `materials` declared in M2a is what makes M8 "polish, not a rewrite" (L90–91) **[depends on: 01/F14, 01/F17]** | new |
| M2b | M4a | The widget reuses `Checkbox` and `ProgressRing` at widget size | new |
| M2d | M3b | The review reuses `TaskRow`, the detail inspector and the undo bridge | implicit |
| M2d | M5a | `Cmd T` / `Cmd Shift S` / `Cmd 1–5` are declared disabled in M2d and go live in M5a **[depends on: 01/F4]** | new |
| M3a | M4a | Acceptance row SPEC 666 (widget flips at 06:00 with the app closed) needs a real rollover path | new |
| M5a | M6a, M7a | `Nav` is the only route to History and the only target for `Cmd 1–5`; without it M6a is unreachable UI **[depends on: 01/#11, 01/F15]** | new |
| M7a | M7b | Notification settings, badge mode and nudge time live in the Settings window | implicit |
| all | M8 → M9 | Design pass then release | shown |

### 1.4 Edges that do **not** exist, and matter

- **M4 (widget) does not depend on M5, M6 or M7.** It needs M0/E1, M1a, M1c, M2a, M2b and M3a, and
  nothing else. In `PLAN.md` it sits at position 7, behind the planning views, history, and a
  milestone containing a seven-day wall-clock wait (L85). That is the single worst-placed node in
  the plan (finding S3).
- **M2a (theme layer) does not depend on M1 at all.** It is pure `DailyUI`. `PLAN.md:125` ("M1
  first and alone") forbids the one genuine parallelism the plan has (finding S6).
- **M7c (floating icon) has no dependents.** Deleting it is a revert, not a refactor — which is
  exactly why it must not be bundled with Settings and notifications in one row.

---

## 2. Critical path, and where this plan actually slips

### 2.1 The path

```
M0 → M1a → M1b → M1c → M2c → M2d → M3a → M3b → M5a → M6a → M7a → M7b → M8 → M9
```

with `M2a → M2b → M2c` running as a second strand that joins at M2c, and M4a/M4b, M5b, M6b, M7c
hanging off to the side. 14 of the 21 pull requests are on the path. In production-line terms
(§4) the path carries roughly **10,900 of the ~13,600 lines**.

The path is long because the plan is a chain by construction: every UI milestone extends the same
window, so each one needs the previous one's views to exist. The only two real off-path strands
are the theme layer (M2a/M2b, which can start the day M0 closes) and the widget (M4a/M4b, which
can start the day M3a closes).

### 2.2 Where it actually slips — five honest answers

1. **M2.** It is ~3,000 lines of production Swift in one table row (L81), it sits on the critical
   path, and everything after it is serial behind it. It also contains both of the decisions that
   `platform-critic` says are design decisions masquerading as checks — the read path (B2) and the
   type scale (B5). If those are wrong, the rework lands *on* the critical path, *after* seven
   components and their snapshot baselines exist. This is the milestone that will slip, and it
   will slip by more than any other because it slips twice: once for size, once for rework.

2. **The human gate, which is budgeted at zero.** `PLAN.md:18–19` and L126 make a
   build-run-screenshot round trip mandatory after every UI milestone. In my cut that is 13 of 21
   PRs. The plan contains no estimate for this and no batching strategy, so the real schedule is
   not measured in diff but in how often the human is at a Mac. Mitigation in §5: each UI row's
   "Done when" names the exact screenshots to paste, so one round trip closes one PR instead of
   three.

3. **M0, which is written as a day and is not one.** `PLAN.md:144–150` ("First three things to do
   today") puts M0 and the mockup export in one day. M0 as it must actually be scoped needs a
   **second Mac** that is not registered to the builder's account (S1/E3), two spikes with
   wall-clock waits (S5 needs a delivered notification; S3 needs a kill-and-reopen harness), and a
   human at a screen for S6. None of those are in the plan. M0 slipping is cheap in lines and
   expensive in position, because seven downstream edges start there.

4. **M7 (notifications/Dock/Settings, was M6).** It is where the free-signing route collides with
   the OS twice **[depends on: 02/F11]**. If `SMAppService.register()` or
   `requestAuthorization` fails for an ad-hoc build in `~/Downloads`, the milestone's deliverable
   is unachievable *for the app's actual distribution channel* while passing perfectly from Xcode.
   That is discovered late unless S5/S7 run in M0, which is why I moved them there.

5. **Not the widget.** It is the loudest risk in the plan and the cheapest to retire: one spike,
   built once, in M0. Moved to position 4 it costs at most two PRs if it dies, and if E1 is false
   it costs zero because the row is struck before anyone writes it.

### 2.3 What is *not* on the critical path and should be treated as slack

M1b (parser/recurrence/streaks/stats), M2a/M2b (theme and components, if started during M1),
M4a/M4b (widget), M5b, M6b (export/import), M7c (floating icon). Roughly 2,700 lines that can
absorb a delay without moving 1.0.

---

## 3. Verdict on the M0 App Group spike as a gate

> `PLAN.md:79` — "| 0 | `m0-scaffold` | Xcode project, two packages, CI, xcconfig, App Group spike | `swift test` runs empty; Dock icon appears; **widget App Group works or is ruled out under free signing** (decides whether the prebuilt zip ships the widget) |"

**Positioned correctly. Asking the wrong question. Gating the wrong milestone.**

**Position: right.** M0 is the correct place. `SPEC.md:580–583` calls this "the first technical
spike in the milestones" and it is the only binary in the plan that can delete a whole milestone.
Everything about putting it first is correct and should be kept.

**Question: wrong, in two ways.**

*First,* it asks for one boolean where there are three environments. `platform-critic` (B1, F5)
sets out the macOS rule — a process may open an App Group container only via a Mac App Store
deployment, a Team-ID-prefixed identifier, or an embedded provisioning profile — and the
consequence that an extension denied access is denied **silently**. That produces three answers:
E1 (Xcode, free Personal Team, Team-ID-prefixed group), E2 (ad-hoc, which is what CI produces),
E3 (a zip of E1 on a second Mac). The gate as written will be answered by running E1, the one
environment that is most likely to work and least likely to matter.

*Second,* the parenthetical — "(decides whether the prebuilt zip ships the widget)" — asks a
question that is **already answered before the spike runs**. CI has no signing identity, so
`scripts/release.sh` ad-hoc signs, so the zip's widget has no Team ID in its signature and neither
rule 2 nor rule 3 can hold **[depends on: 02/B1, the load-bearing claim of this whole section]**.
The plan's own fallback (L137, "zip ships without widget") is therefore the outcome with
probability close to one, and M0 should be *allowed to write that down on day one* rather than
framing it as an open question that a spike will settle.

**Downstream gating: wrong.** The gate as written controls the contents of the release zip — a
one-line switch in a shell script at M9. What it should control is **whether milestone 7 exists at
all**. That is the E1 question, and nothing in `PLAN.md` connects E1 to M7.

**Is M7 at risk of being built and then discarded? Yes — plainly.** Two distinct exposures:

- **If E1 is false, the entire widget milestone is dead, not degraded.** A widget extension is
  sandboxed; without an App Group there is no shared path at all. I want to flag one thing my
  teammate's verdict table implies that I do not think survives: `platform-critic` lists
  `snapshotForWidget` as "also the fallback if the App Group route dies: a snapshot file the widget
  reads." If group access is denied there is **no location** the app can write and the extension
  can read, so there is no snapshot fallback. If E1 is false the answer is "no widget", full stop,
  and `SPEC.md`'s widget section is struck. The plan needs to say so, because "fallback = zip ships
  without widget" (L137) reads as though a source build always gets one.
- **Even if E1 is true, M7 at position 7 is built on an unverified assumption for six milestones.**
  The gate's disjunctive wording ("works **or** is ruled out") is satisfiable by assertion —
  `spec-auditor` makes the same point at F25 — so the plan can pass M0 with nobody having run
  anything, and the discovery moment is M7, when the widget renders empty on someone else's
  machine.

**What should change — three things:**

1. M0's gate emits a written artifact with three booleans and pasted `codesign -d --entitlements -`
   output. No prose disjunction.
2. M0's row carries an explicit kill clause: *if E1 is false, the widget milestone row is deleted
   from §3 and `SPEC.md`'s widget section struck, in the M0 PR.* A gate that cannot delete anything
   is not a gate.
3. The widget moves from position 7 to position 4, directly after live rollover. Its dependencies
   (M0/E1, M1a, M1c, M2a, M2b, M3a) are all satisfied there; it needs nothing from planning,
   history or system; and it carries the plan's only milestone-scale binary risk, which should be
   retired early rather than last.

---

## 4. Size audit against the ~800-line split rule

> `PLAN.md:129` — "- **Short PRs.** If a milestone grows past ~800 lines of diff, split it (e.g. M3a rollover, M3b review)."

### 4.1 The rule is unusable as written

"Lines of diff" counts tests. `PLAN.md:8–10` mandates test-first `DailyCore` with "a full test
suite", and `CLAUDE.md` requires every component preview in six states snapshot-tested under two
themes. For this project tests and previews are roughly 55–60% of the diff. Under a literal
reading, M1 alone is six PRs and M2 is seven, and the plan becomes a list of forty branches nobody
can navigate.

Fixing the rule is the prerequisite for the audit, so it is finding **S1** below. Everything in
this section is measured in **production lines** — Swift that ships in the app — under the
corrected rule.

### 4.2 Estimates

Estimates are per-milestone, from the deliverable text plus the scope `spec-auditor` found homeless
(their item numbers in the last column). "PRs" is my re-cut.

| # (old) | Deliverable | Est. production lines | Over 800? | PRs | Homeless scope folded in |
|---|---|---|---|---|---|
| M0 | Scaffold, CI, xcconfig, release script, spikes | ~350 permanent + ~300 throwaway spike code | no (see note) | 1 | 01/F26 (`scripts/release.sh`), 01/#26 (placeholder icon), 01/F10 (`design/mockups/`) |
| M1 | "`DailyCore` complete with tests" | **~1,970** | **2.5×** | 3 | 01/#1 Settings, 01/#2 schema versioning, 02/B4 `preview(for:)`, 02/B6 `InverseAction` |
| M2 | Theme layer + Today list | **~3,000** | **3.8×** | 4 | 01/#5 String Catalog, 01/#10 window frame, 01/#12 TaskDetail, 01/#13 note links, 01/#14 hide-completed, 01/#15 flag pin, 01/#19 font registration, 01/#22 loading/50 states, 01/#23 truncation, 01/F14 motion hooks, 01/F17 materials, 02/B5 typeScale |
| M3 | Live rollover + morning review | **~1,250** | 1.6× | 2 (the plan already proposes this split) | 01/#27 reopen cutoff, 02/B6.3 undo-stack clear |
| M4 | Upcoming, Someday, Recurring | **~1,400** | 1.75× | 2 | 01/#11 `Nav`, 01/F4 the three deferred shortcuts, 01/#16 instance-vs-template |
| M5 | History + stats + export | **~1,500** (after moving the six stat computations to M1b) | 1.9× | 2 | 01/F21 named stats and round-trip criterion |
| M6 | Notifications, Dock, Settings, floating icon | **~1,670** | 2.1× | 3 | 01/#4 update check, 01/#6–#9 notification behaviours, 01/#28 rollover-change wiring, 01/#29 per-display frame + View menu, 02/B4 rolling queue |
| M7 | Widget | **~1,100** | 1.4× | 2 | 02/F10 rendering modes, 02/F4 cross-process refresh |
| M8 | Final visual pass | ~600 (down from ~1,000 once hooks and materials land in M2a) | no | 1 | 01/#17 haptics, 01/#18 materials, 01/#20 wallpaper, 01/#21 stickers, 01/#25 Dock stretch goal |
| M9 | 1.0 | ~750 (if VoiceOver labels are gated per milestone rather than retrofitted) | no | 1 | 01/#24 XCUITest, 01/#4 update check verification |
| | **Total** | **~13,600** | | **21** | |

**Seven of ten milestones bust the rule** (M1–M7). M0, M8 and M9 do not — and M8 and M9 only stay
under because scope moves *out* of them (motion hooks to M2a, accessibility labels to each UI
milestone), which is itself a sequencing change, not a bookkeeping one.

### 4.3 Note on M0

M0's permanent diff is small. It is listed as "no" but it is the milestone most likely to blow its
*schedule*, for the reasons in §2.2(3). The spike code should live in `spikes/` and be deleted in
the same PR once the decision records are written — it is throwaway and should be exempt from the
budget explicitly, or someone will try to split M0 for the wrong reason.

### 4.4 The arithmetic, stated plainly

~13,600 production lines ÷ 800 = **17 PRs minimum**, and coherent boundaries (never splitting a
component from its previews, never splitting a view from its keyboard handling) push it to 21. The
conclusion is not that the plan should invent more milestones. It is that **`PLAN.md` is a 21-PR
plan presented as a 10-PR plan**, and the gap is where the schedule disappears.

My resolution: keep **10 milestones** — the numbering, the release gates, the human-screenshot
checkpoints and the changelog rhythm all stay — and make the PR split explicit *inside* them as
lettered rows, which is the plan's own `M3a`/`M3b` pattern (L129). Ten milestones, twenty-one
branches, one table.

### 4.5 Re-cuts, with branch names

| Old | New rows | Branch | Est. prod. lines | Why this boundary |
|---|---|---|---|---|
| M1 | 1a | `m1a-model-and-time` | ~650 | `Day`, `DayClock` (+ inverse), `SchemaV1`, the four `@Model` entities, `Sendable` snapshots, the `Settings` struct. Everything that defines a type others import. |
| | 1b | `m1b-engines` | ~570 | `QuickEntryParser`, `RecurrenceEngine`, `StreakCalculator`, the six statistics. Pure functions, no store, testable alone, off the critical path. |
| | 1c | `m1c-store-and-rollover` | ~750 | `@ModelActor Store`, `InverseAction`, `RolloverEngine.run` + `preview`, the durability design. Everything that touches persistence, in one reviewable unit. |
| M2 | 2a | `m2a-theme` | ~800 | `Theme` protocol incl. `materials`, `typeScale` and all eight motion hooks; `SageLilyTheme`; `TestTheme`; font bundling and registration; String Catalog + CI grep; the snapshot harness proved on `Checkbox`. **Startable the day M0 closes, in parallel with M1.** |
| | 2b | `m2b-components` | ~750 | `TaskRow`, `ProgressRing`, `DayHeader`, `EmptyState`, each with its §4 states *and* the six `CLAUDE.md` states. |
| | 2c | `m2c-today` | ~700 | The Today view, the read path from `docs/m0-readpath.md`, sort rules, window frame/min/titlebar, the 500-task scroll budget. |
| | 2d | `m2d-entry-detail-keys` | ~850 | `EntryField`, the `TaskDetail` inspector, the six mutations, the undo/redo bridge, the eight Today-scoped shortcuts. |
| M3 | 3a | `m3a-rollover-live` | ~450 | Lifecycle triggers, the DST-safe timer, undo-stack clearing, debounced widget reloads. |
| | 3b | `m3b-review` | ~850 | `ReviewCard` and the whole review flow. Slightly over budget; splitting it further would separate the card from the screen that is its only caller. |
| M7→4 | 4a | `m4a-widget` | ~650 | Widget target, three sizes, read-only timeline from `preview(for:)`, both Mac rendering modes. |
| | 4b | `m4b-widget-intents` | ~450 | App Intents, the host-process decision, cross-process refresh. Separate because this half can be cut on its own if S8 goes badly. |
| M4→5 | 5a | `m5a-nav-upcoming` | ~800 | `Nav` + the five-view host + `Cmd 1–5` + `Cmd T`, then Upcoming with drag between days. |
| | 5b | `m5b-someday-recurring` | ~800 | Someday + stale marker + `Cmd Shift S`; recurring templates, pause, history row, instance-vs-template semantics; scheduling tokens. |
| M5→6 | 6a | `m6a-history` | ~800 | `CalendarCell`, `StatTile`, heat map, day detail, search, duplicate-to-today, the six tiles. (The stat *computations* moved to M1b.) |
| | 6b | `m6b-data` | ~550 | Export, import, round-trip golden, delete-older-than. Data-shaped work, not view work. |
| M6→7 | 7a | `m7a-settings` | ~700 | The Settings window over M1a's struct; the update-check toggle and its one network call. |
| | 7b | `m7b-notifications-dock` | ~750 | The rolling non-repeating notification queue, the four types with their actions and routing, badge, Dock menu, launch at login. |
| | 7c | `m7c-floating-icon` | ~450 | `NSPanel` + `FloatingIcon`. Its own row **because it is the one feature that may be cut**, and a cut must be a revert. |
| M8 | 8 | `m8-design` | ~600 | Unchanged in kind, smaller in size. |
| M9 | 9 | `m9-release` | ~750 | Audit and packaging, not implementation. |

Two boundaries I hold least confidently and flag for the integrator: **M2b/M2c** (components vs.
the view that hosts them could reasonably be one 1,450-line PR if the reviewer prefers fewer,
larger reviews) and **M3b at 850** (over budget, kept whole deliberately).

---

## 5. Revised §3 — the replacement milestone table

Paste this over `PLAN.md` §3 (L77–88), together with the two paragraphs that follow it.

**Numbers are build order.** Against the current table, the **widget moves from 7 to 4** and
planning, history and system each shift one later; branch names carry the meaning, so
`m5a-nav-upcoming` is the old M4. Lettered rows are separate pull requests inside one milestone
and one human-screenshot checkpoint. Rows 1a–1c and 6b end in a test run; every other lettered row
ends in something on screen and names the screenshots to paste.

| # | Branch | Deliverable | Done when |
|---|---|---|---|
| 0 | `m0-scaffold` | Xcode project, two packages, CI, xcconfig, release script, six decision spikes | `swift test` runs empty on both packages under Xcode 26 on a `macos-26` runner with an explicit `xcode-select`; both packages build in **Swift 6 language mode**; `./scripts/release.sh` produces a launchable `ToDew.zip` locally and from a tag; a placeholder Dock icon appears; `Config/Shared.xcconfig` derives `APP_GROUP = $(DEVELOPMENT_TEAM).$(BUNDLE_PREFIX)` and a run-script phase fails the build with a readable message when `DEVELOPMENT_TEAM` is empty; `design/mockups/{today,review,history,widget}.png` are committed. Six decision records are committed, each with pasted console output: `docs/m0-signing.md` (S1 — three booleans E1 Xcode+free team / E2 ad-hoc as CI builds / E3 zip on a second Mac, with `codesign -d --entitlements -` for each), `docs/m0-readpath.md` (S2 — does `@Query` observe an `@ModelActor` save; does a cross-process write reach the app within 1 s), `docs/m0-durability.md` (S3 — one `save()` across `exit(0)` leaves 0 or 200 changed, never partial), `docs/m0-executor.md` (S4 — which thread an `@ModelActor` runs on per construction site), `docs/m0-freesigning.md` (S5/S7 — notification authorization and `SMAppService.register()` for an ad-hoc build in `~/Downloads`, `/Applications` and DerivedData), `docs/m0-textsize.md` (S6 — whether macOS 26's Accessibility ▸ Display text size moves anything in a third-party app; human screenshots before/after). **If S1/E1 is false, milestone 4 is deleted from this table and `SPEC.md`'s widget section struck, in this PR.** Spike code lives in `spikes/` and is deleted in this PR; it does not count toward the diff budget. |
| 1a | `m1a-model-and-time` | `Day`, `DayClock`, schema, entities, `Settings` | `swift test --package-path Packages/DailyCore` passes. `DayClock.logicalDate(for:)` reads the **wall-clock** hour in the current zone and never does absolute-time arithmetic on `Date`; it returns *today* at 06:00 local on both 2027 DST transition days, and a rollover time of 02:30 fires exactly once on spring-forward day. `DayClock.date(for:atMinutes:)` is the only `Day`→`Date` conversion in the package (CI grep) and reads `TimeZone.autoupdatingCurrent` at each call against `Calendar(identifier: .gregorian)`. Acceptance rows SPEC 616, 632, 635, 638 each have a named test. `enum SchemaV1: VersionedSchema` holds all four entities and `ToDewMigrationPlan: SchemaMigrationPlan` has V1 as its only stage; a checked-in V1 fixture store opens and migrates; `AppState.schemaVersion` is written on first launch. No public API returns a `@Model` instance (CI grep). A `Settings` `Codable` struct holds all eighteen controls from SPEC 551–555 with their spec defaults, persists to the App Group `UserDefaults` suite so the widget reads the same values, and a test enumerates all eighteen keys. |
| 1b | `m1b-engines` | Parser, recurrence, streaks, statistics | `swift test --enable-code-coverage` plus `xcrun llvm-cov report` shows 100% region coverage for `QuickEntryParser.swift` and `RecurrenceRule.swift`, command and output in the PR body. `RecurrenceRule` compiles with no duplicate case (`.daily`, `.weekly(Set<Weekday>)` with `.weekdays` as a static convenience, `.everyNDays(Int)`, `.monthly(dayOfMonth:)`) and the N-day anchor comes from the template's `lastGeneratedDay`, never from the rule, so pause-then-resume produces no catch-up burst. Acceptance rows SPEC 654, 659, 661 each have a named test. A day the app was never opened on is neutral, not a break. The six statistics from SPEC 337–350 each have a unit test for their definition. |
| 1c | `m1c-store-and-rollover` | `Store` actor, rollover, undo values | `Store` is an `@ModelActor` constructed off the main actor per `docs/m0-executor.md`; its methods take and return `Sendable` value types only. Rollover runs on a dedicated `ModelContext` with `autosaveEnabled = false`, mutates only in memory and commits with a **single `save()`**; any error calls `rollback()` and discards the context; `ModelContext.transaction(_:)` appears nowhere (CI grep). `AppState.lastOpenedLogicalDay` is written inside that same save, so idempotency is a guard and not a cleanup pass. Acceptance rows SPEC 621, 623, 627, 629, 645, 648, 651, 656 each have a named test, with 629 driven by a harness that `exit(0)`s before and after the save and asserts the store is fully old or fully new, never partial. Every mutation returns a `Sendable` `InverseAction` value that captures no `@Model`; no `UndoManager` symbol appears in `DailyCore` (CI grep). `RolloverEngine.preview(for:)` projects a future day without writing — asserted by a test that the store file is unchanged after a preview. `runRollover` returns the commit token the app layer uses to clear the undo stack. `DailyCore` imports no WidgetKit and no SwiftUI (CI grep). |
| 2a | `m2a-theme` | Theme protocol, both themes, fonts, catalog, snapshot harness | **May start as soon as milestone 0 closes, concurrently with milestone 1.** `Theme` carries colors, type, radius, space, sizes, shadow, **materials**, **`typeScale`**, all eight named motion hooks, sound, wallpaper and stickers. `SageLilyTheme` reads every token group in `design/theme-sage-lily.json`; `TestTheme` differs from it in every group, and a test fails if any two-theme snapshot pair is identical. `typeScale` and its Settings-backed control are decided in this PR against `docs/m0-textsize.md`, before any component exists — macOS has no Dynamic Type and `relativeTo:` scales against nothing. The five font files are in `App/Fonts/`, registered through `ATSApplicationFontsPath`, and a test asserts `NSFont(name: "Jost-Regular", size: 15)` and `NSFont(name: "CormorantGaramond-Medium", size: 34)` both resolve rather than falling back. `Localizable.xcstrings` exists in `DailyUI` and CI fails on a bare string literal inside `Text(`. The snapshot harness renders any preview under both themes × light/dark × two `typeScale` steps, proved end to end on `Checkbox` with its full state set. |
| 2b | `m2b-components` | `TaskRow`, `ProgressRing`, `DayHeader`, `EmptyState` | Each has previews for its §4 states **and** the six states `CLAUDE.md` requires of all of them — empty, loading, one item, 50 items, very long title, all done — and every one snapshots differently under `SageLilyTheme` and `TestTheme` in light and dark. A 200-character title, an emoji title and an RTL title each render at 360 pt with the full text reachable as tooltip and VoiceOver label (SPEC 465, 672). Every element carries a VoiceOver label and every row exposes toggle-done, flag and drop as custom actions. Screenshots to paste: the six-state preview grid for each component, light and dark. |
| 2c | `m2c-today` | Today view, persistence, window | The view read path is whatever `docs/m0-readpath.md` settled; if that document says `@Query` cannot be trusted across the actor context, no view imports SwiftData and views consume `Sendable` snapshots from `Store`. Today renders in a `LazyVStack` with stable IDs. Completed rows dim and sink below open rows and a toggle hides them (SPEC 131); flagged-pin-to-top honours its setting (SPEC 126). Window minimum 360×480, hidden title bar with traffic lights in place, and the frame restored across relaunch via a named `.windowFrameAutosaveName` (SPEC 135). Instruments' Animation Hitches shows no hitch over 16 ms scrolling a seeded 500-task day **in this PR, not milestone 9**. Screenshots: Today empty, Today with 50 tasks, Today all done, at 360 pt and at default width, light and dark. |
| 2d | `m2d-entry-detail-keys` | Entry, detail inspector, mutations, undo, keyboard | `EntryField` parses through `QuickEntryParser`, highlights parsed chips and dismisses them with Escape — and the conflict with Escape-cancels-inline-edit (SPEC 185 vs. 198) is resolved in this PR and written into `SPEC.md`. A `TaskDetail` inspector opens on `Cmd I` editing note (links clickable, SPEC 163) and due time, with previews for empty/long/linked note, due time set and cleared, flagged, 200-char title, editing. Add, complete, edit, reorder, drop each return an `InverseAction` that the **app layer** turns into an `UndoManager` registration, with redo through the Edit menu. The eight Today-scoped shortcuts (`Cmd N`, `Up`/`Down`, `Space` and `Cmd Return`, `Return`, `Cmd I`, `Cmd Shift F`, `Cmd Option Up`/`Down`, `Delete` with `Cmd Z`) each have a test that sends the key equivalent and asserts the store mutation. `Cmd T`, `Cmd Shift S` and `Cmd 1`–`Cmd 5` are present in the menus, disabled, with a visible reason, until milestone 5. The `taskComplete`, `taskAdd`, `taskRemove` and `reorder` hooks are invoked at their call sites and collapse to an instant opacity change under Reduce Motion. |
| 3a | `m3a-rollover-live` | Live rollover and its triggers | The rollover check runs on launch, `NSWorkspace.didWakeNotification`, window focus, `NSSystemClockDidChange`, `NSSystemTimeZoneDidChange`, and a timer scheduled with `Calendar.nextDate(after:matching:matchingPolicy:.nextTime, repeatedTimePolicy:.first)` so a rollover time inside the spring-forward gap still fires exactly once. Acceptance row SPEC 618 verified by holding the app open across a simulated 06:00 with no restart, and SPEC 629 by killing the running app mid-rollover and relaunching. The undo stack is cleared where rollover commits, asserted by a test that `Cmd Z` after a rollover cannot alter a frozen `DayRecord`. Exactly one `WidgetCenter.reloadTimelines(ofKind:)` fires after the save, issued by the **app target**, and ordinary mutations coalesce on a ~250 ms trailing debounce so a 500-task drag-reorder is one reload. Screenshots: the list before and after a simulated rollover. |
| 3b | `m3b-review` | Morning review | `ReviewCard` with its full preview set including the nag state. The review appears on the first open after a rollover with leftovers and never when there are none; leftovers are grouped by original day. `K`/`L`/`S`/`D` plus `→` and `←`, Keep all, Drop all, the collapsed Someday pull list, Skip; `Later` opens a picker offering tomorrow, a weekday or a date. The yesterday recap line and the streak increment. "Start the day" returns to Today with the entry field focused. The carry nag fires at the threshold setting. Reopen from the View menu is available **only until the first completion of the day** (SPEC 258–259), and reopening never double-increments a carry count. `reviewCardSwipe`, `dayRollover`, `streakIncrement` and `allDoneCelebration` hooks are invoked. Screenshots: review with 1, 5 and 0 leftovers, plus the nag, light and dark. |
| 4a | `m4a-widget` | WidgetKit widget, three sizes, timeline | **Gated on `docs/m0-signing.md` E1 = true; if E1 is false this row and 4b do not exist.** Small (ring, done/total, streak), medium (top four tasks plus progress) and large (up to ten plus progress and streak) render from a `Sendable` `snapshotForWidget` value. The widget opens the store **read-only** and never runs rollover, which writes. The timeline carries an entry at the next rollover built from `RolloverEngine.preview(for:)`, with `.after(nextRollover)` as the reload policy; the PR notes that a sleeping Mac refreshes on wake, not at 06:00. Legible in **both `\.widgetRenderingMode` values the Mac desktop produces — `.fullColor` and `.vibrant`** — with no meaning carried by colour alone. Widget-size `Checkbox` and `ProgressRing` previews added. Acceptance row SPEC 666 verified with the app quit. `scripts/release.sh` sets its include-widget switch from `docs/m0-signing.md` E2/E3, and the README states which install path gets a widget. Screenshots: all three sizes in both rendering modes. |
| 4b | `m4b-widget-intents` | Interactive checkboxes, cross-process refresh | `docs/m0-signing.md` is extended with S8: which process runs the checkbox App Intent. If it runs in the extension, the intent is scoped to a single `complete(TaskID)` and posts a Darwin notification the app observes and refetches on. Acceptance row SPEC 663 verified — the app list updates within 1 second of a widget check — measured three times. App and widget writing within the same second lose neither write and neither throws. Widget-origin mutations are **not** undoable unless the intent conforms to `ForegroundContinuableIntent`; this PR decides which, and amends `CLAUDE.md`'s "every mutation is undoable" to "every app-originated mutation is undoable" in the same PR. |
| 5a | `m5a-nav-upcoming` | Navigation and Upcoming | A `Nav` component (segmented pill in `surfaceAlt` per `design/theme-sage-lily.md`) hosted in the single main window switches Today / Upcoming / Someday / Recurring / History; `Cmd 1`–`Cmd 5` go live; the selection persists across launch; `Nav` previews five segments, each selected, keyboard-focused, and at 360 pt. Upcoming groups Tomorrow → the next seven weekdays → by date, supports adding directly to a future day and dragging between days, and a scheduled task stays hidden from Today until its own rollover. `Cmd T` (move to tomorrow) goes live. Due time, note and flag are settable ahead through the milestone 2d inspector. Screenshots: Nav in all five states; Upcoming with and without items. |
| 5b | `m5b-someday-recurring` | Someday and recurring templates | Someday is one undated, manually ordered list with add-to-today, schedule and drop actions, a stale marker past 60 days and no auto-delete; `Cmd Shift S` goes live. Recurring templates list with pause and a seven-day done/missed history row. Editing a generated instance detaches it — `templateID` is kept for history, the template untouched — and editing a template changes only instances generated after the edit (SPEC 284–285); both are covered by `DailyCore` tests. Quick-entry scheduling tokens ("tomorrow", "fri") create scheduled tasks. Screenshots: Someday with a stale item; the recurring list with a paused template. |
| 6a | `m6a-history` | History, day detail, statistics | Month calendar heat map of `CalendarCell` (neutral, partial, full, selected, today, future) with day detail showing done, dropped, carried and missed-recurring; search across past titles and notes; duplicate a history task into today. All six statistics from SPEC 337–350 rendered as `StatTile`s (current streak, longest streak, completion rate over 7 and over 30 days, tasks completed this week / this month / all time, busiest weekday, most carried task), computed by the milestone 1b functions. `CalendarCell` and `StatTile` ship with full preview sets including loading and dash states. Scrolling twelve months of a seeded 500-task-per-day store shows no hitch over 16 ms. Screenshots: the heat map, a day detail, the stat row, light and dark. |
| 6b | `m6b-data` | Export, import, pruning | JSON export → wipe store → JSON import reproduces a **byte-identical re-export** (round-trip test in `DailyCoreTests` covering `originalDay` and `carryCount`). Markdown export of a checked-in fixture day matches a golden file. "Delete history older than" removes `DayRecord`s and `Task`s strictly before the cutoff and nothing else. An import file written by a future `schemaVersion` is refused with a readable message rather than partially applied. |
| 7a | `m7a-settings` | Settings window | All eighteen controls from SPEC 551–555 are present over the milestone 1a `Settings` struct, asserted by a test that enumerates the struct's keys. Rollover time is constrained to 12:00 AM–12:00 PM in 30-minute steps (SPEC 101) and changing it from 6 to 4 at 5 AM triggers exactly one immediate rollover (SPEC 645). The text-size control drives `theme.typeScale`. The theme picker switches `SageLilyTheme` and `TestTheme` and every pixel changes. Review-off makes leftovers auto-roll with no review (SPEC 260). An **off-by-default** "Check for updates" setting fetches the GitHub Releases feed at most once per launch and shows a "new version available" link — the app's only network call (SPEC 577–579) — with a test asserting zero `URLSession` traffic when it is off. Screenshots: every Settings pane, light and dark. |
| 7b | `m7b-notifications-dock` | Notifications, badge, Dock menu, login | A rolling seven-day queue of **non-repeating** dated requests, each body computed at scheduling time from `RolloverEngine.preview(for:)` and the whole queue rewritten on launch, wake and mutation; a repeating trigger is not used because its content is frozen when scheduled. Verified by quitting and waiting **two** mornings, and by changing task counts after quitting. All four types from SPEC 366–377. Authorization is requested the first time the user sets a due time or enables a reminder, never at launch — asserted by a test that launches with no setting touched and expects no authorization call — and verified on an ad-hoc-signed, de-quarantined build per `docs/m0-freesigning.md`, with a visible "notifications unavailable" state in Settings if refused. The due-time notification registers a category with **Done** and **Snooze 15 min** whose handlers complete or re-schedule +15 min. Tapping any notification routes to the named task or to the morning review. `.timeSensitive` only for due time and default interruption level otherwise, so Focus modes are honoured; no custom sound. Badge modes: open count / flagged only / off. Dock menu: New Task, five open tasks, Show Today. `SMAppService` launch at login verified from `/Applications`, `~/Downloads` and DerivedData, with a Settings affordance and a README step if it requires `/Applications`. |
| 7c | `m7c-floating-icon` | Floating icon (**droppable row**) | A non-activating `NSPanel` (`.nonactivatingPanel`, `level = .floating`, `collectionBehavior` including `.canJoinAllSpaces` and `.fullScreenAuxiliary`), off by default, ~44 pt, showing a ring with the open count that becomes a check when the day is done; click toggles the main window; right-click shows the same five-task menu as the Dock; it drags, snaps to screen edges, restores its frame **per display** across relaunch, fades when idle and never takes key focus; toggled in Settings **and** the View menu. `FloatingIcon` ships with its preview set. Nothing depends on this row: deleting it is a revert. The keep-or-cut decision is **not** a gate here — it is logged in `SPEC.md` "Still open" with milestone 9 as its deadline. |
| 8 | `m8-design` | Final visual pass | Every token group in `design/theme-sage-lily.json` is read by at least one view — proven by a `DailyUI` test that fails when a token is never accessed — including `materials` (glass on the toolbar and entry bar only, never on a content row, asserted by a `TaskRow` snapshot over a high-contrast backdrop), `wallpaper` (window ground when `materials.window == "solid"`) and `stickers`. The eight motion hooks carry their Sage Lily durations and curves with **no new call sites added in this milestone**. A `Feedback` service plays the completion sound (off by default) and fires an `NSHapticFeedbackManager` alignment pattern, both routed through the theme so `TestTheme` silences them. A layered Icon Composer app icon (default/dark/clear/tinted) replaces the milestone 0 placeholder. Reduce Motion and Increase Contrast each produce a distinct snapshot set. The human pastes light and dark screenshots of Today, Review, History and Widget against `design/mockups/*.png`; that comparison is a review step, not an automated gate. Two open questions are decided and written into `SPEC.md` in this PR: the SPEC 391 Dock-icon-reflects-day-state stretch goal, and `wallpaper` having no dark value against SPEC 450 ("every token has light and dark values"). |
| 9 | `m9-release` | 1.0 | Accessibility Inspector's audit reports zero issues on Today, Review, Upcoming, Someday, Recurring, History and Settings — labels and custom actions were gated per UI milestone, so this milestone audits rather than implements. Instruments' Animation Hitches shows no hitch over 16 ms scrolling a seeded 500-task day and cold launch with that store is under 1 second, measured three times (SPEC 669–670). Acceptance row SPEC 672 verified on a real 360 pt window in light and dark. Three XCUITest smoke tests run in CI on `macos-26` (SPEC 493): the app launches and shows Today within 3 s; a task typed into the entry field appears and survives a relaunch; the Settings window opens and closes without crashing. `README.md` carries screenshots of all four surfaces, both install paths, the Open Anyway walkthrough, and a plain statement of which path gets a widget. CI builds the release zip from tag `v1.0.0` and the zip launches on a Mac that has never built the project. The floating-icon keep-or-cut decision is recorded in `SPEC.md`. |

Keep the two paragraphs at `PLAN.md:90–91` and add a third:

> Design work is not deferred entirely to milestone 8: from 2a on, views are built against
> `SageLilyTheme`, and the theme protocol declares `materials`, `typeScale` and all eight motion
> hooks from 2a so that 8 changes values, never call sites. Milestone 8 is polish, not a rewrite.
>
> Lettered rows are separate pull requests within one milestone. A milestone closes when its last
> lettered row merges and the human has seen the screenshots that row names.

---

## 6. Risk-table audit (§6) and its replacement

### 6.1 Audit of the six existing rows

| Existing row (`PLAN.md`) | Verdict | Why |
|---|---|---|
| L137 "Widget App Group under ad-hoc signing → M0 spike; fallback = zip ships without widget, README says build from source" | **Retired by the wrong test, and the fallback is wrong** | The spike as gated tests E1 only; the named risk is about E2/E3. And the fallback assumes a source build always yields a widget, which is precisely what E1 has not established. If E1 is false there is no widget on any path — a sandboxed extension with no group container has no shared location to read, so there is no snapshot-file consolation either. **[depends on: 02/B1; the no-snapshot-fallback conclusion is mine]** |
| L138 "Rollover edge cases (DST, sleep, backward clock) → M1 tests with injected clock" | **Named but not retired** | `platform-critic` F2 shows `logicalDate` is an hour wrong on both DST days *while still passing SPEC 635*, because the defect neither skips nor duplicates a day. A risk row that points at a test the defect survives is worse than no row: it reads as retired. |
| L139 "Theme layer leaks → snapshot tests in `TestTheme` from M2" | **Sound, incomplete** | The snapshot suite only renders §4's preview states, which omit loading and 50-item (01/#22), and `TestTheme` must differ in *every* token group or the comparison passes vacuously for materials and motion. |
| L140 "Custom fonts and Dynamic Type → `.custom(_:size:relativeTo:)`; check Larger Text in M2" | **Retired by nothing; actively misleading** | macOS is not a Dynamic Type platform; the stated check passes by looking unchanged, which is indistinguishable from a correct pass. **[depends on: 02/B5]** |
| L141 "Notifications when the app is closed → scheduled daily trigger with refreshed body in M6; test by quitting and waiting" | **Retired by a mechanism that cannot work, using a test that cannot detect it** | A repeating trigger's content is frozen at scheduling time, and the stated test passes on the first delivery and fails on the second, 24 hours later and outside the loop. **[depends on: 02/B4]** |
| L142 "500-task performance → `LazyVStack` + stable IDs from M2; perf pass in M9" | **Retired far too late** | The two decisions that determine this — the view read path (S2) and where `@ModelActor` runs (S4) — are made at M0/M1, and the views that spend the budget are written across M2–M6. A first measurement at M9 means any failure is a cross-cutting rewrite at the end. **[depends on: 02/B2]** |

**Missing entirely: eleven rows.** SwiftData schema versioning; cross-process store access and
widget/app staleness; CI having no signing identity at all; `ModelContext.transaction` not rolling
back; `@ModelActor` executor inheritance; undo across a rollover; undo unavailable for
widget-origin mutations; the eighteen settings having no storage home; free-signing collisions with
`SMAppService` and notification authorization; the human-screenshot round trip being the real
schedule; and `design/mockups/` — which `PLAN.md:87` makes milestone 8's only stated reference and
`PLAN.md:149` makes an untracked human to-do.

### 6.2 Replacement §6

| Risk | Retired by |
|---|---|
| Widget App Group is denied under free signing | **M0 spike S1**, recorded as three booleans in `docs/m0-signing.md` with pasted `codesign` output: E1 (Xcode, Personal Team, `<TeamID>.`-prefixed group), E2 (ad-hoc, as CI builds), E3 (E1's zip on a second Mac). **E1 = false deletes milestone 4 and strikes `SPEC.md`'s widget section in the M0 PR** — there is no snapshot-file fallback, because a sandboxed extension without a group container has no shared path to read. |
| CI has no signing identity, so the release zip is ad-hoc | Assumed true from M0, not discovered at M9. `scripts/release.sh` carries an include-widget switch set by E2/E3 in the M0 PR, and `README.md` states plainly which install path gets a widget. |
| Free-signing collisions at runtime: notification authorization and `SMAppService` for an ad-hoc build in `~/Downloads` | **M0 spikes S5 and S7** (`docs/m0-freesigning.md`); milestone 7b ships a "notifications unavailable" state and a "move to Applications" affordance plus README step if either fails outside `/Applications`. |
| Rollover edge cases: DST, sleep, backward clock, time-zone jump | **M1a and M1c tests with the injected clock**, including two rows the current acceptance table lacks: `logicalDate` at 06:00 local returns *today* on both 2027 DST transition days, and a rollover time of 02:30 — inside the spring-forward gap, which the 12:00 AM–12:00 PM setting range permits — fires exactly once. `logicalDate` reads wall-clock time and never subtracts an interval from a `Date`. |
| A crash mid-rollover leaves a half-closed day | **M0 spike S3** confirms a single `save()` is atomic across `exit(0)`; **M1c** performs the whole rollover on a scratch `ModelContext` with `autosaveEnabled = false` and one `save()`, `rollback()`-and-discard on error, and never uses `ModelContext.transaction(_:)` (CI grep) — it does not roll back on error. **M3a** re-runs the check against the live app. |
| SwiftData schema cannot be migrated after 1.0 | **M1a** declares `SchemaV1: VersionedSchema` and `ToDewMigrationPlan` with V1 as its only stage before any store is created; a checked-in V1 fixture opens and migrates in CI. This is the one risk in the table that cannot be retired later at any price. |
| Cross-process access: the widget writes and the app shows stale data | **M0 spike S2** (the cross-process half) and **S8**; **M1c** makes the app the only default writer and the widget read-only; **M4b** scopes the widget's intent to one `complete(TaskID)` and posts a Darwin notification the app refetches on, verified against SPEC 663 (one second) three times. The `Store` actor serialises one process and cannot serialise two. |
| The view read path may not observe actor-context saves | **M0 spike S2** (`docs/m0-readpath.md`) decides `@Query` versus `Sendable` snapshots vended from `Store` **before** milestone 2c writes the first view; ten components written against the wrong answer is the expensive version. |
| `@ModelActor` silently runs all store work on the main thread | **M0 spike S4**; **M1c** constructs `Store` off the main actor and the PR records the construction site. Left undetected this surfaces only as a failed 500-task frame budget, with no visible cause. |
| Undo: closures across the actor boundary, undo across a rollover, undo from the widget | **M1c** returns `Sendable` `InverseAction` **values** that capture no `@Model`, with `UndoManager` confined to the app layer (CI grep); **M3a** clears the stack where rollover commits, asserted by a test that ⌘Z cannot alter a frozen `DayRecord`; **M4b** decides the widget intent's host process and amends `CLAUDE.md` to "every app-originated mutation is undoable". |
| The eighteen settings have no storage home the widget can read | **M1a** ships one `Settings` `Codable` struct persisted through `Store` into the App Group `UserDefaults` suite, with a test enumerating all eighteen keys; **M7a** builds the window over it. `@AppStorage` scattered in the App target is invisible to the widget. |
| Theme layer leaks (a literal colour, size or curve somewhere) | **Snapshot tests under `TestTheme` from 2a**, with `TestTheme` required to differ in **every** token group — colours, type, radii, spacing, shadow, materials, motion — and the previews required to include the six `CLAUDE.md` states (empty, loading, one item, 50 items, very long title, all done), so leaks in the loading and high-density states are covered too. |
| macOS has no Dynamic Type, so the type scale is the app's own problem | **M0 spike S6** records whether Accessibility ▸ Display text size moves anything for a third-party app; **2a** puts a `typeScale` factor in the `Theme` protocol and a control in Settings **before** any component is written. Deciding this after seven components exist means editing all of them and every snapshot baseline. |
| Notifications when the app is closed carry stale text | **M7b** schedules a rolling seven-day queue of **non-repeating** dated requests, each body computed at scheduling time from `RolloverEngine.preview(for:)` (added in M1c) and rewritten on launch, wake and mutation. A repeating trigger cannot be used: its content is frozen when scheduled. Test by quitting and waiting **two** mornings, and by changing counts after quitting. |
| 500-task performance | `LazyVStack` and stable IDs from 2c, and an Animation-Hitches measurement **inside 2c and 6a**, not only at 9. The read path (S2) and the store executor (S4) are settled at M0 because they, not the view code, decide whether the budget is reachable. |
| `design/mockups/` does not exist, and milestone 8's gate depends on it | Moved from the untracked §7 to-do list into **M0's "Done when"**: the four PNGs are committed before milestone 1 opens. |
| The human-screenshot round trip is the real schedule | Thirteen of twenty-one PRs stop for eyes. Each UI row's "Done when" names the exact screenshots to paste, so one round trip closes one PR. This risk is mitigated, never retired; it is stated here so it is planned for rather than discovered. |

---

## 7. Findings

Each carries the quoted `PLAN.md` line and number, the consequence, replacement text, and a
severity. 6 blockers, 7 should-fix, 3 nits.

---

### S1 — The ~800-line split rule counts tests, which makes it unusable and makes every size judgment in this plan wrong · **blocker**

> `PLAN.md:129` — "- **Short PRs.** If a milestone grows past ~800 lines of diff, split it (e.g. M3a rollover, M3b review)."

**Consequence.** `PLAN.md:8–10` mandates test-first `DailyCore` with a full suite, and `CLAUDE.md`
requires every component preview in six states snapshot-tested under two themes and two colour
schemes. Tests and previews are roughly 55–60% of this project's diff. Under a literal reading M1
alone splits into six PRs and M2 into seven, so the rule is either followed into a forty-branch
plan nobody can navigate, or — far likelier — quietly ignored the first time it bites, which is
M1, which is the second milestone. Once it is ignored once it is decorative, and M2 lands as a
3,000-line pull request that no human reviews properly. The failure surfaces as an un-reviewed
theme layer, which is the one layer the whole "no literal styling" rule depends on.

**Proposed replacement text:**

> - **Short PRs.** Budget **~800 lines of production diff per pull request** — Swift that ships in
>   the app. Tests, previews and snapshot baselines are required in the same PR and are excluded
>   from the count; so is generated project file churn. A milestone over budget is split into
>   lettered pull requests (`m3a-rollover-live`, `m3b-review`), which is how §3 is already written:
>   ten milestones, twenty-one branches. Never split a component from its previews, or a view from
>   the keyboard handling that drives it.

---

### S2 — M0's gate controls a line in a shell script when it should control whether a milestone exists · **blocker**

> `PLAN.md:79` — "| 0 | `m0-scaffold` | Xcode project, two packages, CI, xcconfig, App Group spike | `swift test` runs empty; Dock icon appears; **widget App Group works or is ruled out under free signing** (decides whether the prebuilt zip ships the widget) |"

**Consequence.** Three separate failures compose. (a) One boolean is asked where three
environments give three answers **[depends on: 02/B1]**. (b) The stated downstream decision — the
zip's contents — is already determined before the spike runs, because CI has no signing identity
and cannot produce a Team-ID-bearing signature at all; the plan's fallback at L137 is the outcome
with probability near one. (c) The decision the spike *should* control — whether milestone 7 is
built — is connected to nothing. Combined with the disjunctive wording ("works **or** is ruled
out"), which is satisfiable by assertion, the realistic path is: M0 closes green with nobody having
run anything, six milestones are built on the assumption, and M7 discovers an empty widget on
someone else's machine. That is up to 1,100 lines written and discarded plus an unbounded
debugging session against a failure mode that produces no log the user will find.

**Proposed replacement text** — see the milestone 0 row in §5. In short: the cell requires
`docs/m0-signing.md` with three booleans and pasted `codesign -d --entitlements -` output for E1,
E2 and E3; it states that **E1 = false deletes milestone 4 and strikes `SPEC.md`'s widget section
in the M0 PR**; and it moves the release script's include-widget switch into M0.

---

### S3 — The plan's only milestone-scale binary risk is retired last · **blocker**

> `PLAN.md:86` — "| 7 | `m7-widget` | WidgetKit widget | Small/medium/large; App Intent checkboxes; timeline entry at next rollover; renders in tinted and clear styles without color-only meaning |"
> `PLAN.md:85` — "| 6 | `m6-system` | … floating `NSPanel` icon behind a setting (try for a week, then keep or cut) |"

**Consequence.** The widget depends on M0/E1, the Core store and `preview(for:)`, the theme and two
components, and live rollover — and on **nothing** in the planning views, history, or system
milestones. Yet it is placed seventh, behind three milestones it does not need and immediately
behind a milestone whose gate contains a seven-day wall-clock wait. In a plan that is otherwise a
strict chain, that means the one risk that can delete a whole milestone is carried, unretired,
through roughly 5,800 lines of unrelated work, and the one milestone that might be *cut* sits
behind the one milestone that might be *stuck*. Sequencing rule violated: retire binary risks
early, retire incremental risks late.

**Proposed replacement text** — reorder §3 so the widget is milestone 4, directly after live
rollover, and planning / history / system shift to 5 / 6 / 7 (see §5's table). Add above the table:

> Numbers are build order. The widget is milestone 4, not 7: it depends only on milestone 0's
> signing result, milestone 1's store and `preview(for:)`, milestone 2's theme and components, and
> milestone 3a's rollover path — and it is the only row in this table that a milestone-0 result can
> delete outright. Retire that first.

---

### S4 — M2 is a single table row containing roughly 3,000 lines of production Swift, on the critical path · **blocker**

> `PLAN.md:81` — "| 2 | `m2-today` | Theme layer + Today list | `Theme` protocol, `SageLilyTheme`, `TestTheme`; components: TaskRow, Checkbox, ProgressRing, DayHeader, EntryField, EmptyState, each with an Xcode preview of every state; add/complete/edit/reorder/drop/undo; keyboard table from the spec; data persists; window min 360×480; hidden title bar |"

**Consequence.** Counted out: the token protocol and two full themes (~700), six components with
full preview sets (~1,200), the `TaskDetail` inspector the plan omits but `Cmd I` requires
(~250, **[depends on: 01/#12]**), the Today view and its sort rules (~350), six mutations plus the
undo bridge (~400), the keyboard table (~300), window and persistence (~150), String Catalog
(~100). That is ~3,000 production lines and ~1,500 test lines in one PR — 3.8× the plan's own
budget — and it sits on the critical path with eight milestones serial behind it. It also contains
both decisions `platform-critic` reclassifies from checks to design choices: the view read path
(B2) and the type scale (B5). If either is answered wrong, the rework lands after six components
and their snapshot baselines exist, on the critical path. This is where the plan will actually
slip, and it slips twice.

**Proposed replacement text** — four rows, replacing L81 (full "Done when" cells in §5):

> `| 2a | m2a-theme | Theme protocol (incl. materials, typeScale, all eight motion hooks), SageLilyTheme, TestTheme, font registration, String Catalog, snapshot harness | … |`
> `| 2b | m2b-components | TaskRow, ProgressRing, DayHeader, EmptyState with §4 states plus the six CLAUDE.md states | … |`
> `| 2c | m2c-today | Today view, read path per docs/m0-readpath.md, sort rules, window frame and minimum, 500-task scroll budget | … |`
> `| 2d | m2d-entry-detail-keys | EntryField, TaskDetail inspector, the six mutations, the undo/redo bridge, the eight Today-scoped shortcuts | … |`

---

### S5 — "`DailyCore` complete with tests" is one row covering ~2,000 production lines, and it silently claims milestone 5's export/import · **blocker**

> `PLAN.md:80` — "| 1 | `m1-core` | `DailyCore` complete with tests | Every row of the spec's acceptance table passes from `swift test`; `QuickEntryParser` and `RecurrenceRule` at 100% branch coverage |"
> `PLAN.md:40–41` — "│   ├── DailyCore/              # models, DayClock, RolloverEngine, RecurrenceEngine, │   │   ├── Sources/DailyCore   #   StreakCalculator, QuickEntryParser, Store, **Export/Import**"

**Consequence.** Two problems in one cell. First, "complete" over §1's list is ~1,970 production
and ~2,500 test lines in one PR — 2.5× budget — and it grows further once the homeless scope lands
there: the `Settings` struct **[depends on: 01/#1]**, `SchemaV1` **[depends on: 01/#2]**,
`RolloverEngine.preview(for:)` **[depends on: 02/B4]** and `InverseAction`
**[depends on: 02/B6]**. Second, §1's tree puts Export/Import inside `DailyCore`, so "DailyCore
complete" literally claims work that M5's cell (L84) also claims. Whichever milestone builds it,
the other one's cell is wrong, and the ambiguity is discovered as a merge conflict or as a gap.

**Proposed replacement text** — three rows replacing L80 (full cells in §5), plus a scope note:

> `| 1a | m1a-model-and-time | Day, DayClock (+ inverse), SchemaV1 + migration plan, the four @Model entities, Sendable snapshots, the Settings struct | … |`
> `| 1b | m1b-engines | QuickEntryParser, RecurrenceEngine, StreakCalculator, the six statistics | … |`
> `| 1c | m1c-store-and-rollover | @ModelActor Store, InverseAction, RolloverEngine.run + preview, the durability design | … |`
>
> Export and import codecs live in `DailyCore` but are built in milestone 6b with the UI that calls
> them; milestone 1 is not "all of `DailyCore`", it is the model, the engines and the store.

---

### S6 — "M1 first and alone" serialises the one strand of work that has no dependency on M1 · **blocker**

> `PLAN.md:125` — "- **M1 first and alone.** It is pure Swift with tests Claude can run; let it iterate without you."

**Consequence.** The advice is right about *why* M1 is a good first milestone and wrong about what
it excludes. The theme layer — `Theme` protocol, `SageLilyTheme`, `TestTheme`, font registration,
the String Catalog, the snapshot harness — imports nothing from `DailyCore` and has no edge to it.
It is ~800 lines on the critical path that could be running concurrently. Following L125 literally
means the plan's only genuine parallelism is spent, and it is spent on the strand that feeds the
milestone most likely to slip (S4): M2b cannot start until M2a lands, and M2a is currently queued
behind all of M1. The effect is to lengthen the critical path by roughly one PR's wall-clock for
no benefit.

**Proposed replacement text:**

> - **M1 first, and the theme layer alongside it.** Milestone 1 is pure Swift with tests Claude can
>   run and fix alone — let it iterate without you. Milestone **2a** (the theme protocol, both
>   themes, font registration and the snapshot harness) imports nothing from `DailyCore` and can
>   run concurrently on its own branch; it is the only work in this plan that can. Everything from
>   2b onward is strictly serial, so nothing else is worth trying to parallelise.

---

### S7 — M6's seven-day floating-icon wait blocks the widget in a strictly serial plan · **should-fix**

> `PLAN.md:85` — "| 6 | `m6-system` | Notifications, Dock, Settings, floating icon | … floating `NSPanel` icon behind a setting (**try for a week, then keep or cut**) |"

**Consequence.** `spec-auditor` (F2) shows the clause is unverifiable; the sequencing harm is
separate and additive. In a chain plan, a gate that embeds seven days of wall clock does not delay
one milestone — it delays every milestone after it. As written that is M7, M8 and M9. And because
the floating icon is the single most likely thing to be *cut*, it is bundled with Settings and
notifications, so cutting it after the fact means unpicking a merged 1,670-line PR instead of
reverting one.

**Proposed replacement text** — split M6 into three rows and move the icon last (full cells in §5):

> `| 7a | m7a-settings | Settings window over the milestone 1a Settings struct, plus the off-by-default update check | … |`
> `| 7b | m7b-notifications-dock | Rolling non-repeating notification queue, four types with actions and routing, badge, Dock menu, launch at login | … |`
> `| 7c | m7c-floating-icon | Floating NSPanel icon, off by default — **a droppable row: nothing depends on it, deleting it is a revert** | … The keep-or-cut decision is not a gate here; it is logged in SPEC.md "Still open" with milestone 9 as its deadline. |`

---

### S8 — "M8 is polish, not a rewrite" is an ordering claim the table does not support · **should-fix**

> `PLAN.md:90–91` — "Design work is not deferred entirely to M8: from M2 on, views are built against `SageLilyTheme` so the human check after each milestone is also a design check. **M8 is polish, not a rewrite.**"
> `PLAN.md:87` — "| 8 | `m8-design` | Final visual pass | Sage Lily applied end to end against `design/mockups`; **motion hooks implemented per theme**; completion sound; layered app icon; … |"

**Consequence.** My teammates found the content gaps — motion hooks first appear at M8
**[depends on: 01/F14]** and `materials` appears nowhere **[depends on: 01/F17]**. The sequencing
consequence is the one L91 denies: if the eight hooks and the material tokens do not exist in the
`Theme` protocol until M8, then M8 must reopen every view in `DailyUI` to insert call sites, which
is a rewrite of the final milestone before release, touching every snapshot baseline at the point
in the schedule with the least slack. It also means Reduce Motion has nothing to switch off until
M8, so the accessibility work in M9 is measuring an app whose motion layer is one milestone old.
Declaring the hooks in 2a shrinks M8 from ~1,000 production lines to ~600 and converts it from
"insert call sites" to "change values", which is what L91 promises.

**Proposed replacement text** — amend L90–91:

> Design work is not deferred to the design milestone: from 2a on, views are built against
> `SageLilyTheme`, and the `Theme` protocol declares `materials`, `typeScale` and all eight named
> motion hooks **from 2a**, with `TestTheme` returning `.none` for every hook so a missing
> invocation shows up as an unanimated snapshot diff. Each hook is invoked at its call site in the
> milestone that creates that call site. Milestone 8 therefore changes token *values* and adds no
> new call sites — it is polish, not a rewrite.

---

### S9 — `design/mockups/` is a dependency of milestone 8 with no owner, no date and no gate · **should-fix**

> `PLAN.md:87` — "| 8 | `m8-design` | Final visual pass | Sage Lily applied end to end **against `design/mockups`**; … |"
> `PLAN.md:149–150` — "3. While M0 builds, export the Sage Lily artboards (Today, Review, History, Widget) as PNGs into `design/mockups/` and put the two font families' TTFs into `App/Fonts/`."

**Consequence.** Milestone 8's only stated reference is produced by item 3 of a to-do list that is
not a milestone, has no "Done when", and is not tracked anywhere. The same line carries the font
files, whose absence is silent **[depends on: 01/#19]**. Both are *inputs* to milestones that gate
on them, so the plan has a dependency edge pointing at an untracked task — the classic way a
schedule loses two weeks at the end. There is also a nearer harm: `PLAN.md:126` asks the human to
judge every UI milestone by screenshot from M2 on, with no reference image to judge against until
M8.

**Proposed replacement text** — move both into M0's "Done when" and rewrite §7 item 3:

> M0 (append): `…; design/mockups/{today,review,history,widget}.png are committed, and the five font files named in design/theme-sage-lily.json are in App/Fonts/ (their registration is gated in 2a).`
> §7 item 3: `While milestone 0 builds, export the Sage Lily artboards (Today, Review, History, Widget) as PNGs into design/mockups/ and put the two font families' TTFs into App/Fonts/ — both are milestone 0 deliverables, not optional, because every UI milestone from 2b on is reviewed against the mockups and milestone 8 gates on them.`

---

### S10 — M0 has preconditions the plan never lists: a second Mac, two wall-clock waits and a human at a screen · **should-fix**

> `PLAN.md:144–148` — "## 7. First three things to do today … 2. Open Claude Code on `m0-scaffold` with the §5 prompt. **Its only question back should be the bundle prefix**"

**Consequence.** M0 as it must actually be scoped runs six spikes. S1/E3 needs a **second Mac not
registered to the builder's account** — hardware the plan never mentions, which a solo open-source
author may not have. S5 needs a notification actually delivered after a quit, so it has a wall-clock
wait; S3 needs a kill-and-reopen harness; S6 cannot be run by the agent at all, because it is a
before/after screenshot of a system preference **[depends on: 02/S6]**. "Its only question back
should be the bundle prefix" sets the expectation that M0 is unattended, so the likely outcome is
that the spikes are deferred "until we have a second Mac" and the plan proceeds on assumptions —
which is exactly the failure S2 describes, arriving by a different road. Seven edges start at M0;
it is the worst node to defer.

**Proposed replacement text** — replace §7 items 1–3:

> 1. `git init`, commit `SPEC.md`, `CLAUDE.md`, `PLAN.md`, `design/`, `LICENSE`.
> 2. Before opening milestone 0, line up what its spikes need and cannot be faked: **a second Mac
>    not registered to your Apple account** (S1/E3 — if you cannot get one, record E3 as UNKNOWN
>    and treat it as false), about twenty minutes at the keyboard for S6's before/after screenshots
>    of Accessibility ▸ Display ▸ Text size, and two waits long enough for a notification to be
>    delivered after a quit (S5). Milestone 0 is not an unattended milestone.
> 3. Open Claude Code on `m0-scaffold` with the §5 prompt. It will ask for the bundle prefix —
>    answer `com.<your GitHub username>.todew` — and it will come back with each spike's result for
>    you to confirm before it writes the decision record.

---

### S11 — Milestone 9 is written as a verification milestone but carries an unbudgeted accessibility retrofit across fourteen views · **should-fix**

> `PLAN.md:88` — "| 9 | `m9-release` | 1.0 | **VoiceOver pass**, 500-task perf pass, README with screenshots and Gatekeeper steps, tagged `v1.0.0`, release zip built by CI |"

**Consequence.** `SPEC.md:462` requires VoiceOver **labels and actions**, not labels alone — rotor
actions for toggle-done, flag and drop. By milestone 9 the app has roughly fourteen view files
across Today, the detail inspector, review, Upcoming, Someday, Recurring, History, Settings, the
widget and the floating icon. Retrofitting labels and custom actions into all of them at the end is
several hundred lines of edits spread across every file, at the point in the schedule with the
least slack, and every edit invalidates a snapshot baseline. Worse, accessibility retrofits change
view structure, so they can reopen layout questions M8 just closed. The work is cheap when each
view is written and expensive in aggregate at the end.

**Proposed replacement text** — add a clause to each UI row's "Done when" and rewrite M9's:

> Each UI row (2b, 2d, 3b, 4a, 5a, 5b, 6a, 7a, 7c) appends: `…; every interactive element added in this PR has a VoiceOver label, and every task row exposes toggle-done, flag and drop as custom actions.`
> M9: `Accessibility Inspector's audit reports zero issues on Today, Review, Upcoming, Someday, Recurring, History and Settings — this milestone audits, it does not implement, because labels and actions were gated in the milestone that created each view; …`

---

### S12 — The 500-task budget is first measured after every view that spends it has been written · **should-fix**

> `PLAN.md:142` — "| 500-task performance | `LazyVStack` + stable IDs from M2; perf pass in M9 |"

**Consequence.** Three things determine whether this budget is reachable, and all three are settled
long before M9: where `@ModelActor` runs **[depends on: 02/S4]**, whether views read through
`@Query` or through vended snapshots **[depends on: 02/B2]**, and whether the list is lazy with
stable IDs. A first measurement at M9 means that if the answer is no, the fix is not a perf tweak —
it is a change to the read path, which is a change to every view signature, at the end of the
schedule. The risk row's own mitigation ("`LazyVStack` from M2") is a design instruction with no
measurement attached, so nothing between M2 and M9 can fail.

**Proposed replacement text** — see §6.2's row. In the milestone table, add to 2c and 6a:

> 2c: `…; Instruments' Animation Hitches shows no hitch over 16 ms scrolling a seeded 500-task day, measured in this PR.`
> 6a: `…; scrolling twelve months of a seeded 500-task-per-day store shows no hitch over 16 ms.`
> M9 then re-measures with the full app and adds the cold-launch-under-one-second check (SPEC 670).

---

### S13 — §6 names six risks and omits eleven, including the only one that cannot be retired later · **should-fix**

> `PLAN.md:133–142` — "## 6. Risks and how each milestone retires them | Risk | Retired by | …" (six rows)

**Consequence.** A risk table is the artifact a reader consults to decide what to check before
merging. This one omits schema versioning **[depends on: 01/#2]** — the single risk in this project
that is unrecoverable after 1.0 ships — along with cross-process store access, CI having no signing
identity, `ModelContext.transaction` not rolling back, `@ModelActor` executor inheritance, undo
across a rollover, settings storage, free-signing runtime collisions, and the human-screenshot
round trip. Of the six rows present, two point at mitigations that cannot work (Dynamic Type,
repeating notification content), one points at a test the defect survives (DST), and one is retired
six milestones too late (500-task perf). A reader who trusts the table concludes the project's
risks are handled; four of six are not.

**Proposed replacement text:** the seventeen-row table in §6.2 above.

---

### S14 — §4's "M2–M5" schedule contradicts the revised order and now points at four different milestones · **nit**

> `PLAN.md:95` — "Build each once in **M2–M5**, with a preview that shows every state listed:"

**Consequence.** `spec-auditor` (F12) already notes `FloatingIcon` is an M6 deliverable and the
widget-sized states are M7. With the re-cut the mapping moves again — `ReviewCard` to 3b, `Nav`
(new) to 5a, `CalendarCell` and `StatTile` to 6a, `FloatingIcon` to 7c — so a sentence reading
"M2–M5" is wrong in six of eleven rows. An agent reading §4 literally pulls `NSPanel` work into a
list milestone; reading §3 literally, it ships 6a with a component §4 said was already due.

**Proposed replacement text for `PLAN.md:95`:**

> Build each once, in the milestone named beside it, with a preview showing every state listed
> **plus** the six states `CLAUDE.md` requires of all of them (empty, loading, one item, 50 items,
> very long title, all done): `Checkbox` in 2a; `TaskRow`, `ProgressRing`, `DayHeader`, `EmptyState`
> in 2b; `EntryField` and `TaskDetail` in 2d; `ReviewCard` in 3b; the widget-sized `Checkbox` and
> `ProgressRing` states in 4a; `Nav` in 5a; `CalendarCell` and `StatTile` in 6a; `FloatingIcon` in
> 7c. Add two rows to the table below: `| Nav | five segments, each selected, keyboard-focused, at 360 pt |`
> and `| TaskDetail | empty note, long note, note with links, due time set, due time cleared, flagged, 200-char title, editing |`.

---

### S15 — "Each ends in something that runs" is false for four rows, and the human cannot tell which ones need eyes · **nit**

> `PLAN.md:75` — "Each ends in something that runs and can be checked. Suggested prompt to open each one is in §5."
> `PLAN.md:18–19` — "5. **Human in the loop for UI.** Claude cannot see the running app. After each UI milestone, build, run, screenshot, and paste the screenshots back."

**Consequence.** Milestones 1a, 1b, 1c and 6b end in a **test run**, not in something on screen;
milestone 0 ends in decision records. Under L75 plus L18–19 the human does not know which PRs will
stop and ask for screenshots, so either the agent asks for screenshots of a library — wasting a
round trip on the milestone that needed it least — or the human is unavailable when 2b actually
needs them. In a plan where the human round trip is the real schedule (§2.2), not knowing which
PRs need one is a scheduling defect, not a documentation one.

**Proposed replacement text for `PLAN.md:75`:**

> Each row ends in something that can be checked without opinion. Rows 1a, 1b, 1c and 6b end in a
> `swift test` run and need no screenshots; row 0 ends in six decision records. Every other row
> ends on screen and its "Done when" names the exact screenshots to paste — one human round trip
> per pull request. The prompt to open each row is in §5.

---

### S16 — §7 budgets milestone 0 and the design export as one day's work · **nit**

> `PLAN.md:144` — "## 7. First three things to do today"
> `PLAN.md:149–150` — "3. **While M0 builds**, export the Sage Lily artboards … and put the two font families' TTFs into `App/Fonts/`."

**Consequence.** "While M0 builds" implies M0 is a single sitting. With six spikes (§5), a second
Mac, two wall-clock waits and six decision records, it is not, and framing it as a day is what
makes deferring the spikes feel reasonable. The heading's harm is small on its own; it compounds
S10 and S2, which is why it is listed rather than dropped.

**Proposed replacement text for the §7 heading and its lead-in:**

> ## 7. Starting: milestone 0 is a few sittings, not an afternoon
>
> Milestone 0 is the only milestone whose output is mostly *decisions*. Six spikes, six decision
> records, and seven dependency edges start here. Budget it accordingly and do not let any spike
> close on an assertion.

---

*End of review 03.*
