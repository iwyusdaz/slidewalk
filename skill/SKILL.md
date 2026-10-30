# Skill: slidewalk — lesson outline in, WCAG-gated dual-format deck out

## When to use this skill

Use when the user needs teaching slides: they have (or can sketch) a lesson outline and need (a) an accessible web deck and/or (b) a native PPTX, with accessibility verified instead of promised. Typical users: curriculum developers, instructional designers, educators preparing a session.

## What you need from the user

1. **The outline** (markdown, format below) — or enough raw material to draft one.
2. **Theme choice** — `slate` (light), `midnight` (dark), `ember` (warm). Offer the bake-off: build the deck once per theme and let the user pick by looking. Never pick for them without showing.
3. **Checkpoint cadence** (default: a retrieval-practice checkpoint every 4 content slides).

## Outline format

```markdown
---
title: Deck title
lang: en
audience: who this is for
duration: 45 minutes
theme: midnight
summary: one-sentence description
---

## Slide: Welcome
kind: title            # title | section | content | checkpoint (default: content)
objective: Learners can ...
notes: What the facilitator says/does on this slide.
- on-slide bullet
- another bullet
image: assets/diagram.svg   # local file or https URL
image-alt: Description of the figure   # REQUIRED unless image-decorative: true
```

Checkpoint slides may be hand-written (`kind: checkpoint` + `question:` + `source-slide:`) or auto-inserted with `--checkpoints`. Every checkpoint must cite a real source slide — the validator rejects orphan questions.

## The workflow (do it in this order)

1. **Draft the outline argument-first**: one idea per slide, section rhythm, an objective per content slide written as "Learners can <observable verb> <object>". The objective is what the checkpoint generator will draw from — write it well.
2. **Validate early**: `node skill/scripts/slidewalk.mjs parse outline.md --out deck.json --checkpoints`. Fix every refusal (most common: informative image without `image-alt`).
3. **Bake-off**: build once per theme (`--theme slate|midnight|ember`) and show the user. This is the one step that needs their eyes.
4. **Build**: `node skill/scripts/slidewalk.mjs build outline.md --out docs --theme <chosen> --pptx --guide`.
5. **Gate**: `node tooling/run-gates.mjs docs/deck.html`. The build is NOT done until gates pass. On failure, the fix list names the rule, the node, and the fix — apply it to the *outline or theme*, not the generated HTML.
6. **Verify the PPTX**: `tooling-py/verify-pptx.sh docs/deck.pptx docs/deck.json`.
7. **Hand over** deck.html + deck.pptx + facilitator-guide.md, and tell the user: the gates cover automated WCAG 2.1 A/AA checks; a manual pass (ideally with assistive technology) is still recommended before delivery.

## Honest-communication rules (non-negotiable)

- Never call the output "accessible-certified" or "WCAG compliant". Say "gated against WCAG 2.1 A/AA automated checks".
- Never strip the "Auto-generated retrieval prompt — review before teaching" label from checkpoint slides. Tell the user to personalize the prompts.
- The PPTX contains text placeholders for figures (images render in the HTML deck). Say so when handing over.
- If the user asks to skip the gates, refuse: the gates are the product.

## Failure modes to watch for

- Objectives written as topics ("POUR overview") instead of learnable statements — checkpoint prompts get weak. Rewrite as "Learners can ...".
- Walls of bullets: more than ~5 bullets per slide means it's two slides.
- Decorative images shipped with verbose alt text. Use `image-decorative: true`.
- Editing the generated HTML instead of the outline — changes are lost on rebuild and can break the gates.
