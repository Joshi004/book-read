# Highlights & Notes — Brainstorm

Status: **pre-development discussion**, not a spec. Goal is to shake out product shape and engineering approach before writing code.

## 1. What we're building (one paragraph)

A reader can select a run of text inside a chapter, mark it as a highlight, and optionally attach a short personal note to it. The highlighted text renders visually distinct wherever it appears in the chapter. A dedicated **Highlights** page lists every highlight/note across the whole book, and clicking one jumps straight to that exact spot in its chapter.

---

## 2. Product perspective

### 2.1 Core user flows

**Create a highlight**
1. Reader selects text in the chapter body (a phrase, sentence, or a few sentences).
2. A small floating toolbar appears near the selection (like Kindle/Medium) with actions: *Highlight*, *Highlight + note*.
3. Choosing *Highlight* immediately marks the text (background tint) and saves it.
4. Choosing *Highlight + note* opens a small inline popover/textarea to type a note, then saves both together.

**View a highlight in-chapter**
- The marked text stays visually tinted permanently (not the ephemeral 2.5s `<mark>` used today for search results — this is a persistent state).
- Hovering or tapping an existing highlight shows its note (if any) in a small popover/tooltip, plus edit/delete actions.

**Edit / remove**
- Tap an existing highlight → popover with "Edit note," "Change color" (optional), "Remove highlight."
- Removing just un-marks the text; the underlying chapter content is never touched.

**Browse all highlights — the Highlights page**
- New page (e.g. `/highlights`), alongside `/dashboard`, reachable from the sidebar/nav.
- Shows every highlight across the book, grouped by chapter (reverse-chronological within a chapter, chapters in book order — mirrors how `SearchDialog` groups hits by chapter today).
- Each entry shows: quoted excerpt (with the highlighted span visually marked inline in the excerpt), the note if present, chapter + rough position (e.g. "Chapter 12 — under 'Escalation Loops'"), and a timestamp.
- Clicking an entry navigates to `/chapter/12?...` and auto-scrolls to that exact highlighted span, briefly drawing extra attention to it (flash/pulse), the same pattern `ChapterReader` already uses for search deep-links.
- Optional filters: by chapter, "notes only" vs "highlights only," search within highlight text/notes.

### 2.2 Open product questions worth deciding before building

- **Multi-block selections.** Can a highlight span across two paragraphs, or is it constrained to a single block (one paragraph/list item/blockquote)? Constraining to a single block is much simpler and matches how the existing block-id system already segments content — recommend starting there and treating "spans multiple blocks" as a v2 nice-to-have, or auto-splitting a cross-block selection into N adjacent highlights.
- **Colors.** One highlight color, or a small palette (like Kindle's yellow/blue/pink/orange) so a reader can categorize highlights (e.g. "agree" vs "to revisit")? Suggest starting with one accent color, add palette later if requested.
- **Storage scope.** Is this per-device (localStorage, like reading progress today) or does it need to sync across devices/accounts? The existing reading-progress feature is local-only; recommend matching that for v1 — no login system exists yet, and adding one is a much bigger lift than the highlighting feature itself.
- **Export / share.** Any need to export highlights (e.g. copy all notes for Chapter 5, or share a highlight as a quote)? Not required for v1, but the data model should not make it hard later.
- **What counts as "content"?** Only prose paragraphs, or also callouts, blockquotes, table cells? The existing block-id plugin already assigns ids to all of these, so technically all are selectable — worth deciding if callouts (which are already visually distinct) should be excluded from highlighting to avoid visual clutter.

---

## 3. Engineering perspective

### 3.1 What already exists that this can build on

The app already solves the hard part of "point at an exact spot in a chapter" for search:

- **Stable block ids** (`src/content/blockIds.js`): a remark plugin gives every paragraph/list-item/blockquote/table-cell/callout a content-hashed `data-block-id`, assigned identically at build time (search index) and render time (browser DOM). This means a highlight can be anchored to `{ blockId, startOffset, endOffset }` and reliably re-found in the live DOM later — no fragile CSS selectors or fragile line numbers.
- **Deep-link-to-block navigation** (`ChapterReader.jsx`): already knows how to take a `blockId` (+ term/offset) from a URL/router-state, scroll it into view, and temporarily wrap it in a `<mark>`. The Highlights page → chapter navigation is the same mechanism, just triggered from a different origin (Highlights list instead of Search results) and persistent instead of ephemeral.
- **A working "wrap a text range in a `<mark>`" utility** (`src/components/highlightBlock.js`): currently does word-boundary term matching for search hits. Persistent highlights need a variant that wraps an arbitrary character range within a block (not a word-boundary term) — a simpler version of the same DOM Range + TreeWalker technique.
- **A localStorage-backed store + Context pattern already proven twice** (`readingPrefs.jsx`, `readingStore.js` + `ReadingTrackerContext.jsx`): versioned blob, throttled snapshot commits, debounced persistence, flush-on-visibility-change. A `highlightsStore.js` + `HighlightsContext.jsx` should mirror this shape almost exactly rather than inventing a new persistence pattern.

So the engineering lift is smaller than it looks — it's largely new UI (selection toolbar, popover, Highlights page) wired onto existing anchoring/navigation infrastructure, plus one new store.

### 3.2 Data model (sketch)

```js
// one highlight
{
  id: 'hl_<random>',
  chapterNumber: 12,
  blockId: 'b3f2a91c',       // from data-block-id, stable across edits
  blockTextSnapshot: 'The moment escalation begins...', // full block text at creation time
  startOffset: 14,           // char offset into block's flattened textContent
  endOffset: 42,
  quotedText: 'escalation begins the moment trust erodes', // for display on the Highlights page without re-rendering the chapter
  note: '',                  // optional
  color: 'default',          // reserved for future palette
  createdAt: 1737312000000,
  updatedAt: 1737312000000,
}
```

Persisted shape mirrors `readingStore.js`: `{ version, highlights: { [id]: Highlight } }`, plus maybe a `byChapter` index derived at read time (not stored, per the existing "never store denormalized" discipline in that file).

### 3.3 Anchoring & re-finding text — the interesting problem

Two related but distinct needs:

1. **Locate the block.** Solved already — `data-block-id` is stable across edits because it's a content hash, same system search already relies on.
2. **Locate the exact character range inside that block**, and survive the block's text changing slightly (e.g. a typo fix). Options, roughly in order of complexity:
   - **Offset-only (simplest):** store `startOffset`/`endOffset` against `textContent`. Breaks silently if the block text changes at all before those offsets. Acceptable for v1 given chapters are mostly static prose after publishing, but should degrade gracefully — see below.
   - **Offset + snapshot text verification:** also store `blockTextSnapshot`. At render time, confirm `blockTextSnapshot === current block textContent`; if it still matches, offsets are trusted and applied directly. If it doesn't match, fall back to re-locating `quotedText` via `findOccurrences` (already exists in `textMatch.js`) inside the new text — same "resilient re-anchoring" idea already implicitly needed for search. If that also fails (the sentence was removed), mark the highlight as "orphaned" — still listed on the Highlights page with its quoted text and note, but flagged as no longer found in the chapter, rather than silently disappearing or crashing.
   - This mirrors a well-known problem (web annotation tools like Hypothesis solve it with fuzzy re-anchoring); we don't need something that sophisticated given single-author, slowly-changing chapter content — snapshot-match-then-fallback is enough.

### 3.4 Rendering persistent highlights in the chapter

- New CSS class distinct from the ephemeral `mark.search-hit-highlight` (e.g. `mark.reader-highlight`), so the two visual treatments (temporary "here's your search result" flash vs. permanent "you highlighted this") don't collide if both are ever active on the same block.
- On chapter mount (in `ChapterReader.jsx`, alongside the existing pending-block-scroll effect), after the Markdown renders: query all blocks that have a highlight in the store for `chapter.number`, and wrap each one's range using a new `applyPersistentHighlight(el, startOffset, endOffset)` helper (a generalization of the range-wrapping logic already in `highlightBlock.js`, minus its word-boundary/term-matching parts).
- Needs to re-run whenever highlights change (new one added, one deleted) — driven by the highlights Context snapshot, same re-render-on-snapshot-change pattern `ReadingTrackerContext` already uses.

### 3.5 Selection → toolbar → save flow

- Listen for `selectionchange`/`mouseup` scoped to the chapter's prose container (`BookProse` ref, already available in `ChapterReader`).
- On a non-empty selection fully contained within a single `[data-block-id]` element, compute the offsets via the same TreeWalker-based position math already used in `highlightBlock.js`, and show a small floating toolbar positioned at the selection's bounding rect.
- Selections spanning multiple blocks: for v1, either disable the toolbar (only single-block selections are highlightable) or clip to the first block — a product decision (see 2.2).
- Saving calls into `HighlightsContext` (`addHighlight(...)`), which persists via the same debounced-save pattern as reading progress.

### 3.6 The Highlights page

- New route `/highlights` in `App.jsx`, new `src/pages/HighlightsPage.jsx`, structurally similar to `DashboardPage.jsx` (MUI `Box`/`Stack` layout, grouped-by-chapter like `SearchDialog`'s `groupHits`).
- Each row needs: chapter title/number, quoted excerpt with the highlighted span shown inline (reuse the ephemeral `<mark>` styling here, since it's just for display, not live DOM anchoring), note text if present, created date, and a link to `/chapter/:number?block=<blockId>&hl=<highlightId>`.
- Chapter navigation reuses the existing pending-deep-link mechanism in `ChapterReader.jsx` (currently keyed on `block`/`term`/`occ` query params) — extend it to also accept a `hl` param that, once landed, gives that specific highlight the "just navigated here" pulse treatment instead of drawing a temporary mark from scratch.
- Empty state (no highlights yet) mirrors `DashboardPage`'s "No reading tracked yet" pattern.

### 3.7 Suggested build order

1. `highlightsStore.js` (pure data module: shape, load/save, `orphaned` detection) + `HighlightsContext.jsx` — copy the proven pattern, no UI yet.
2. Render-only: given a few hand-seeded highlights in the store, get them showing as persistent marks in a chapter on load (proves the anchoring + rendering path end-to-end).
3. Selection toolbar + save flow (create highlights interactively).
4. Edit/delete popover on existing highlights.
5. Highlights page + deep-link navigation from it.
6. Polish: orphaned-highlight handling, empty states, note editing UX.

### 3.8 Risks / things to watch

- Selection UX on mobile (touch selection + floating toolbar positioning) is fiddlier than desktop — worth an explicit test pass, this app is clearly used on mobile too (PWA, service worker present).
- Chapter content does get edited after publishing (the block-id scheme was explicitly designed for that) — the orphaned-highlight fallback in 3.3 is not optional polish, it's load-bearing for a book that's still being written/edited chapter by chapter.
- Keep the new persistent-mark styling accessible (sufficient contrast in both light/dark theme, per `theme.js`'s existing dark-mode handling) and don't let it collide visually with the existing search-hit mark or Callout styling.

---

## 4. Suggested next step

Decide the open product questions in §2.2 (especially: single-block-only highlights for v1, one color vs palette, local-only storage) — those choices materially change the scope of §3.5 and §3.3. Once decided, this doc can turn into an actual implementation plan.
