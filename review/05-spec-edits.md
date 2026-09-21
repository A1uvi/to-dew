# 05 — `SPEC.md` edits: nine applied, four still queued

**Author:** `spec-steward` · **Proposed:** 2026-09-21 · **Partly applied:** 2026-09-21
**Status:** *9 of 13 applied. 4 remain pending — this file is still a live queue.*

## Status at a glance

| Item | Target | Status |
|---|---|---|
| 1 — dynamic text size | `SPEC.md:452–453` | **PENDING — gated on spike S6.** Not applied. |
| 2 — wallpaper light-only | `SPEC.md:450–451` | **APPLIED 2026-09-21** |
| 3a — Dock icon cut | `SPEC.md:391–392` | **APPLIED 2026-09-21** |
| 3b — answered-questions row | answered-questions table | **APPLIED 2026-09-21** |
| 4 — widget section struck | `SPEC.md:397–418`, `580–585`, `663–667`, +4d | **PENDING — gated on spike E1, currently UNKNOWN.** Not applied. |
| 5 — notification trigger | `SPEC.md:381–382` | **APPLIED 2026-09-21** |
| 6 — Escape binding | `SPEC.md:185` + keyboard table | **APPLIED 2026-09-21** (resolved now, not deferred to `2d`) |
| 7 — floating-icon milestone | `SPEC.md:799` | **APPLIED 2026-09-21** |
| 8 — build-milestone table | `SPEC.md:675–715` | **PENDING — BLOCKED, see note below.** Approved, not applied. |
| 9 — streaks and absence | `SPEC.md:318–319` | **APPLIED 2026-09-21** |
| 10 — pink star → `DayHeader` | `design/theme-sage-lily.md:81` | **APPLIED 2026-09-21**, with the inset rule added |
| A1 — logical date / DST | `SPEC.md:80–82` | **PENDING — BLOCKED, see note below.** Approved, not applied. |
| A2 — one actor, two processes | `SPEC.md:513` | **APPLIED 2026-09-21** |
| A3 — which copy is the truth | end of `SPEC.md` | **APPLIED 2026-09-21** |

## The two blocked items — approved but not applied

Both were approved. Neither was applied, because on contact the file did not match the text
recorded in the proposal, and the standing instruction is to stop on such an item rather than
improvise a replacement against text that was not expected. Each needs one line of confirmation
and then applies cleanly.

- **Item 8 — the milestone table spans a form feed.** The page break between the two halves of the
  table (`Page 17 of 20` / `To Dew: Product Spec`) contains a literal form feed character, `0x0C`,
  invisible in every rendering of this file and absent from the current-text block quoted in item 8
  below. The replacement table drops the page break entirely, which is correct for a Markdown file
  but means deleting that control character — a change nobody has explicitly approved. **To
  unblock:** confirm the form feed goes. Every other page break in `SPEC.md` carries one too, so
  the same question will recur on any future edit that spans one.
- **Item A1 — one character of drift in the quoted anchor.** The proposal quoted
  `DayClock.logicalDate(for: )`; the file says `DayClock.logicalDate(for:)`, with no space. This is
  a transcription slip in the proposal, not drift in `SPEC.md`, and the surrounding prose matches
  exactly. The proposed replacement below carries the same slip and would introduce a space that is
  not in the file. **To unblock:** confirm the replacement uses `DayClock.logicalDate(for:)`
  verbatim. This is the DST correction and it is the most consequential item in this file — the
  spec currently still specifies the arithmetic that produces the bug.

## How to use this file

Read an item, say yes or no. A later run applies only the items marked yes and updates the table
above. Items 1 and 4 are **gated on a spike** and cannot be applied until milestone 0 records its
result — approving them means pre-agreeing the outcome, not applying it today. Items 8 and A1 are
approved already and need only the confirmations noted above. Until this file is empty, assume
`SPEC.md` still says the old thing for every row not marked APPLIED.

**What the applied edits did not change.** Nothing gated on an unresolved spike entered `SPEC.md`
as a settled assertion. The type-scale claim at `SPEC.md:452–453` still reads "Dynamic text size is
supported" and stays that way until S6 reports; the widget section is untouched and still describes
a shipping widget, because E1 is unknown.

---

# The proposals

Everything below is the original text of each proposal, unchanged, so an applied item can still be
audited against what was approved.

**Mechanical notes for whoever applies these.**
- `SPEC.md` is text extracted from `design/To Dew Product Spec.pdf`, so bullets carry five leading
  spaces and lines wrap at roughly ninety characters. Replacement text below keeps that shape.
  Applying an edit shifts every later line number, so apply **bottom-up** and re-check each anchor
  against its quoted current text rather than against its line number.
- The PDF is not regenerated. `SPEC.md` is the source of truth per `CLAUDE.md`; the PDF becomes the
  historical formatted copy, and a note to that effect is item **A3**.
- Counts: **11 proposals against `SPEC.md`** (9 unconditional, 2 gated on a spike) and **1 against
  `design/theme-sage-lily.md`** (unconditional). Items **A1–A3** are additions I found while
  checking anchors; they were not in the handover and are marked so.

---

## 1. Dynamic text size — `SPEC.md:452–453`

> **PENDING — gated on spike S6. Not applied.**

**Gated on spike S6 (`docs/m0-textsize.md`), milestone 0.** Human decision D2.

**Current text (lines 452–453):**

```
     Typography. Text uses semantic styles (title, body, caption) mapped in the theme, so a
     custom font can be swapped in later. Dynamic text size is supported.
```

**Proposed replacement — apply only if S6 records that the system control does *not* move a
third-party app:**

```
     Typography. Text uses semantic styles (title, body, caption) mapped in the theme, so a
     custom font can be swapped in later. The app ships a fixed type scale. macOS has no
     Dynamic Type for third-party apps, and the system text-size control was checked at
     milestone 0 and found not to move one; the scale is the theme's, not the system's.
```

**If S6 comes back positive** — that is, if the macOS 26 Accessibility ▸ Display ▸ Text size
control demonstrably resizes a third-party app's text — **do not apply this edit.** Line 452–453
stands as written, the claim is true, and the work of honouring it lands in `2a` with the rest of
the type scale. In that case the only change needed is a sentence naming what the app scales
against, which the `2a` PR proposes with the evidence in hand. Either way the decision is made in
`2a` **before any component is written**, because a scale factor changes the `Theme` protocol's
shape and deciding late means editing every component and re-recording every snapshot baseline.

**Rationale.** `UIFontMetrics` is iOS-only and `Font.custom(_:size:relativeTo:)` compiles on macOS
with nothing to scale against, so "Dynamic text size is supported" is currently a promise the
platform does not let the app keep — but whether the macOS 26 control does *something* is genuinely
unverified, which is why this is gated rather than asserted.

---

## 2. The wallpaper token is light-only — `SPEC.md:450–451`

> **APPLIED 2026-09-21.**

**Unconditional.** Human decision D4.

**Current text (lines 450–451):**

```
     Light, dark and accent. Every token has light and dark values. The user's system
     accent color is respected unless the theme overrides it.
```

**Proposed replacement:**

```
     Light, dark and accent. Every token has light and dark values, with one exception: the
     wallpaper is a light-scheme decoration only, and the dark scheme uses a flat background
     instead. The user's system accent color is respected unless the theme overrides it.
```

**Rationale.** `theme-sage-lily.json` ships `wallpaper` with a light value only, so the spec
currently describes a token file that does not exist; recording the exception is one line, and what
a dark radial-gradient ground should look like is a design decision for milestone 8, not for now.

---

## 3. The Dock icon does not reflect day state — `SPEC.md:391–392` and the answered-questions table

> **APPLIED 2026-09-21 (both 3a and 3b).**

**Unconditional.** Human decision D6. **Two edits, both needed for this item.**

### 3a — the Dock section

**Current text (lines 391–392):**

```
     The Dock icon can optionally reflect the day state (clear, in progress, all done). This is a
     stretch goal, decided with the visual design.
```

**Proposed replacement:**

```
     The Dock icon does not reflect the day state. This was a stretch goal to be decided with
     the visual design; it is cut for 1.0. The layered app icon already carries the four macOS
     26 appearances, and the open count lives in the badge.
```

### 3b — the answered-questions table

**Current text (lines 790–792):**

```
   Parked ideas in 1.0?             None

   Languages                        English only
```

**Proposed replacement:**

```
   Parked ideas in 1.0?             None

   Languages                        English only

   Dock icon reflects day state?    No. Cut for 1.0; the badge carries the count
```

**Rationale.** The stretch goal routed the decision to the design phase and milestone 8 does not
mention it, so without a recorded answer the next reader re-opens a question that has been settled;
the answered-questions table is where this spec keeps settled questions.

---

## 4. The widget section — `SPEC.md:397–418` and `SPEC.md:580–585`

> **PENDING — gated on spike E1, currently UNKNOWN. Not applied.**

**Gated on spike E1 in `docs/m0-signing.md`, milestone 0. E1 is currently UNKNOWN — nobody has run
it.** Human decision D1. Apply **only** if E1 comes back **false** (a widget under a free Personal
Team cannot open a Team-ID-prefixed App Group container). **If E1 is true, none of §4 is applied**
and the widget section stands as written.

Approving this item now is the pre-agreed kill clause: it means saying yes today to striking a
spec'd feature if the spike fails, so the answer arrives at milestone 0 rather than at milestone 9.

### 4a — the Desktop widget section

**Current text (lines 397–418):** the whole `Desktop widget` section, from the heading through
`…so the core app never depends on it.` — the three-row size table (Small / Medium / Large) and the
six bullets that follow it.

**Proposed replacement — the heading is kept and the body is replaced, so the cut is legible rather
than silent:**

```
Desktop widget

     Cut before implementation. A widget is an app extension, and an extension may open a
     shared App Group container only under a Mac App Store deployment, a Team-ID-prefixed
     identifier, or an embedded provisioning profile. The milestone 0 spike found that this
     project's signing arrangement — a free Personal Team, with an ad-hoc signed zip for
     downloads — satisfies none of them, and denial is silent. There is no fallback: a
     sandboxed extension with no group container has no shared path to read, so a snapshot
     file on disk is not an option either. The widget is therefore out of 1.0 on every
     install path, source build included, and not only out of the prebuilt zip. See
     docs/m0-signing.md for the recorded result. If a paid developer account is added later,
     this section is the first thing to restore.
```

### 4b — the Distribution bullets

**Current text (lines 580–585):**

```
     Widget risk. The widget shares data through an App Group, which depends on code
     signing identity. It should work when a user builds with their own free Personal Team. It
     may not work in the ad-hoc prebuilt zip. This is unverified and is the first technical
     spike in the milestones.
     Fallback if the spike fails: the prebuilt zip ships without the widget, and the README
     says the widget needs a source build.
```

**Proposed replacement:**

```
     No widget. The widget shared data through an App Group, which depends on code signing
     identity. The milestone 0 spike found that a free Personal Team cannot satisfy the
     requirement, and that there is no shared location an extension without a group container
     can read. The stated fallback — ship the zip without the widget and tell people to build
     from source — does not work either, because the source build fails the same way. The
     README says the app has no widget and why.
```

### 4c — the two widget acceptance rows

**Current text (lines 663–667):**

```
   Task checked in the widget while the app is       App list updates within 1 second
   open

   Widget visible at 6:00 AM with the app            Widget switches to the new day on its own
   closed
```

**Proposed:** delete both rows.

### 4d — the remaining widget mentions

If §4 is applied, four other lines still promise a widget and must move in the same PR. They are
small and mechanical, listed here so none is missed: line 56 (`Extras  Desktop widget, reminders,
Dock badge, streaks` → drop `Desktop widget,`), line 78 (`history, streaks and the widget.` →
`history and streaks.`), line 507 (the Widget target bullet in the architecture list → delete), and
the widget milestone row, which item **§8** already replaces. Line 468 ("produce mockups of Today,
Morning review, History and the widget") drops its widget mockup, and milestone 0 then commits three
PNGs rather than four.

**Rationale.** The App Group identifier rule is sourced and certain; what is uncertain is only
whether a free Personal Team satisfies it locally, so the spec should not be edited on my reasoning
— it should be edited on the spike's recorded answer, and only in one direction.

---

## 5. The morning notification's text cannot be refreshed — `SPEC.md:381–382`

> **APPLIED 2026-09-21.**

**Unconditional.**

**Current text (lines 381–382):**

```
     The morning notification is scheduled as a repeating daily trigger. Its text is refreshed
     whenever tasks change, since it cannot compute counts at delivery time.
```

**Proposed replacement:**

```
     The morning notification is scheduled as a queue of single dated reminders, one per day
     for the week ahead, rather than as one repeating daily trigger. A notification's text is
     fixed when it is scheduled and cannot be computed at delivery time, and a repeating
     trigger would keep delivering the text it was created with. The queue is rewritten
     whenever tasks change, and on launch and on wake, so each morning's reminder carries
     that morning's counts.
```

**Rationale.** A repeating `UNCalendarNotificationTrigger` freezes its body at scheduling time, so
the mechanism the spec names cannot produce the behaviour the spec promises — and the obvious test
hides it, because the first delivery is correct and only the second, a day later, is stale. This
correction matches the `7b` row in `PLAN.md` §3 and the replaced risk row in §6.

---

## 6. Escape is bound to two things — `SPEC.md:185` and `SPEC.md:198`

> **APPLIED 2026-09-21.** Resolved now rather than deferred to `2d`, by the human's choice.

**Unconditional**, with one note below about timing.

**Current text (lines 183–186):**

```
     Light natural-language parsing on entry: "Call dentist 3pm" sets a due time, "!" at the
     end sets the flag, "tomorrow" or "fri" schedules it. Parsed tokens are highlighted and
     can be dismissed with Escape.
     Pasting multiple lines creates one task per line.
```

**Proposed replacement:**

```
     Light natural-language parsing on entry: "Call dentist 3pm" sets a due time, "!" at the
     end sets the flag, "tomorrow" or "fri" schedules it. Parsed tokens are highlighted and
     can be dismissed with Escape while the entry field has focus; a second Escape clears the
     field and gives up focus.
     Pasting multiple lines creates one task per line.
```

**And, in the keyboard table, current text (lines 198–199):**

```
   Return                      Edit title inline

```

**Proposed replacement:**

```
   Return                      Edit title inline

   Escape                      Cancel an inline edit, or dismiss parsed entry tokens

```

**Rationale.** Escape is currently promised to the entry field at line 185 while the inline title
edit introduced at line 198 needs it too, and the spec never says which wins; binding it by focus —
the field that has focus gets the key — is the only reading that keeps both behaviours and matches
what macOS does everywhere else.

**Note on timing.** `PLAN.md`'s `2d` row says this conflict "is resolved here and the `SPEC.md`
edit proposed in this PR". Approving this item now does not break that; it turns `2d`'s job from
*decide and propose* into *implement what was decided*, which is the cheaper order. If you would
rather see it decided against the running entry field, answer **no** here and let `2d` propose it.

---

## 7. The floating-icon milestone reference — `SPEC.md:799`

> **APPLIED 2026-09-21.**

**Unconditional.**

**Current text (line 799):**

```
     Keep or cut the floating icon after trying it in milestone 6.
```

**Proposed replacement:**

```
     Keep or cut the floating icon after trying it. It is built last in milestone 7, in its own
     pull request, and nothing depends on it, so cutting it is a revert. Decided before 1.0.
```

**Rationale.** The re-cut moved the floating icon from milestone 6 to row `7c`, so the "Still open"
list now points at the wrong milestone; naming the row rather than a bare number also records why
the decision can safely wait.

---

## 8. The build-milestone table — `SPEC.md:675–715`

> **APPROVED BUT NOT APPLIED — blocked on the form feed in the page break. See the note at the top.**

**Unconditional**, with an E1 rider (see below).

**Current text:** the `Build milestones` heading at line 675, its two-line introduction, and the
ten-row table that follows it across lines 679–715, including the page break and repeated header at
lines 685–688.

**Proposed replacement:**

```
Build milestones
Ten milestones and twenty pull requests. Lettered rows are separate pull requests inside one
milestone; a milestone closes when its last lettered row merges. Logic comes before UI and the
visual design comes last, as requested. PLAN.md holds the gate for each row — what must be
true, and the command or screenshot that settles it. This table says only what each milestone
is for; where the two disagree, PLAN.md is the one being kept current.

   #     Milestone                    What it delivers

   0     Spikes and scaffold          Repo, two packages, CI, the release script and six
                                      recorded spike results. The signing spike decides
                                      whether milestone 4 exists at all.

   1     Core logic                   1a model, clock, schema, settings · 1b parser,
                                      recurrence, streaks, statistics · 1c store, rollover,
                                      undo values. All command-line tests.

   2     Today list                   2a theme and component harness · 2b components ·
                                      2c Today, persistence, window · 2d entry, detail,
                                      mutations, undo, keyboard.

   3     Rollover and morning review  3a live rollover and its triggers · 3b the review flow.

   4     Widget                       Three sizes, interactive checkboxes, rollover-aware
                                      timeline. Exists only if milestone 0's signing spike
                                      succeeded; it is the one milestone a spike can delete.

   5     Planning views               5a navigation and Upcoming · 5b Someday and recurring
                                      templates.

   6     History and data             6a calendar, day detail, search, statistics ·
                                      6b export, import, pruning.

   7     Notifications and system     7a Settings window · 7b notifications, badge, Dock
                                      menu, launch at login · 7c floating icon, droppable.

   8     Visual design                Final theme values, motion, sounds, app icon. It
                                      changes values; it adds no new call sites.

   9     Release                      Accessibility audit, performance pass, README with
                                      screenshots, tagged 1.0 on GitHub.
```

**E1 rider.** If §4 is applied — that is, if the signing spike fails — the milestone 4 row is
deleted from this table rather than reworded, and the remaining numbers stay as they are, because
`PLAN.md` renumbers nothing when a row is deleted.

**Rationale.** The current table predates the re-cut and now contradicts `PLAN.md` §3 in six of its
ten rows — the widget sits at 7 instead of 4, planning and history are one milestone off, and
nothing signals that ten milestones is twenty pull requests — so an agent reading both documents
gets two different build orders.

---

## 9. A day the app was never opened on breaks the streak — `SPEC.md:318–319`

> **APPLIED 2026-09-21.**

**Unconditional.** Human decision D3, **settled**.

**Current text (lines 318–319):**

```
     A day with zero tasks on the list is neutral. It neither extends nor breaks the streak.
     This keeps weekends and holidays from punishing the user.
```

**Proposed replacement:**

```
     A day with zero tasks on the list is neutral. It neither extends nor breaks the streak.
     This keeps weekends and holidays from punishing the user.
     A day that had tasks and no completion is a failure and breaks the streak. This includes
     a day the app was never opened on: returning after four days away to four days of
     carried tasks is four failures, and the streak starts again. The streak measures days
     finished, not days visited. (Settled 2026-09-21. Not re-opened.)
```

**Rationale.** The spec defines neutral by task count only, which leaves the most common case —
being away, so the list carries tasks nobody touched — undefined; this records the answer where
`StreakCalculator` and its tests will be written against it in `1b`.

---

## 10. The pink star is not on an About screen — `design/theme-sage-lily.md:81`

> **APPLIED 2026-09-21**, with the greeting-inset rule folded in — see the addendum at the end of this item.

**Unconditional.** Human decision D5. **This is an edit to the design doc, not to `SPEC.md`** — it
is listed here because it came through the same review, and it is approved or refused on its own.

**Current text (line 81, the `Sticker accent` bullet — the relevant sentence is the third):**

```
- **Sticker accent** — one lily cut-out (`design/stickers/lily.png`) may sit outside the window at the bottom-right of the desktop widget/onboarding art; never inside content rows. A small pink star is used on the About screen only. Keep to one sticker per surface.
```

**Proposed replacement:**

```
- **Sticker accent** — one lily cut-out (`design/stickers/lily.png`) may sit outside the window at the bottom-right of the desktop widget/onboarding art; never inside content rows. The small pink star (`design/stickers/star-pink.png`) sits in the `DayHeader`, to the left of the greeting line, in every state of that component. Its size, offset and dark-scheme treatment are set against `design/mockups/today.png` in the milestone 2b screenshot round and are deliberately not specified here. Keep to one sticker per surface.
```

**Rationale.** There is no About screen anywhere in `SPEC.md` and none is being built, so the
sentence points the star at a surface that does not exist; the human placed it in `DayHeader`
instead, which is where `PLAN.md`'s `2b` row and §4 component table now expect it.

**Deliberately left open.** The star's size, offset and dark-scheme treatment are **not** proposed
here and must not be guessed. They are the one open metric in `2b` and are read off the mockup
during that PR's screenshot round.

---

# Additions found while checking anchors

The three below were **not in the handover.** I found them while verifying the line numbers above,
and each is a place where `SPEC.md` states as fact something `PLAN.md` was rewritten to correct —
which matters because `PLAN.md` §5 tells the agent that *`SPEC.md` wins on what the product does*.
Left alone, an agent implements the spec's version. Approve or refuse them like any other item; if
you would rather they went through a separate pass, refuse them here and nothing is lost.

## A1 — the logical-date rule as written is the DST bug — `SPEC.md:80–82`

> **APPROVED BUT NOT APPLIED — blocked on a one-character mismatch in the quoted anchor. See the note at the top.**

**Unconditional.** Not in the handover.

**Current text (lines 80–82):**

```
     Logical date. Every timestamp maps to a logical date: subtract the rollover offset
     (default 6 hours), then take the calendar date. One function,
      DayClock.logicalDate(for: ) , owns this. No other code computes dates.
```

**Proposed replacement:**

```
     Logical date. Every timestamp maps to a logical date: read the wall-clock time, take
     that calendar date, and count it as the previous day if the time is before the rollover
     hour (default 6:00 AM). It is deliberately not "subtract six hours and take the date":
     subtracting a fixed interval lands an hour wrong on both daylight-saving days. One
     function, DayClock.logicalDate(for: ) , owns this. No other code computes dates.
```

**Rationale.** The spec specifies the arithmetic, and the arithmetic it specifies is the defect the
review found — it returns the wrong day for an hour on each DST transition while still passing the
spec's own DST acceptance row, so nothing downstream catches it.

## A2 — one actor does not stop two processes conflicting — `SPEC.md:513`

> **APPLIED 2026-09-21.**

**Unconditional.** Not in the handover. **Moot if §4 is applied** — with no widget there is only one
process, and the line becomes merely imprecise rather than false.

**Current text (line 513):**

```
     All writes go through one store actor so the app and widget never conflict.
```

**Proposed replacement:**

```
     All writes go through one store actor. An actor serialises one process, not two, so the
     app is the only writer: the widget opens the store read-only, and its checkbox is the
     single exception, scoped to completing one task and announced so the app refetches.
```

**Rationale.** An actor gives mutual exclusion inside a process and none across a process boundary,
so as written the line promises a safety property that does not hold between the app and the widget
extension.

## A3 — say which copy is the source of truth — `SPEC.md`, after line 808

> **APPLIED 2026-09-21.**

**Unconditional.** Not in the handover.

**Proposed addition at the end of the file, following the existing
`## Design decisions (added 2026-09-21)` block:**

```
## About this document (added 2026-09-21)

This Markdown file is the source of truth. `design/To Dew Product Spec.pdf` is the original
formatted copy and is not regenerated when this file is edited, so where the two differ, this
file is correct and the PDF is history. Tables here were extracted from the PDF and are plainer
than the original; read the PDF when the formatting matters and this file when the content does.
```

**Rationale.** `CLAUDE.md` calls `SPEC.md` the source of truth while the PDF is the legible copy,
and once these edits land the two disagree permanently — saying so in one place prevents someone
re-extracting the PDF over the corrections.

---

*End of proposals. `SPEC.md` is unmodified as of this writing; so is
`design/theme-sage-lily.md`, and so are `PLAN.md`, `CHANGELOG.md` and `review/00`–`review/04`.*
