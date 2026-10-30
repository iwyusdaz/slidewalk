# Evaluation methods — slidewalk

This file records every evaluation method used on slidewalk, what each can and cannot show, and what is still pending. Rule of the house: nothing is presented as coming from a real person unless a real person did it, and nothing pending is faked.

## Methods used (complete, 2026-10-31)

### 1. Automated accessibility gates — DONE
- **Method:** axe-core 4.11.1 (WCAG 2.1 A/AA + best-practice rule tags) run in headless Chromium via Playwright, with every slide made visible so hidden slides are audited; plus scripted keyboard traversal (forward, reverse, Home/End, Space, focus movement, notes toggle, trap check), 320 px reflow per slide, alt-text DOM scan, heading-structure and lang checks. Runner: `tooling/run-gates.mjs`.
- **Result:** reference deck (17 slides) all PASS; theme probes (slate/midnight/ember) all PASS. Raw JSON output in `gate-results/` and `tests/theme-probes/results/` (regenerable via `npm run gates`, `npm run gates:themes`).
- **Can show:** conformance with the automated checks axe implements; keyboard reachability; reflow behavior.
- **Cannot show:** real screen reader experience; alt-text *quality*; cognitive load; whether anyone can learn from the deck.

### 2. Negative testing — DONE
- **Method:** two layers. (a) `tests/fixtures/broken-outline.md` — informative image without alt text; the build must refuse. (b) `tests/fixtures/broken-deck.html` — hand-crafted deck with 6 seeded failure classes (no lang, no h1, skipped heading, no-alt image, contrast failure, no keyboard navigation); the gate runner must fail with all of them named.
- **Result:** both layers catch everything seeded; runner exits non-zero. Reproduce: `sh tests/run-negative-tests.sh`.
- **Can show:** the gates can fail — a gate that cannot fail is decoration.

### 3. PPTX round-trip verification — DONE
- **Method:** unzip-part sanity (OOXML parts present, notesSlide count) + python-pptx re-read of every slide, comparing titles, bullets and speaker notes against `deck.json`. `tooling-py/verify-pptx.py`.
- **Result:** 17/17 slides verified, 107 zip parts, 71 KB.
- **Cannot show:** how the file renders in specific PowerPoint/Keynote versions (no manual spot-check yet — owner task below).

### 4. Deterministic content checks — DONE
- **Method:** the deck validator (`slidewalk.mjs validate`) enforces: one idea per slide structure, informative-image alt text, checkpoint→source-slide references (no orphan questions), lang present.
- **Can show:** structural integrity. **Cannot show:** pedagogical quality.

## Methods pending

### 5. Educator review of one generated deck — PENDING (protocol ready)
- **What:** an educator/instructional designer reviews the reference deck: outline quality, objective quality, checkpoint question quality, facilitator guide usability. Protocol and review form: `evaluation/human-protocol/educator-review-template.md`.
- **Status:** awaiting the repository owner recruiting a reviewer. No results exist yet; no table below is filled.

| Reviewer (role) | Date | Verdict | Key findings |
|---|---|---|---|
| — | — | — | PENDING: requires a real educator reviewer |

### 6. Fresh-context agent review of the tool — DONE (2026-10-31)
- **What:** a reviewer agent that did not build the repo runs the pipeline from the README alone, in a fresh context, and reports gaps. It must be disclosed that it may run on the same underlying model family as the builder — that is a limitation, not an independent evaluation.
- **Status:** run on 2026-10-31. Report: `evaluation/agent-review.md`. Brief prepared below; the brief remains in this repo so the review can be repeated after significant changes.

### 7. Screen reader pass — NOT DONE
- Automated VoiceOver (Guidepup) or a manual VoiceOver pass has not been run. This is the most valuable next evaluation and is listed in the README's next steps.

## Honesty rules applied here
- No claim of WCAG conformance or certification anywhere in this repo: outputs are "gated against WCAG 2.1 A/AA automated checks".
- No simulated users, no simulated disabled users, no fake results in pending tables.
- Checkpoint questions are labeled auto-generated on the slide, in the deck JSON, in the facilitator guide, and in the README.
