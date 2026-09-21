# CLAUDE.md — To Dew

To Dew is a native macOS 26 app: one list of what you intend to do today, a 6 AM rollover with a
morning review, local-only data. Read `SPEC.md` (product) and `PLAN.md` (milestones) before
starting any work. The visual direction is `design/theme-sage-lily.md`.

## Commands

```bash
# Logic + UI packages (no Xcode GUI needed)
swift test --package-path Packages/DailyCore
swift test --package-path Packages/DailyUI

# App
xcodebuild -project ToDew.xcodeproj -scheme ToDew -configuration Debug build
xcodebuild -project ToDew.xcodeproj -scheme ToDew -destination 'platform=macOS' test

# Release zip (CI does this on version tags)
./scripts/release.sh
```

Requirements: Xcode 26, macOS 26. Signing uses `Config/Shared.xcconfig` with a blank `DEVELOPMENT_TEAM`;
set your Personal Team locally, never commit it.

## Architecture rules

- `Packages/DailyCore` has **no UI imports**. Models, `DayClock`, `RolloverEngine`,
  `RecurrenceEngine`, `StreakCalculator`, `QuickEntryParser`, `Store`, export/import live here
  and are fully tested.
- `Packages/DailyUI` holds the `Theme` protocol, the themes and the component library. Views are
  thin; behavior lives in Core.
- `App/` wires windows, menus, Dock, notifications, Settings. `Widget/` depends on Core only.
- **The clock is injected.** Never call `Date()` in Core; use the `DayClock` you were given.
- **One function computes dates:** `DayClock.logicalDate(for:)`. Nothing else may.
- **All writes go through the `Store` actor.** Rollover is a single transaction and idempotent.
- **Every mutation is undoable** and reloads widget timelines.

## No literal styling in views

Views must not contain a color, font, point size, radius, shadow or animation literal. Read
`@Environment(\.theme)` and use its tokens (`theme.colors.accent`, `theme.type.body`,
`theme.radius.card`, `theme.motion.taskComplete`, …). Two themes ship: `SageLilyTheme` (the
design) and `TestTheme` (deliberately ugly). If something looks the same under both, it is
hard-coded — fix it. Snapshot tests run every component preview in both.

Named motion hooks (keep even if simple): `taskComplete`, `taskAdd`, `taskRemove`, `reorder`,
`dayRollover`, `reviewCardSwipe`, `allDoneCelebration`, `streakIncrement`. Honor Reduce Motion.

## Quality bar

- Every component preview shows: empty, loading, one item, 50 items, very long title, all done.
- Full VoiceOver labels and actions; complete keyboard access (shortcut table in `SPEC.md`).
- No information carried by color alone (widget renders in tinted and clear styles).
- 60 fps with 500 tasks; text never truncates without a way to read it in full.
- Silent by default. No network calls except the optional, off-by-default release check.

## How to work with me

- I cannot see the running app. When a change needs eyes, stop and tell me exactly what to run
  and screenshot; wait for the images.
- One milestone per branch/PR. Update `CHANGELOG.md` in every PR.
- If you have to interpret something in `SPEC.md`, say so in the PR description and propose the
  edit to `SPEC.md` in the same PR.
- Ask before adding any dependency. The answer is almost always no (Apple frameworks only).
