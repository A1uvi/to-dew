# 02 — Platform feasibility review (macOS 26 / Xcode 26)

Reviewer: `platform-critic`. Scope: PLAN.md §2 decisions, plus the platform assumptions behind
M0, M6 and M7. No Swift exists yet; everything below is about what will be true when it does.

**Epistemic note.** macOS 26 / Xcode 26 behaviour is verified below where I could find Apple
documentation, release notes or forum threads with Apple engineer participation. Where I could
not, the item is marked **uncertain — needs a spike** and §3 gives the experiment. I have not
invented any API name, entitlement string or behaviour. Two items I would previously have
asserted confidently (App Groups under free signing; SwiftData "transactions") turned out to be
more subtle than the plan assumes, which is the main reason this review exists.

---

## 1. Blockers that change milestone ordering

`sequencer`: these six are the ones that move work between milestones. Everything else in §4 is
a text fix inside the milestone it already sits in.

### B1 — The M0 App Group spike is testing one environment; there are three, and they give
### different answers

**Today:** M0 (PLAN.md:79), gate = "widget App Group works or is ruled out under free signing".
**Must become:** M0, but split into three named checks whose results are three separate booleans,
because the release script (M9) and the widget build (M7) each depend on a different one.

The macOS 15+ rule (unchanged in macOS 26, and it is the rule that governs here) is that a
process may open an App Group container only if **one** of the following holds:

1. the app was deployed through the Mac App Store, **or**
2. the app group identifier is prefixed with the signing identity's **Team ID**, **or**
3. the app group identifier is authorised by a **provisioning profile embedded in the app**.

For app *extensions* — which is what the widget is — Apple's Sequoia release note says the system
"won't prompt the user for consent but will instead just **deny** the access". So a widget with a
`group.`-prefixed container on macOS fails silently: no error dialog, no log the user will find,
just an empty widget. (Sources: [macOS App Group Entitlements, Apple Developer
Forums](https://developer.apple.com/forums/thread/762639); [WidgetKit with SwiftData on macOS,
Apple Developer Forums](https://developer.apple.com/forums/thread/767581).)

That produces three environments with three different answers:

| Environment | Signing | Team ID present in signature? | Expected widget outcome |
|---|---|---|---|
| E1: builder runs from Xcode, own Personal Team | Apple Development (free) | yes | **likely works** if group is `<TeamID>.…` |
| E2: CI builds the release zip | ad-hoc (`CODE_SIGN_IDENTITY = -`) — GitHub Actions has no identity | **no** | **widget cannot work**, rule 2 and 3 both fail |
| E3: user downloads that zip, de-quarantines, runs on a Mac that is not the builder's | whatever E2 produced | no | same as E2; plus a separate launch question |

E2 is the one PLAN.md has not noticed. `./scripts/release.sh` run by CI (PLAN.md:48, PLAN.md:88)
has no signing identity, so it ad-hoc signs, so the shipped zip's widget is dead on arrival —
*regardless* of what the M0 spike finds when run from Xcode. The plan's own fallback (PLAN.md:137,
"zip ships without widget") is therefore almost certainly the outcome, and M0 should be allowed
to conclude that on day one rather than discovering it at M9.

E3 has a second failure mode the plan never mentions: if the app ships with an **embedded
development provisioning profile** (which is what route 3 would require), macOS checks the
profile's `ProvisionedDevices` list at launch and refuses to run on a Mac that is not in it —
`CPProfileManager: "Provisioning profile does not allow this device"`. Free Personal Team profiles
additionally **expire after 7 days**. So route 3 is unusable for distribution; the only route that
could work for a downloaded build is route 2 (Team-ID prefix, **no** embedded profile), signed
with the builder's Apple Development identity. That is a real and testable configuration and S1
below is exactly how to test it.

**Consequence for ordering:** M0 must emit a written decision record (`docs/m0-signing.md`) with
three booleans. M7 is gated on E1 being true. The release script's "include widget target?" switch
is decided by E2/E3 and must be written in M0, not left to M9.

### B2 — Nobody has decided how the *views* read data, and it is not `@Query`

**Today:** implied by PLAN.md:14 ("All writes go through `Store`") and PLAN.md:81 (M2 builds the
Today list). The read path is never stated.
**Must become:** an M0/M1 decision, because it determines every view signature in M2–M5.

PLAN.md says all *writes* go through an actor. It is silent on reads. The default SwiftUI/SwiftData
read path is `@Query`, which is bound to the container's **main** `ModelContext`. If the Store
actor owns a *second*, background `ModelContext`, then a write on the actor and a `@Query` in the
view are two different contexts, and whether the view updates depends on SwiftData merging the
actor context's save into the main context. I could not find Apple documentation that guarantees
this on macOS 26, and there are enough reports of it not happening that I will not assert it.

If `@Query` does not refresh, the entire "thin views" architecture has to change shape — Store
must vend `Sendable` snapshot structs through an `AsyncStream` and views must hold those. That is a
different `DailyUI` API than `@Query`, and discovering it in M2 after ten components are written
is the expensive version. Settle it with S2 before M2 starts.

Related and non-negotiable: `@Model` classes are **not** `Sendable`. `Store`'s methods must never
return a `@Model` instance across the actor boundary. The `Task`/`DayRecord` types the UI sees must
be plain value structs. This must be in §2 before M1 writes the first method signature.

### B3 — "Rollover is one transaction" is not a thing SwiftData gives you

**Today:** PLAN.md:15 and PLAN.md:60 (M1 builds it, M3 runs it live).
**Must become:** the same milestone, but the sentence has to be replaced now, because M1's tests
are written against it and a test suite that asserts rollback semantics will assert something the
framework does not do.

`ModelContext.transaction(_:)` exists and forces a save at the end of the block, **but it does not
roll back on error** — this was raised publicly and is a known gap, and the workaround people are
told to use is a separate context plus explicit `rollback()`. Worse, the failure mode after a
throwing `save()` is that the in-memory object graph still holds the change and the context still
holds the dirty objects, so an unrelated later `save()` silently flushes the half-finished rollover
to disk. (Source: [Using Transactions Instead of Save in SwiftData and Core
Data](https://fatbobman.com/en/posts/using-transactions-instead-of-save-in-swiftdata-and-core-data/);
[How to rollback changes without saving,
Hacking with Swift](https://www.hackingwithswift.com/quick-start/swiftdata/how-to-rollback-changes-without-saving).)

The honest design that still satisfies SPEC.md:629 ("Crash in the middle of rollover → on relaunch,
the day is either fully old or fully new") is: do the whole rollover in a **dedicated scratch
`ModelContext` with `autosaveEnabled = false`**, perform every mutation in memory, call `save()`
exactly once at the end, and `rollback()` + discard the context on any error. A single Core Data
`save()` is one SQLite transaction, so crash-before-save persists nothing and crash-after-save
persists everything. What you do *not* get is undo-after-commit, so idempotency must be a real
guard (`lastOpenedLogicalDay` written inside the same save) rather than a cleanup pass.

### B4 — The morning notification cannot have refreshed text while the app is quit, and fixing it
### moves work from M6 into M1

**Today:** PLAN.md:141 ("Scheduled daily trigger with refreshed body in M6"), M6 (PLAN.md:85).
**Must become:** the M6 text changes, **and** `RolloverEngine` gains a pure, non-mutating
`preview(for: Day)` in **M1**.

A repeating `UNCalendarNotificationTrigger`'s `UNNotificationContent` is fixed at scheduling time;
there is no delivery-time hook for a local notification. So "3 tasks carried over" in a repeating
request is whatever was true the last time the app ran — which after a weekend away is wrong.

The workable design is a rolling queue of **non-repeating** dated requests (say 7 days ahead), each
with content computed at scheduling time, re-scheduled on every launch/wake/mutation. To compute
"what will tomorrow look like" you need to project recurring and scheduled task generation forward
**without mutating the store** — that is a new `RolloverEngine` entry point, it is pure logic, it
belongs in `DailyCore`, and it is exactly the kind of thing M1 is for. The **widget** needs the same
function for its "entry at next rollover" (PLAN.md:86), which is independent confirmation that it
belongs in Core and not in M6.

### B5 — macOS has no Dynamic Type, so the theme's type scale is an M2 *design decision*, not an
### M2 *check*

**Today:** PLAN.md:140, "check Larger Text in M2" — phrased as a verification step at the end.
**Must become:** the first task of M2, before any component is written, because it changes the
`Theme` protocol's shape.

Dynamic Type is an iOS/iPadOS/tvOS/visionOS/watchOS system feature. `UIFontMetrics` does not exist
on macOS. `Font.custom(_:size:relativeTo:)` **compiles** on macOS, but `relativeTo:` has nothing to
scale against, and `@Environment(\.dynamicTypeSize)` does not track a Mac-wide user setting the way
it does on iOS. macOS 26 does expose a text-size control under Accessibility ▸ Display, but only a
small set of surfaces (Finder, Mail, sidebars) honour it, and I have found no documented SwiftUI
API that a third-party app uses to opt in. (Source: [How do you support Preferred Font Size /
Dynamic Type on macOS?, Apple Developer Forums](https://developer.apple.com/forums/thread/818858).)

The consequence for the plan's quality bar ("text never truncates without a way to read it in full",
CLAUDE.md) is that the app must own its own text-size control in Settings and the `Theme` protocol
must take a scale factor. Deciding that after `TaskRow`, `Checkbox`, `DayHeader`, `EntryField` and
`EmptyState` exist means editing all of them plus their snapshot baselines.

### B6 — Widget App Intents make "every mutation is undoable" false, and the Store API shape
### depends on the answer

**Today:** PLAN.md:71 (decided in M1); the widget's App Intents land in M7 (PLAN.md:86).
**Must become:** the undo contract is fixed in M1, with the widget case designed in, because every
`Store` method signature carries it.

Three problems compose:

1. **No window, no UndoManager.** A widget App Intent's `perform()` runs in the **widget extension
   process** by default (conforming to `ForegroundContinuableIntent` is what pushes it into the app
   process). There is no window and therefore no `UndoManager` there. CLAUDE.md's unconditional
   "every mutation is undoable" cannot hold for widget-origin mutations.
2. **Closures across the actor boundary.** "Each mutation returns an inverse closure" means an
   escaping closure crossing an actor boundary; under Swift 6 it must be `@Sendable`, and it must
   not capture a `@Model` object (not `Sendable`, see B2). The inverse has to be a **value** —
   `enum InverseAction { case uncomplete(TaskID), reinsert(TaskSnapshot, at: Int), … }` — that the
   *UI layer* turns into an `UndoManager` registration. Core should not import `UndoManager` at all.
3. **Undo across a rollover.** Nothing in the plan clears the undo stack at rollover. Undoing
   yesterday's "complete" after rollover has frozen a `DayRecord` desynchronises history and
   streaks from tasks, permanently and silently. The stack must be cleared in the same place
   rollover commits.

---

## 2. Verdict table

| Decision (PLAN.md §2) | Verdict | Confidence | Why |
|---|---|---|---|
| L53–55 "`logicalDate(for:)` subtracts `rolloverMinutes` then takes the calendar date" | **unsound** | **certain** | Absolute-time subtraction across a DST transition is off by an hour in both directions. Worked example in F2. |
| L54–55 "`Day` is a `Codable` struct of year/month/day with no time zone" | sound-with-caveat | likely | Right storage choice, but there is no stated inverse (`Day` → `Date`), and "current zone" must mean `.autoupdatingCurrent` + a pinned Gregorian calendar. F12. |
| L56–60 "Rollover … close every missed day in order … return `.review`/`.fresh`" | sound | likely | The algorithm is fine and is pure logic; only its persistence claim (next row) is wrong. |
| L60 "Runs in one transaction." | **unsound** | **certain** | SwiftData's `transaction(_:)` does not roll back on error. Achievable as one `save()`; must be re-worded. B3. |
| L60 "Running it twice on the same day is a no-op. A backward clock does nothing." | sound | certain | Pure logic, testable with the injected clock. Requires the idempotency guard be committed in the same save. |
| L61–63 Streaks from `DayRecord` only; `totalCount == 0` neutral | sound-with-caveat | certain | Platform-neutral. One ambiguity: a day the user never opened but which had carried tasks is a *failure*, not neutral. F16. |
| L64–65 `QuickEntryParser` pure function | sound | certain | Nothing platform-dependent. Good milestone-1 material. |
| L66–67 `RecurrenceRule` enum | sound-with-caveat | likely | `case weekdays` and `case weekdays(Set<Weekday>)` do not coexist in one Swift enum; and an enum with associated values cannot be filtered in `#Predicate`. F13. |
| L68 "`actor Store` owns the `ModelContainer` in the App Group container" | sound-with-caveat | likely | `ModelContainer` is `Sendable`; `ModelContext` is not, and a plain Swift actor gives mutual exclusion but not the serial executor `ModelContext` needs. Use `@ModelActor`. S4. |
| L68 "…so the app and the widget never conflict" | **unsound** | **certain** | Two processes. One actor in one process cannot serialise the other. Cross-process contention is a separate problem with a separate answer. F4. |
| L69 `snapshotForWidget` | sound | likely | Good instinct, and it is also the fallback if the App Group route dies: a snapshot file the widget reads. Should be promoted from a method name to a named fallback design in M0. |
| L70 "Every mutation also calls `WidgetCenter.reloadTimelines`" | sound-with-caveat | likely | No daily reload budget on macOS (unlike iOS), so the rate limit worry is unfounded — but it puts a WidgetKit import in `DailyCore`, violating CLAUDE.md, and it is wasteful during drag-reorder. F7. |
| L71 "inverse closure registered with the window's `UndoManager`" | **unsound** | likely | Closure + actor + non-`Sendable` models + no window in the widget process. B6. |
| M0 gate (L79) "widget App Group works or is ruled out under free signing" | **unsound** (underspecified) | **certain** | One boolean where three are needed; and the CI-built zip is ad-hoc signed, which the gate never considers. B1. |
| M6 (L85) `SMAppService` launch at login | sound-with-caveat | uncertain — needs a spike | Right API. Reports suggest registration cares about signature and bundle location; an ad-hoc app run from `~/Downloads` is the exact risky case. S7. |
| M6 (L85) floating `NSPanel` always-on-top | sound | likely | `NSPanel` + `.nonactivatingPanel`, `level = .floating`, `collectionBehavior` including `.canJoinAllSpaces` and `.fullScreenAuxiliary`. Ordinary AppKit; no macOS 26 novelty. |
| M6 (L85) Dock menu + badge | sound | certain | `applicationDockMenu(_:)` and `NSApp.dockTile.badgeLabel`. Requires a regular (non-accessory) app, which is compatible with the floating panel. |
| M6 (L141 / L85) notifications with refreshed text while quit | **unsound** | **certain** | Repeating trigger content is frozen at schedule time. B4. |
| M7 (L86) "timeline entry at next rollover" | sound-with-caveat | likely | Needs the pure projection function from B4, and a `.after(nextRollover)` reload policy; a sleeping Mac will refresh on wake, not at 06:00. |
| M7 (L86) "renders in tinted and clear styles" | sound-with-caveat | likely | Correct intent, wrong vocabulary for macOS: the environment value is `\.widgetRenderingMode` and the desktop mode is `.vibrant`. F10. |
| L140 "`.custom(_:size:relativeTo:)` … check Larger Text in M2" | **unsound** | likely | macOS is not a Dynamic Type platform. B5. |

---

## 3. Spikes needed

Each is small. S1 and S2 should both complete inside M0; nothing after M0 is safe to build until
they do.

### S1 — Does an App Group container work for a macOS widget under free Personal Team signing? (B1)
**Question:** for each of E1/E2/E3, can the widget extension read a file the app wrote to the group
container?
**Experiment:** an app + widget where the app writes `{"n": 42}` to
`FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: APP_GROUP)` and the widget
renders `n` or the word `DENIED`. Group ID set to `<TeamID>.com.<you>.todew` (**not** `group.…`).
Then:
- **E1:** run from Xcode, automatic signing, Personal Team. Also record whether Xcode's automatic
  signing *refuses to build* because a Personal Team's App ID cannot carry the App Groups
  capability — if it does, retry with **manual** signing, `CODE_SIGN_IDENTITY = "Apple Development"`,
  a hand-written entitlements plist, and `CODE_SIGN_STYLE = Manual` with **no** embedded
  provisioning profile. That second configuration is the one this whole question turns on.
- **E2:** build with `CODE_SIGN_IDENTITY = -` (what CI will do). Expect DENIED; confirm it.
- **E3:** zip the E1 (manual, no-profile) build, move it to a **second Mac** that is not registered
  to the builder's account, `xattr -dr com.apple.quarantine`, launch, add the widget.
**Settles:** whether M7 ships at all, and whether the release zip contains the widget target.
**Record in:** `docs/m0-signing.md`, three booleans plus the `codesign -d --entitlements -` output
for each.

### S2 — Does a SwiftUI `@Query` see a save made by a background/actor `ModelContext`? (B2)
**Experiment:** one `ModelContainer`; a view with `@Query` listing `Item`; a button that calls an
`@ModelActor` which inserts an `Item` and saves. Does the list update with no other action?
**Also test the cross-process half:** with the widget from S1, have a widget App Intent insert an
`Item` and confirm whether the app's list updates within 1 second (SPEC.md:663 requires this). If it
does not, the answer is a Darwin notification (`CFNotificationCenterGetDarwinNotifyCenter`) posted
after each save plus an explicit refetch — which is a design item, not a bug fix.
**Settles:** the entire `DailyUI` read API, and whether SPEC.md:663 is achievable.

### S3 — Is a single `ModelContext.save()` atomic across a crash? (B3)
**Experiment:** mutate 200 objects in a scratch context with `autosaveEnabled = false`, then
`exit(0)` (a) immediately before `save()` and (b) inside a `willSave` hook. Reopen the store; assert
0 or 200 objects changed, never a partial count. Also confirm `rollback()` after a thrown `save()`
leaves the context clean enough that a later unrelated `save()` does not flush the discarded work.
**Settles:** whether SPEC.md:629 is met by the design in B3.

### S4 — Where does an `@ModelActor` actually run? (B2)
**Experiment:** `@ModelActor actor Store`; log `Thread.isMainThread` and the queue label inside a
method, when the actor is constructed (a) from `@main`'s `init` on the main actor and (b) from a
detached task. `@ModelActor` captures its executor from the construction context, so building it on
the main actor silently puts all store work on the main thread — which would fail the 500-task /
60 fps bar in M9 with no visible cause until then.
**Settles:** the one line in M1 that constructs `Store`.

### S5 — Is a dated (non-repeating) local notification delivered with correct content while the app
### is quit, on macOS 26? (B4)
**Experiment:** schedule a `UNCalendarNotificationTrigger` for `now + 3 min` with body "count=7",
`repeats: false`. Quit the app. Wait. Confirm delivery and body. Then repeat with `repeats: true`,
change the "count" in the app, quit, and confirm the delivered body is the **old** one.
**Also:** confirm `requestAuthorization` succeeds at all for an ad-hoc-signed app launched from
`~/Downloads` — macOS local notifications are known to fail for bundles LaunchServices does not
consider properly registered, and the free-signing route is the risky case.
**Settles:** the M6 notification design and whether M6 needs a "notifications unavailable" state.

### S6 — Does anything a third-party app does respond to macOS 26's Accessibility text size? (B5)
**Experiment:** a window with `Text("Hi").font(.body)`, `Text("Hi").font(.custom("Georgia", size: 17,
relativeTo: .body))`, and a readout of `@Environment(\.dynamicTypeSize)`. Change Accessibility ▸
Display ▸ Text size. Screenshot before/after. (This one needs the human — I cannot see the app.)
**Settles:** whether `Theme` needs its own scale factor and a Settings control.

### S7 — Does `SMAppService.mainApp.register()` succeed for an ad-hoc-signed app in `~/Downloads`? (M6)
**Experiment:** call it and print the thrown error and `SMAppService.mainApp.status`, from three
locations: Xcode's DerivedData, `~/Downloads`, `/Applications`. If it fails outside `/Applications`,
M6's Settings needs a "move to Applications first" affordance, and the README needs that step.

### S8 — Which process runs the widget's App Intent, and what happens on a write collision? (M7)
**Experiment:** log `ProcessInfo.processInfo.processName` inside `perform()`. Then have the app and
the widget intent both write to the store within the same second and confirm neither throws and
neither loses the other's write. Compare against conforming the intent to `ForegroundContinuableIntent`
(which moves it to the app process and would make widget mutations undoable, resolving half of B6).

---

## 4. Findings

Counts: **6 blockers, 8 should-fix, 3 nits.**

---

### F1 — App Group identifier must be Team-ID-prefixed, and CI cannot produce one — **blocker**

> PLAN.md:68 — `- **Store.** `actor Store` owns the `ModelContainer` in the App Group container and exposes`
> PLAN.md:31 — `├── Config/Shared.xcconfig      # TEAM_ID blank; BUNDLE_PREFIX = com.<you>.todew`

**Consequence.** If the group is named `group.com.<you>.todew` (the iOS convention, and what every
tutorial Claude Code will find says), the **widget's** access is denied silently by the system with
no prompt and no user-visible error, and the app gets a "would like to access data from other apps"
consent alert on every launch. If the group is correctly `<TeamID>.com.<you>.todew`, then the
identifier depends on a build setting that is **blank in the repository by design** — so a fresh
clone builds an app whose group is `.com.<you>.todew`, which is invalid, and it fails at runtime
rather than at build time. And CI, which has no signing identity, cannot satisfy the Team-ID rule at
all. Discovered: M7, when the widget renders empty on someone else's machine and nobody can
reproduce it.

**Proposed replacement text** (PLAN.md §2, replacing the first line of the Store bullet, plus a new
line in the §1 tree comment):

> - **Store.** `actor Store` owns the `ModelContainer`. The store lives in the App Group container
>   whose identifier **must** be `$(DEVELOPMENT_TEAM).$(BUNDLE_PREFIX)` — macOS denies group access
>   to app extensions unless the identifier is prefixed with the signing Team ID, and denies it
>   *silently*. `Config/Shared.xcconfig` derives `APP_GROUP` from those two settings and a build
>   phase fails the build with a readable message when `DEVELOPMENT_TEAM` is empty. A build with no
>   Team ID (ad-hoc, which is what CI produces) **cannot** ship a working widget; see M0.

---

### F2 — `logicalDate` is off by one hour on both DST transition days — **blocker**

> PLAN.md:53–55 — `- **Logical date.** `DayClock.logicalDate(for: Date) -> Day` subtracts `rolloverMinutes` (default 360) then takes the calendar date in the current zone.`

**Consequence.** "Subtracts `rolloverMinutes`" means absolute-time subtraction, which does not
survive a DST transition:

- **Spring forward**, America/New_York, 2027-03-14 (02:00 EST → 03:00 EDT). At 06:00 EDT
  (= 10:00 UTC), minus 6h = 04:00 UTC = **23:00 EST on March 13**. `logicalDate` returns **March 13**.
  The day does not roll over until 07:00 local. Everything added between 06:00 and 07:00 lands on
  the wrong day, and the morning review appears an hour late.
- **Fall back**, 2027-11-07 (02:00 EDT → 01:00 EST). At 05:00 EST (= 10:00 UTC), minus 6h = 04:00
  UTC = 00:00 EDT on Nov 7. `logicalDate` returns **November 7** an hour early.

Neither skips nor duplicates a day, so SPEC.md:635's acceptance row still passes — which is exactly
why this survives to production. It is discovered by a user on one of two days a year, and the
report ("my day flipped at 7am") is unreproducible for 51 weeks.

Separately, the rollover *timer* has a harder version of the same bug: SPEC.md:101 allows the
rollover time to be set anywhere from 12:00 AM to 12:00 PM in 30-minute steps, which includes
02:00 and 02:30 — **wall-clock times that do not exist** on spring-forward day in US zones. A naive
"next date with hour=2, minute=30" returns nothing or the wrong instant.

**Proposed replacement text:**

> - **Logical date.** `DayClock.logicalDate(for: Date) -> Day` reads the **wall-clock** hour and
>   minute of `now` in the current zone and returns that calendar date, minus one day if the
>   wall-clock time is before `rolloverMinutes`. It never does absolute-time arithmetic on `Date`,
>   because subtracting 6 hours across a DST transition lands an hour off in both directions. Day
>   arithmetic is proleptic-Gregorian on the `Day` struct, not `Calendar.date(byAdding:)`. The
>   6 AM timer is scheduled with `Calendar.nextDate(after:matching:matchingPolicy:.nextTime,
>   repeatedTimePolicy:.first)` so a rollover time inside the spring-forward gap (02:00–03:00, which
>   the 12:00 AM–12:00 PM setting range permits) still fires exactly once. `Day` is a `Codable`
>   struct of year/month/day with no time zone. Nothing else computes dates.

Two new M1 test rows follow from this and should be added to the acceptance list: *rollover time set
to 02:30 on spring-forward day → exactly one rollover*, and *logicalDate at 06:00 local on both
transition days → today, not yesterday*.

---

### F3 — "Runs in one transaction" describes something SwiftData does not provide — **blocker**

> PLAN.md:60 — `  one transaction. Running it twice on the same day is a no-op. A backward clock does nothing.`
> PLAN.md:15 — `   widget never conflict. Rollover is one transaction and is idempotent.`

**Consequence.** Claude Code reads "one transaction", finds `ModelContext.transaction(_:)`, uses it,
and writes a test asserting that a throw mid-rollover leaves the store untouched. That test will
pass in-memory and the behaviour will be wrong on disk: `transaction(_:)` saves at the end and does
**not** roll back on error, and after a thrown `save()` the dirty objects stay registered on the
context, so the *next* unrelated save silently flushes the half-finished rollover. Discovered: by a
user, once, as a day that is half-closed — the exact state SPEC.md:629 says must be impossible.

**Proposed replacement text** (replacing the last sentence of the Rollover bullet and PLAN.md:15):

> Rollover runs on a dedicated `ModelContext` with `autosaveEnabled = false`: every step mutates
>   only in memory, and a single `save()` at the end commits the whole day atomically (one SQLite
>   transaction). Any error calls `rollback()` and discards the context. SwiftData's
>   `ModelContext.transaction(_:)` is **not** used — it does not roll back on error. A crash before
>   the save persists nothing; there is no rollback after it, so idempotency is a guard
>   (`AppState.lastOpenedLogicalDay` written inside the same save), not a cleanup pass. Running it
>   twice on the same day is a no-op. A backward clock does nothing.

---

### F4 — "the app and the widget never conflict" is false; one actor cannot serialise two processes — **blocker**

> PLAN.md:14–15 — `3. **One store actor.** All writes go through `Store` (an actor over SwiftData) so the app and the widget never conflict.`
> PLAN.md:68 — `- **Store.** `actor Store` owns the `ModelContainer` in the App Group container`

**Consequence.** The app and the widget extension are separate processes with separate
`Store` instances, separate `ModelContainer`s and separate SQLite connections onto the same file. An
actor gives mutual exclusion *within* a process and nothing across processes. The two known failure
modes: (a) both processes opening the store simultaneously and both attempting the same lightweight
**migration** — a documented race that errors one or both; (b) the widget's App Intent writing while
the app has the day loaded, after which the app shows stale data indefinitely because nothing told
it to refetch — directly violating SPEC.md:663 ("App list updates within 1 second"). Discovered:
M7, or worse, after release, as "the widget checkbox doesn't do anything until I restart the app".

**Proposed replacement text** (PLAN.md §2 Store bullet, and PLAN.md:14):

> - **Store.** `@ModelActor actor Store` owns a `ModelContext` bound to a serial executor (a plain
>   Swift actor does **not** give `ModelContext` the thread confinement it needs) and exposes
>   intent-shaped methods (`add`, `complete`, `move`, `drop`, `reorder`, `runRollover`,
>   `snapshotForWidget`). Methods take and return `Sendable` value types only — `@Model` instances
>   never cross the actor boundary. The **app** is the only writer by default; the widget opens the
>   store **read-only**. The one exception is the widget's checkbox App Intent, which is scoped to a
>   single `complete(TaskID)` and, after writing, posts a Darwin notification that the app observes
>   and refetches on. Cross-process serialisation is that one convention plus SQLite's own locking —
>   the store actor does not and cannot provide it.

---

### F5 — The M0 gate conflates three signing environments and never tests a second Mac — **blocker**

> PLAN.md:79 — `| 0 | `m0-scaffold` | Xcode project, two packages, CI, xcconfig, App Group spike | `swift test` runs empty; Dock icon appears; **widget App Group works or is ruled out under free signing** (decides whether the prebuilt zip ships the widget) |`

**Consequence.** "Works under free signing" will be answered by running from Xcode on the builder's
own Mac — the one environment where it is most likely to work and least likely to matter. The
question the gate is *for* ("does the prebuilt zip ship the widget?") is about a CI-built, ad-hoc,
downloaded, de-quarantined bundle on a Mac that has never heard of the builder's team. A green M0
that only tested Xcode is a false green that costs M7 and M9.

**Proposed replacement text** (M0 "Done when" cell):

> `swift test` runs empty; Dock icon appears; **`docs/m0-signing.md` records three separate
> results** — (E1) widget reads the group container when run from Xcode under a free Personal Team;
> (E2) the same build ad-hoc signed, as CI produces it; (E3) a zip of the E1 build, de-quarantined
> and launched on a second Mac not registered to the builder's account. E1 gates M7. E2/E3 decide
> whether `scripts/release.sh` includes the widget target, and that switch is written in M0.

---

### F6 — A repeating notification's body cannot be refreshed; the spec's morning text is unreachable — **blocker**

> PLAN.md:141 — `| Notifications when the app is closed | Scheduled daily trigger with refreshed body in M6; test by quitting and waiting |`

**Consequence.** `UNNotificationContent` is fixed when the request is scheduled and a repeating
trigger reuses it forever. After a weekend, Monday's 6 AM notification says whatever Friday's app
session computed. Worse, the milestone's own acceptance test ("quit and wait") **passes** on day one
— the bug only appears on the second delivery, which is 24 hours later and outside the test loop.
Also note this is a SPEC.md interpretation, not just a PLAN one: SPEC.md:381 asserts the same
mechanism, and that line needs the same correction.

**Proposed replacement text** (PLAN.md §6 risk row):

> | Notifications when the app is closed | M6 schedules a rolling 7-day queue of **non-repeating**
> dated requests, each body computed at scheduling time from `RolloverEngine.preview(for:)` (added
> in M1) and the whole queue rewritten on launch, wake and mutation. A repeating trigger cannot be
> used: its content is frozen when scheduled. Test by quitting and waiting **two** mornings, and by
> changing task counts after quitting. |

---

### F7 — `WidgetCenter` in `DailyCore` breaks the no-UI-import rule and `swift test` — **should-fix**

> PLAN.md:70 — `  Every mutation also calls `WidgetCenter.reloadTimelines`.`

**Consequence.** `WidgetKit` transitively imports SwiftUI, so putting this call in `Store` puts a UI
framework inside `DailyCore`, contradicting CLAUDE.md's first architecture rule and PLAN.md:8. It
also makes `swift test --package-path Packages/DailyCore` run WidgetKit code in a non-app process
where `WidgetCenter` has no host — at best a no-op, at worst a hang or a log storm on every test
run. Separately, "every mutation" during a 500-task drag-reorder is hundreds of reload requests in a
few seconds. The good news: **macOS has no daily widget reload budget** (unlike iOS's ~72/day), so
this is a waste-and-layering problem, not a correctness one. (Source: [Does widgets on Mac have
timeline reload budget or limit?, Apple Developer Forums](https://developer.apple.com/forums/thread/711091).)

**Proposed replacement text:**

> Mutations publish a `storeDidChange` event; the **app target** (not Core — `WidgetKit` imports
>   SwiftUI and `DailyCore` has no UI imports) observes it and calls
>   `WidgetCenter.shared.reloadTimelines(ofKind:)` **coalesced on a ~250 ms trailing debounce**, so
>   a drag-reorder is one reload and not two hundred. macOS imposes no daily reload budget, but a
>   reload is still a process launch. Rollover issues exactly one reload, after its save commits.

---

### F8 — Undo as a closure registered with a window's UndoManager does not survive the actor or the widget — **should-fix**

> PLAN.md:71 — `- **Undo.** Each mutation returns an inverse closure registered with the window's `UndoManager`.`

**Consequence.** Three concrete breakages, all discovered late: the closure must be `@Sendable` to
leave the actor and must not capture a `@Model` (which is what an "inverse" naturally wants to
capture); a widget App Intent's `perform()` runs in the extension process where there is no window
and no `UndoManager`, so CLAUDE.md's "every mutation is undoable" is simply false there and M7 will
either violate the rule or grow an unplanned `ForegroundContinuableIntent` redesign; and nothing
clears the undo stack at rollover, so ⌘Z after 6 AM can un-complete a task whose `DayRecord` is
already frozen, permanently desynchronising streaks from history with no error.

**Proposed replacement text:**

> - **Undo.** Each mutation returns a `Sendable` `InverseAction` **value** (not a closure, and never
>   capturing a `@Model`); the app layer — not Core — turns it into an `UndoManager` registration on
>   the key window. The undo stack is cleared in the same place rollover commits, because undoing
>   across a frozen `DayRecord` would desynchronise history from tasks. Mutations originating in the
>   widget's App Intents are **not** undoable unless the intent conforms to
>   `ForegroundContinuableIntent` and runs in the app process; M7 decides which, and CLAUDE.md's
>   "every mutation is undoable" is scoped to app-originated mutations.

---

### F9 — macOS is not a Dynamic Type platform — **should-fix**

> PLAN.md:140 — `| Custom fonts and Dynamic Type | `.custom(_:size:relativeTo:)` in the theme; check Larger Text in M2 |`

**Consequence.** `relativeTo:` compiles and does nothing measurable on macOS; `UIFontMetrics` does
not exist there; `@Environment(\.dynamicTypeSize)` is not driven by a Mac-wide user setting for
third-party apps. The "check Larger Text in M2" step will therefore *pass by looking unchanged*,
which is indistinguishable from a correct pass, and the app ships with a fixed type scale that the
M9 accessibility pass then has to reckon with across every component and every snapshot baseline.

**Proposed replacement text:**

> | Custom fonts and text size | macOS has no Dynamic Type (`UIFontMetrics` is iOS-only and
> `relativeTo:` has nothing to scale against). The `Theme` protocol therefore carries its own
> `typeScale` factor, driven by a text-size control in Settings, decided **at the start of M2**
> before any component is written. Verify in M2 by screenshotting one component at each scale step,
> and separately check whether macOS 26's Accessibility ▸ Display ▸ Text size moves
> `\.dynamicTypeSize` at all — if it does, drive `typeScale` from it. |

---

### F10 — macOS widget rendering modes are not "tinted and clear", and the 6 AM entry needs a pure projection — **should-fix**

> PLAN.md:86 — `| 7 | `m7-widget` | WidgetKit widget | Small/medium/large; App Intent checkboxes; timeline entry at next rollover; renders in tinted and clear styles without color-only meaning |`

**Consequence.** "Tinted and clear" is iOS 18 Home Screen vocabulary. On the Mac desktop the
relevant environment value is `\.widgetRenderingMode` and the mode that strips colour is
`.vibrant` (the monochrome look a desktop widget takes when an app is frontmost); `.accented` and
`widgetAccentable()` do not apply the same way. Building and testing against the wrong mode means
the colour-independence requirement is verified against a rendering the Mac never produces.
Separately, "timeline entry at next rollover" requires computing tomorrow's task list from a
read-only process — the widget cannot run rollover, because rollover writes.

**Proposed replacement text:**

> Small/medium/large; App Intent checkboxes (S8 decides which process runs them); a timeline entry
> at the next rollover built from `RolloverEngine.preview(for:)` — the widget must never run
> rollover, which writes — with `.after(nextRollover)` as the reload policy; verified legible in
> **both `\.widgetRenderingMode` values the Mac desktop produces (`.fullColor` and `.vibrant`)**,
> with no meaning carried by colour alone. Note a sleeping Mac refreshes on wake, not at 06:00.

---

### F11 — Launch at login and notification permission are both signature-and-location sensitive — **should-fix**

> PLAN.md:85 — `| 6 | `m6-system` | Notifications, Dock, Settings, floating icon | All four notification types with refreshed text; badge modes; Dock menu with five tasks; Settings window (every setting in the spec); launch at login; floating `NSPanel` icon behind a setting (try for a week, then keep or cut) |`

**Consequence.** M6 is the milestone where the free-signing route collides with the OS twice.
`SMAppService.mainApp.register()` is reported to care about the app's signature and bundle location,
and the target user's app lives in `~/Downloads` with an ad-hoc signature and a stripped quarantine
flag — precisely the configuration most likely to fail. `UNUserNotificationCenter.requestAuthorization`
has the same shape of problem on macOS for bundles LaunchServices does not consider properly
registered. If either fails, M6's deliverable is unachievable *for the app's actual distribution
channel* while passing perfectly when run from Xcode.

**Proposed replacement text** (appended to the M6 "Done when" cell):

> …launch at login via `SMAppService` **verified from `/Applications`, from `~/Downloads`, and from
> Xcode's DerivedData** (S7), with a Settings affordance and a README step if it requires
> `/Applications`; notification authorization verified on an ad-hoc-signed, de-quarantined build
> (S5), with a visible "notifications unavailable" state in Settings if it is refused; floating
> `NSPanel` (`.nonactivatingPanel`, `level = .floating`, `collectionBehavior` with
> `.canJoinAllSpaces` and `.fullScreenAuxiliary`) behind a setting.

---

### F12 — `Day` has no stated inverse, and "the current zone" is captured, not tracked — **should-fix**

> PLAN.md:54–55 — `  (default 360) then takes the calendar date in the current zone. `Day` is a `Codable` struct of year/month/day with no time zone. Nothing else computes dates.`

**Consequence.** Three things need to convert a `Day` *back* to a `Date` — the due-time notification
scheduler, the history heat map, and JSON export/import — and "nothing else computes dates" gives
them no sanctioned way to do it, so three different files will each pick a time zone. Two more
specifics: if `DayClock` stores `Calendar.current` at construction it will not notice
`NSSystemTimeZoneDidChange` (SPEC.md:519 says the app listens for it), so the New-York-to-LA
acceptance row (SPEC.md:632) fails in a way unit tests with an injected clock will not catch; and if
the user's system calendar is Japanese, Buddhist or Hebrew, `Calendar.current`'s year/month/day are
not Gregorian and the `Day` struct silently stores something the heat map cannot lay out.

**Proposed replacement text** (appended to the Logical date bullet):

> `DayClock` also owns the **inverse**, `date(for: Day, atMinutes: Int) -> Date` — used by due-time
>   notifications, the history heat map and export — so time zone is applied in exactly one place.
>   It computes against `Calendar(identifier: .gregorian)` with `timeZone` read from
>   `TimeZone.autoupdatingCurrent` **at each call**, never captured at init, so a mid-day time zone
>   change is picked up; the user's system calendar (which may not be Gregorian) is used only for
>   *display* formatting, never for storage.

---

### F13 — `RecurrenceRule` as written does not compile, and cannot be queried — **should-fix**

> PLAN.md:66–67 — `- **Recurrence.** `RecurrenceRule` enum: `.daily`, `.weekdays`, `.weekdays(Set<Weekday>)`, `.everyNDays(n, from: Day)`, `.monthly(dayOfMonth)` with clamp-to-last-day.`

**Consequence.** `case weekdays` and `case weekdays(Set<Weekday>)` in the same enum is an invalid
redeclaration — M1 stops on a compile error in its first hour, and whoever fixes it invents a name,
and the invented name is what the spec's tests then encode. Second and larger: a `Codable` enum with
associated values persisted as a SwiftData attribute **cannot be used in a `#Predicate`**, so
"fetch every template whose rule fires today" must fetch all templates and filter in memory. That is
fine at 50 templates and is a choice, not an accident — but it should be a choice made in M1 rather
than a surprise in M4's fetch code.

**Proposed replacement text:**

> - **Recurrence.** `RecurrenceRule` enum: `.daily`, `.weekly(Set<Weekday>)` (with `.weekdays` as a
>   static convenience for Mon–Fri, **not** a second case of the same name), `.everyNDays(n, from: Day)`,
>   `.monthly(dayOfMonth)` with clamp-to-last-day. `nextOccurrence(after:)` only. The rule persists
>   as a `Codable` attribute and therefore **cannot appear in a `#Predicate`**: recurring templates
>   are fetched whole and matched in memory, which is bounded by template count, not task count.

---

### F14 — A blank `DEVELOPMENT_TEAM` must fail the build, not the widget — **should-fix**

> PLAN.md:31 — `├── Config/Shared.xcconfig      # TEAM_ID blank; BUNDLE_PREFIX = com.<you>.todew`

**Consequence.** Per F1, `APP_GROUP` must interpolate `DEVELOPMENT_TEAM`. With it blank — which is
the committed state and therefore the state of every fresh clone — the entitlement becomes
`.com.<you>.todew`, the app builds and launches and looks fine, and only the widget is broken, in
the silent way. The first-time contributor experience is "I followed the README and the widget is
empty" with nothing in any log to explain it.

**Proposed replacement text:**

> `├── Config/Shared.xcconfig      # DEVELOPMENT_TEAM blank; BUNDLE_PREFIX = com.<you>.todew;`
> `│                              #   APP_GROUP = $(DEVELOPMENT_TEAM).$(BUNDLE_PREFIX)`
> `│                              #   (a run-script phase fails the build if DEVELOPMENT_TEAM is empty)`

---

### F15 — The clock closure and the Swift language mode are both unstated — **nit**

> PLAN.md:16–17 — `4. **Injected clock.** `DayClock` takes a `now: () -> Date`; tests simulate sleep gaps, DST and time-zone jumps.`

**Consequence.** A bare `() -> Date` stored in a type that an actor holds is a non-`Sendable`
capture; under Swift 6 language mode (the default for a project created with Xcode 26) that is a
compile error, and the path of least resistance is to downgrade the module to Swift 5 mode — which
then quietly disables strict-concurrency checking for the one module where `@Model`, actors and
cross-process access make it most valuable. M0 should pin the language mode explicitly rather than
letting M1 choose it under pressure.

**Proposed replacement text:**

> 4. **Injected clock.** `DayClock` takes a `now: @Sendable () -> Date` and a
>    `timeZone: @Sendable () -> TimeZone`; tests simulate sleep gaps, DST and time-zone jumps.
>    Both packages build in **Swift 6 language mode** (set in M0, in `Package.swift` and the
>    xcconfig) — SwiftData, actors and a widget process make strict concurrency checking worth the
>    friction.

---

### F16 — "Neutral" is defined by task count, but an unopened day looks like a failure — **nit**

> PLAN.md:61–63 — `- **Streaks.** `StreakCalculator` reads only `DayRecord`s. A day with `totalCount == 0` is neutral.`

**Consequence.** A user away for four days returns to four `DayRecord`s with `totalCount > 0`
(carried tasks) and `doneCount == 0`, so the streak is broken by an absence rather than by a
failure. This is a product question, not a platform one, but it lands as a Core test in M1 and it is
cheaper to state now than to relitigate after `StreakCalculator` is written and tested.

**Proposed replacement text:**

> A day with `totalCount == 0` is neutral, and so is a day the app was never opened on (the
>   `DayRecord` records `wasReviewed: false`); neutral days are skipped when walking the streak, not
>   treated as breaks. Current streak = consecutive successful days ending yesterday, +1 if today
>   has a completion.

---

### F17 — CI needs a macOS 26 runner and the Xcode 26 toolchain for `swift test` — **nit**

> PLAN.md:48 — `└── .github/workflows/ci.yml    # swift test on DailyCore/DailyUI each push; release zip on tags`

**Consequence.** `swift test` on a package whose platform is `.macOS(.v26)` and which imports
SwiftData needs the Xcode 26 toolchain selected, not just any Swift; and `DailyUI`'s snapshot tests
need a runner that can render SwiftUI. If the workflow does not pin `xcode-select` and the runner
image, CI goes red on a toolchain mismatch in M0 and someone "fixes" it by lowering the deployment
target.

**Proposed replacement text:**

> `└── .github/workflows/ci.yml    # runs-on: macos-26 with an explicit xcode-select to Xcode 26;`
> `                               #   swift test on DailyCore/DailyUI each push; release zip on tags`
> `                               #   (the zip is ad-hoc signed — see M0: it cannot carry a working widget)`

---

## 5. Sources

- [App Groups Entitlement — Apple Developer Documentation](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.application-groups)
- [macOS App Group Entitlements — Apple Developer Forums (thread 762639)](https://developer.apple.com/forums/thread/762639) — the three-way macOS rule, quoted from the Sequoia release notes
- [WidgetKit with SwiftData on macOS — Apple Developer Forums (thread 767581)](https://developer.apple.com/forums/thread/767581) — `group.` prefix silently denied to extensions; `<TeamID>.` prefix required
- [SwiftData ModelConfiguration with GroupContainer shows Data Access alert on every launch — Apple Developer Forums (thread 759310)](https://developer.apple.com/forums/thread/759310) — the consent-alert half of the same rule
- [Does widgets on Mac have timeline reload budget or limit? — Apple Developer Forums (thread 711091)](https://developer.apple.com/forums/thread/711091) — no daily reload budget on macOS
- [Using Transactions Instead of Save in SwiftData and Core Data — fatbobman](https://fatbobman.com/en/posts/using-transactions-instead-of-save-in-swiftdata-and-core-data/)
- [How to rollback changes without saving — Hacking with Swift](https://www.hackingwithswift.com/quick-start/swiftdata/how-to-rollback-changes-without-saving)
- [How SwiftData works with Swift concurrency — Hacking with Swift](https://www.hackingwithswift.com/quick-start/swiftdata/how-swiftdata-works-with-swift-concurrency) — `ModelContainer` is `Sendable`, `ModelContext` is not
- [SwiftData's ModelActor Is Just Weird — Michael Tsai](https://mjtsai.com/blog/2025/08/26/swiftdatas-modelactor-is-just-weird/) — `@ModelActor` captures its executor from the construction context
- [How to access a SwiftData container from widgets — Hacking with Swift](https://www.hackingwithswift.com/quick-start/swiftdata/how-to-access-a-swiftdata-container-from-widgets)
- [UNCalendarNotificationTrigger — Apple Developer Documentation](https://developer.apple.com/documentation/usernotifications/uncalendarnotificationtrigger)
- [Scheduling and Handling Local Notifications — Apple (archived)](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/SchedulingandHandlingLocalNotifications.html) — content fixed at schedule time
- [How do you support Preferred Font Size / Dynamic Type on macOS? — Apple Developer Forums (thread 818858)](https://developer.apple.com/forums/thread/818858)
- [Adapting widgets for tint mode and dark mode in SwiftUI — Create with Swift](https://www.createwithswift.com/adapting-widgets-for-tint-mode-and-dark-mode-in-swiftui/) — `fullColor` / `accented` / `vibrant`
- [SMAppService — Apple Developer Documentation](https://developer.apple.com/documentation/servicemanagement/smappservice)
- [Signing With a Free Personal Team — takazudomodular](https://takazudomodular.com/pj/zudo-tauri/docs/mobile/ios-signing-free-team/) — 7-day profile expiry; entitlement-backed capabilities blocked for free teams
- [Provisioning profile doesn't include device — Apple Developer Forums (thread 99646)](https://developer.apple.com/forums/thread/99646) — `ProvisionedDevices` enforcement at launch
