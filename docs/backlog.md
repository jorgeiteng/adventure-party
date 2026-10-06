# Backlog

Work items not yet started, ordered by id; close them by moving to "Done".

Status: `ready` — unblocked, can start now · `decide` — needs a decision first · `done` — completed

---

## Done

_None._

---

## Ready

### BL-0: Difficulty modes on the starting screen (Easy / Medium / Hard)

- **Status**: ready
- **Size**: medium
- **Requested by**: JJ
- **Detail**: The welcome screen (`index.html:29-33`, dismissed in `js/main.js:18-26`) starts the game at a single fixed difficulty. Add an **Easy / Medium / Hard** choice shown on that starting screen so the game is easier or harder for the player.
- **Sketch**:
  1. Add three selectable buttons to `#welcome` in `index.html` (plus a hidden default of Medium), styled in `css/style.css:239-266`.
  2. Store the choice on game state (`difficulty: "easy" | "medium" | "hard"`) in `createGame()` (`js/game.js`); dismiss the welcome screen only after a pick (or let "any key" start on the current selection).
  3. Define a data-driven difficulty table — monster HP/DMG/aggro, hero damage taken, respawn timings — keyed by mode, applied where specs are built (`js/monster.js`, `js/hero.js`, `js/game.js`).
  4. Reset the selection on **R** restart back to the welcome screen choice (or keep it — decide during implementation).
  5. Document the modes in `docs/gameplay.md` and bump `VERSION` (`js/main.js:6`) + `docs/README.md` together.
  6. Add assertions to `tests/test.py` (new selectors/ids; suite must stay green).
- **Acceptance**: welcome screen offers three difficulty buttons; the chosen mode measurably changes enemy/hero numbers in game; Medium matches today's balance; docs updated; `python3 tests/test.py` passes.

### BL-1: Fix version drift in docs

- **Status**: ready
- **Size**: trivial
- **Detail**: `docs/README.md:34` says `Current: 0.9`; the shipped value is `VERSION = "0.14"` in `js/main.js:6` (and `README.md:59` documents v0.6…v0.14).
- **Acceptance**: `docs/README.md` reports `0.14`; any future version bump updates `js/main.js` and `docs/README.md` together.

---

## Decide

### BL-2: Spec-Driven Development (SDD) — adopt a spec-first workflow

- **Status**: decide
- **Size**: medium
- **Problem**: There is no place to write a feature's intent and acceptance criteria before code. The only "spec" today is the data-driven kind (monster/hero/chest objects, recipes in `docs/contributing.md`), which describes *shape*, not *behavior*. No `plan*`/`spec*`/SDD files exist in the tree or git history.
- **Decision needed — pick one direction**:

  | # | Direction | Scope |
  |---|---|---|
  | 1 | **`docs/specs/` directory** (recommended) | One markdown spec per feature: intent, behavior, acceptance criteria, test mapping. Add a template and a workflow section in `docs/contributing.md`. |
  | 2 | **Lightweight** | Single `docs/spec.md` template + a convention note in `AGENTS.md`; specs written inline per feature branch. |
  | 3 | **Full SDD workflow** | Specs are the source of truth; `tests/test.py` assertions trace back to acceptance criteria; spec checklist added to the PR flow in `docs/contributing.md`. |

- **Plan (direction 1, the recommended path)**:
  1. Add `docs/specs/TEMPLATE.md` — sections: Goal, Non-goals, Behavior, Acceptance Criteria (numbered, testable), Test Mapping (ids into `tests/test.py`), Status.
  2. Add `docs/specs/README.md` — how to write and close a spec; spec id convention (`SPEC-<nn>-<slug>`).
  3. Extend `docs/contributing.md` with a **Spec-Driven Workflow** section: write spec → get agreement → implement → add assertions → tick acceptance criteria → close.
  4. Add one line to `AGENTS.md` pointing contributors at `docs/specs/` so agents write the spec before the code.
  5. Link the directory from the `docs/README.md` table of contents.
  6. Run `python3 tests/test.py` (docs-only change; must stay 235/235).
- **Open question**: backfill specs for existing features (shrine, cavern, chests, combat), or write specs for new work only? Backfill costs ~6 specs; new-work-only is cheaper but leaves the current codebase unspecced.
- **Acceptance**: `docs/specs/TEMPLATE.md` and `docs/specs/README.md` exist; `docs/contributing.md` and `AGENTS.md` describe the workflow; `docs/README.md` links it; `python3 tests/test.py` passes 235/235.

---

## Notes

- No CI exists — verification is `python3 tests/test.py` plus a manual browser check (`python3 serve.py`, console clean).
- Every new JS→JS import must carry `?v=5` (see `AGENTS.md`); doc-only items in this backlog are unaffected.
