# Changelog

All notable changes to slidewalk are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning: SemVer.

## [1.0.0] — 2026-10-31

### Added
- Outline parser (`skill/scripts/slidewalk.mjs parse`): markdown outline with front matter → intermediate `deck.json` (`slidewalk/deck@1`), with build-refusing validation: informative images require alt text, checkpoints require a real source slide, lang required.
- Retrieval-practice checkpoint generator: template-derived prompts every N content slides (default 4) from the slide's own objective, visibly labeled "Auto-generated retrieval prompt — review before teaching", each citing its source slide.
- Single-file HTML deck builder (`skill/scripts/build-html.mjs`): keyboard navigation (arrows/Space/PageUp/PageDown/Home/End), focus moves to slide headings, deep links (`#s7`), speaker-notes toggle (button + N key), one h1, logical headings, 320px reflow-safe CSS, `prefers-reduced-motion` support, print layout with notes.
- Native PPTX builder (`skill/scripts/build-pptx.py`, python-pptx 1.0.2): real text frames (no screenshots), speaker notes on every slide, checkpoint slides with source-slide attribution, document metadata. Figures render as labeled text placeholders (documented limitation).
- Facilitator guide emitter (`skill/scripts/guide.mjs`): per-slide objectives, bullets, alt-text script, speaker notes, checkpoint prompts with facilitation guidance, honest accessibility note.
- Theme pack: `slate`, `midnight`, `ember` — each pre-tested on a fixed probe deck through the full gate suite (`npm run gates:themes`) before any deck generation.
- Accessibility gate runner (`tooling/run-gates.mjs`): axe (WCAG 2.1 A/AA + best practice, run with all slides visible), keyboard traversal of every slide (forward/reverse/Home/End/Space/focus/notes/no-trap), 320px reflow per slide, contrast, alt text, heading structure, lang. Failure = non-zero exit with an actionable fix list.
- Negative tests (`tests/run-negative-tests.sh`): build refusal on missing alt text; gate runner catches 6 seeded failure classes on a hand-broken deck.
- PPTX round-trip verifier (`tooling-py/verify-pptx.py`): OOXML zip-part sanity + python-pptx re-read comparing titles, bullets and notes against deck.json.
- Reference deck: "Intro to WCAG for content authors" — 17 slides through the full pipeline, all gates green (`docs/`).
- Case-study site (`docs/index.html`), accessibility statement (`docs/accessibility-statement.html`), evaluation methods and pending human-review protocol (`evaluation/`).
