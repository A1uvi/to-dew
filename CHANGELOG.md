# Changelog

All notable changes to To Dew are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/spec/v2.0.0.html).

Until 1.0 ships, entries describe changes to the plan and the scaffolding as well as to the app.

## [Unreleased]

### Changed

- Rewrote `PLAN.md` after a four-reviewer audit (`review/01`–`review/04`) and an adjudication
  (`review/00-adjudication.md`). Ten milestones are kept; the build is now twenty pull requests with
  the split declared in advance rather than discovered at 800 lines.
- The widget moves from milestone 7 to **milestone 4**, gated on milestone 0's App Group signing
  spike, with a written kill clause: if the free-Personal-Team case fails, the milestone is deleted
  and `SPEC.md`'s widget section struck in the milestone 0 PR.
- Corrected four `PLAN.md` §2 decisions that were wrong as written: `logicalDate` now reads
  wall-clock time instead of subtracting an interval from a `Date` (the old form was an hour off on
  both DST transition days while still passing the spec's DST acceptance row); rollover commits in a
  single `save()` on a scratch context rather than relying on `ModelContext.transaction`, which does
  not roll back on error; `Store` is an `@ModelActor` and the actor is no longer described as
  preventing app/widget conflicts, which it cannot do across two processes; undo is a `Sendable`
  `InverseAction` value rather than a closure crossing the actor boundary.
- `RecurrenceRule` no longer declares `weekdays` twice, which would not have compiled, and its N-day
  anchor moves from the rule to the template's `lastGeneratedDay`.
- `WidgetCenter.reloadTimelines` moves out of `DailyCore`, which imports no UI framework, into the
  app target on a debounce.
- Milestone 1's gate no longer claims the six acceptance rows `DailyCore` structurally cannot run;
  they are re-homed to milestones 3, 4 and 9.
- Milestone 6's gate no longer contains a seven-day wall-clock wait, and the floating icon becomes
  its own droppable row.
- `PLAN.md` §4 no longer claims snapshot tests enforce the no-literal-styling rule. Baselines are
  recorded from the code under test, so they cannot. A theme lint script enforces it; snapshots are
  a regression gate.

### Added

- Scope that the spec requires and no milestone claimed: settings storage, SwiftData schema
  versioning, a String Catalog, the `Nav` switcher between the five views, the `Cmd I` task detail
  inspector, the off-by-default update check, notification permission timing and tap routing, window
  frame persistence, XCUITest smoke tests and haptics.
- Six milestone 0 spikes with written decision records covering App Group signing across three
  environments, the SwiftData view read path, crash durability, the `@ModelActor` executor,
  free-signing runtime collisions, and macOS 26 text size.
- `docs/interpretations.md`, an exit checklist for every PR, and a per-row screenshot protocol with
  debug fixtures so the states in the quality bar can actually be put on screen.

### Decisions

- A day the app was never opened on **counts as a failure** and breaks the streak. Settled; not
  re-opened.
- The pink star sticker goes in `DayHeader`, to the left of the greeting line. There is no About
  screen. Exact size, offset and dark-scheme treatment are set against `design/mockups/today.png`
  during milestone 2b and are deliberately left unspecified here.
- `wallpaper` is light-only; the dark scheme uses flat `background`.
- The Dock icon will not reflect day state in 1.0.
- macOS has no Dynamic Type. Unless milestone 0's spike shows otherwise, 1.0 ships a fixed type
  scale and `SPEC.md:452` is amended.
