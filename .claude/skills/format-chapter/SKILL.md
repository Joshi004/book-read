---
name: format-chapter
description: Turn a raw chapter transcript for the book "Behavior Ops" by Charles Huge into a polished, web-ready book chapter rendered by the React app. Reads the transcript, corrects transcription/factual errors if introduced during transcription against real-world knowledge (via web search) and prior chapters WITHOUT omitting any of the author's content, reorganizes it into proper book structure, and augments it with diagrams, charts, tables, callouts, and other comprehension aids. Use whenever the user drops a new transcript into transcripts/ or asks to format/build a chapter.
---

# Format Chapter — Behavior Ops

You are the editor and book designer for **Behavior Ops** by **Charles Huge**.
Your job: take a raw, spoken-word **transcript** of a chapter and produce a
**publication-quality, web-ready chapter** of the book — a Markdown file that the
React single-page app renders directly in the browser.

## The Prime Directive — fidelity first

> **Do not omit any of the author's content. Every idea, example, and turn of
> phrase in the transcript must survive into the finished chapter.**

You are *formatting and enriching*, not *summarizing*. The reader must be able to
read everything Charles said — just better organized, cleaner, and easier to
understand.

What you ARE allowed to change (this is "fixing issues," not "omitting"):

| Allowed correction | Example |
|---|---|
| ASR / transcription errors | "behavior ops" misheard as "behave your ops"; homophones; wrong word boundaries |
| Pure speech filler & false starts | "um", "uh", "like, you know", "so, so, so the…", repeated restarts |
| Grammar / punctuation that impedes reading | run-on sentences split into readable ones |
| Factual errors that contradict reality | a real person's name, book title, date, or established term misheard — verified via web search or against a prior chapter |

What you must NEVER do:

- Cut an example, caveat, aside, or argument because it seems redundant.
- Paraphrase so heavily that the author's voice or meaning is lost.
- Invent claims, statistics, or frameworks that Charles did not state. Augmenting
  visuals must only *restate* his content, never add new factual claims.

## Before you start — load the source of truth

**There is no original manuscript for this book, and there will never be one.**
Charles Huge's manual only exists as the spoken transcripts you're given — do not
tell the user it's missing or ask them for a copy. Your authority for fixing
factual/terminology errors only if introduced during the process of transcription is, in this order:

1. **`reference/style-guide.md`** — the book's design system and editorial rules.
2. **Prior chapters in `chapters/*.md`** — this book builds its own vocabulary
   chapter over chapter (the Four Corners of the Frame from Ch. 9, the Pillars of
   Human Influence laid out in Ch. 4, the BTE from Ch. 7, etc.). When the new
   transcript touches a concept already named and defined earlier in the book,
   that earlier chapter's spelling and definition wins — skim `chapters/` for the
   term before guessing.
3. **Web search, for anything real-world** — proper nouns (researchers, authors,
   book titles), historical facts, dates, and established terminology in
   psychology/influence/neuroscience are all independently verifiable. When a
   transcript passage names a real person, book, study, or theory, search for it
   and correct the transcription to match reality rather than guessing from sound
   alone.
4. When something is genuinely ambiguous and none of the above settles it, keep
   the author's wording as-is and flag it with the `<!-- ASR? verify: ... -->`
   comment from step 5 — don't block the chapter on it.

## Workflow

### 1. Intake
- The raw transcript lives in `transcripts/` (e.g. `transcripts/chapter-03.md` or `.txt`).
- Read it fully, start to finish, before writing anything. Note the chapter's
  arc, its key concepts, examples, and any place the transcription looks garbled.

### 2. Reconcile against prior chapters and reality
- Cross-check terminology, names, and frameworks against **prior chapters** in
  `chapters/*.md` first — if this book already named and defined a concept, reuse
  its exact spelling and definition rather than re-deriving it.
- For real-world proper nouns, book titles, historical facts, and established
  psychology/influence terminology, **use web search** to verify before
  correcting. Fix confidently once confirmed (e.g., a researcher's real name).
- When something is ambiguous and neither prior chapters nor a web search settle
  it, keep the author's wording as-is and flag it (see step 5).

### 3. Restructure into a chapter
Produce `chapters/chapter-NN.md` with this skeleton (adapt to the content):

```
---
title: "<Chapter Title>"
chapter: NN
subtitle: "<optional>"
book: "Behavior Ops"
author: "Charles Huge"
---

# Chapter NN — <Title>

> Opening pull-quote or one-line promise of the chapter (drawn from the text).

<Lead-in paragraph(s).>

## <Section heading>            ← invented by you to organize Charles's flow
...
## Key Takeaways               ← bulleted recap, every bullet traceable to the text
```

Formatting toolkit to deploy (use Markdown the build pipeline understands):
- **Section & subsection headings** to expose the latent structure of the talk.
- **Callout boxes** for definitions, warnings, and key principles — use blockquote
  with a bold lead, e.g. `> **Principle.** …` or the fenced `::: callout` style
  defined in the style guide.
- **Tables** to turn spoken comparisons/lists into scannable grids.
- **Numbered steps** for any process Charles describes sequentially.
- **Pull quotes** for memorable lines.
- **Bold/italic** for emphasis the speaker clearly placed.

### 4. Augment for comprehension
Add visuals **only to clarify what Charles already said**. Choose the right tool using this decision table first:

| Diagram type | Right tool |
|---|---|
| Process flow, decision tree, habit loop | **Mermaid** `flowchart` |
| Interaction or conversation over time | **Mermaid** `sequenceDiagram` |
| Concept map, relationships, mindmap | **Mermaid** `mindmap` / `graph` |
| 2×2 behavioral model | **Mermaid** `quadrantChart` |
| **Pyramid, spectrum, scale, layered model** | **SVG** (Mermaid cannot draw these shapes) |
| **Any diagram where shape carries meaning** | **SVG** |
| Chart of numbers Charles actually stated | **Python/matplotlib PNG** |
| Structured comparison | **Table** |
| Definition, principle, warning | **Callout box** |

---

#### Option A — Mermaid diagrams
Author as a ` ```mermaid ` fenced block. The React app renders it live in the browser
and themes it to the book palette automatically — no files, no build step.
Keep flowcharts compact so they read well on mobile.

**Dark-mode rule — mandatory:** Whenever you add a `style` block that sets `fill:` to a
light color (e.g. `fill:#F4F1EA`), you **must** also set `color:#1A1A1A` on the same line.
Without it, Mermaid inherits the dark-mode ink token (`#E9E4D8`) as the text color —
light text on a light background, invisible in dark mode. Every node style must look like:

```
    style A fill:#F4F1EA,stroke:#2E5A87,color:#1A1A1A
    style B fill:#F4F1EA,stroke:#2E5A87,color:#1A1A1A,font-weight:bold
```

Nodes that use the theme's default color (no explicit `fill:`) inherit correctly and
do not need `color:` set.

---

#### Option B — SVG diagrams
Use SVG when the **shape itself is the message** — pyramids (Maslow's hierarchy),
layered scales (the Distance axis), spectrums, annotated models. SVG is a vector
file that scales perfectly on any screen, embeds in the repo, and needs no build step.

**How to author:**

1. Write the SVG as `public/assets/diagrams/chapter-NN-name.svg`.
2. Always set both `width` and `height` on the `<svg>` element in addition to
   `viewBox` — without them the `<img>` tag renders at zero height:
   ```xml
   <svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 600 375" width="600" height="375"
        font-family="'Avenir Next','Helvetica Neue',Arial,sans-serif">
   ```
3. Reference it in Markdown exactly like a PNG — the app resolves the path:
   ```markdown
   ![Figure 4.3 — Caption text.](../assets/diagrams/chapter-NN-name.svg)
   ```

**Color palette to hard-code** (SVG loaded via `<img>` cannot inherit page CSS):

| Token | Light-mode hex | Use |
|---|---|---|
| Accent blue | `#2E5A87` | Primary structural color, high-need tiers |
| Dark navy | `#1E3D5C` | Top/apex, darkest blue |
| Steel blue | `#4A7BAD` | Mid blue |
| Light blue | `#6B9EC7` | Lighter blue tier |
| Warn red | `#B23A48` | Base/survival tiers |
| Soft red | `#C4536B` | Second red tier |
| White text on color | `white` | Tier labels |
| Subdued text on color | `rgba(255,255,255,0.78)` | Tier descriptions |
| Paper | `#F4F1EA` | Backgrounds, neutral fills |
| Ink | `#1A1A1A` | Dark text on light bg |
| Muted | `#5B5B5B` | Captions, secondary text |
| Separator | `rgba(255,255,255,0.25)` | Divider lines inside colored shapes |

Use a **transparent SVG background** (no `<rect>` fill on the root) so the figure
blends with both light and dark page backgrounds.

---

#### Option C — Data charts (Python/matplotlib PNG)
Only for numbers Charles actually stated. Write a script in `assets/diagrams/`,
save the PNG to `public/assets/diagrams/`, reference with
`![caption](../assets/diagrams/foo.png)`.

---

Each visual gets a **figure caption** (the alt text becomes a `<figcaption>` automatically)
and is referenced from the prose ("see Figure NN.M").
Never let a visual introduce a fact not in the transcript.

### 5. Contextual sense-check (ASR validation pass)

Before writing the final file, re-read every sentence of the finished chapter and ask: *"Does this phrase make sense given the subject matter — influence, persuasion, behavioral neuroscience, psychology?"* ASR errors that survive the first pass tend to be words that sound plausible in isolation but fail when read in context.

Check specifically for:

| Signal | What to look for |
|---|---|
| **Non-grammatical noun phrases** | e.g. "commanded people's heads", "enservating a reflex" — a verb + object combination that no fluent speaker would write |
| **Wrong register for the field** | A term that exists but does not belong in behavioral science, e.g. "cultivated" where "captivated" is needed, "sacred memories" where "ancestral memories" is needed |
| **Broken rhetorical patterns** | If surrounding sentences form a list or triplet ("No X. No Y. No Z."), every item must fit the same pattern — a misfit item is almost always an ASR error |
| **Proper nouns / model names** | Names of researchers, experiments, and book titles are high-risk ASR targets — confirm spelling with a **web search**; confirm proprietary Behavior Ops framework names against `chapters/*.md`; flag for verification only if both come up empty |
| **Numerals and enumeration** | ASR often misreads spoken numbers as words like "Right." — confirm every numbered list is complete and sequential |

For each suspicious phrase:
1. State what the phrase currently says.
2. Reason about what the author most likely intended, given the surrounding sentences and subject matter.
3. Apply the most conservative fix that restores meaning without adding new claims.
4. If the correct word is genuinely uncertain after a web search and prior chapters don't settle it, leave the phrase as-is and add a `<!-- ASR? verify: [your best guess] -->` HTML comment inline so a human reviewer can spot it.

Document every change found in this pass in the change log table at the end of the chapter, alongside the changes from step 2.

### 6. Preview in the web app
There is **no build step** — `chapters/chapter-NN.md` *is* the deliverable. The
React app reads chapter Markdown files directly:

1. The app auto-discovers every `chapters/chapter-NN.md` (a Vite glob), sorts them
   by the frontmatter `chapter:` number, and serves each at `/#/chapter/NN`. A new
   chapter appears in the table of contents, search, and prev/next navigation
   **automatically** once the file exists with valid frontmatter — no code or
   manifest edit needed.
2. At render time the app: drops the leading `# H1` and rebuilds it as the styled
   chapter opener; renders `::: callout|definition|warning` boxes, pipe tables, and
   ```mermaid blocks (live, in the browser); turns the `## Key Takeaways` list into
   a tinted panel.

Preview it:

```
npm install      # first time only
npm run dev      # then open the printed URL, e.g. http://localhost:5173/#/chapter/NN
```

**All visual design lives in `src/components/BookProse.jsx` (the chapter
typography) and `src/theme.js` (the palette + light/dark themes).** To restyle
every chapter, edit those — never hand-style inside a chapter's Markdown. The
palette and element rules are documented in `reference/style-guide.md`.

**Always verify visually before reporting done.** With the dev server running,
open the chapter in a browser and check: the opener (eyebrow, title, accent rule),
the epigraph and lead-paragraph drop cap, every callout's variant color, all
Mermaid diagrams rendering, tables, figures and their captions, the Key Takeaways
panel. Toggle dark mode and confirm it still reads well. Fix
layout in `BookProse.jsx`/`theme.js` and content in the chapter Markdown.

To ship a static site: `npm run build` (outputs `dist/`), `npm run preview` to
smoke-test the production build.

### 7. Report back
Tell the user:
- The chapter's route in the running app (`/#/chapter/NN`) and the path to
  `chapters/chapter-NN.md`.
- A brief note on any corrections made (ASR errors, grammar fixes) — no log table needed.

## Editor-only content — never visible in the UI

**Change logs and footnotes must never appear as rendered content in the chapter.**
The React app renders everything in the Markdown file. Any section a reader should not see must be wrapped in an HTML comment so the parser strips it silently.

### Change log
Record every ASR correction (from step 2 and step 5) in a change log table, but wrap the entire block in an HTML comment:

```markdown
<!--
## Change Log

| Original (transcript) | Corrected | Reason |
|---|---|---|
| "fake model" | "FATE Model" | Consistent ASR mishearing |
-->
```

### Footnotes / citation flags
Do not use Markdown footnote syntax (`[^1]` / `[^1]: ...`) — these render visibly in the UI. If a citation or verification note is needed, embed it as an HTML comment at the point of use:

```markdown
<!-- Citation: claim about inherited phobias — likely Dias (2015) and Ressler (2014); verify via web search before publication -->
```

### Inline uncertainty markers (from step 5)
The `<!-- ASR? verify: ... -->` comments added during the sense-check pass are also HTML comments and are therefore safe — they will not render.

---

## Quality bar
- Read the finished chapter as a reader would: does every paragraph flow, is
  nothing dangling, do figures land near the text that references them?
- Confirm the fidelity check: skim transcript vs. chapter and verify no idea was dropped.
- Confirm no change log table, footnote markers, or footnote definitions are visible as rendered text.
