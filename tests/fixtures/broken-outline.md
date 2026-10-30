---
title: Deliberately broken deck (negative test fixture)
lang: en
summary: Do not ship. Used by tests/run-negative-tests.sh to prove the build refuses a deck with an informative image that has no alt text.
---

## Slide: Broken on purpose
kind: content
objective: Probe fixture — informative image without alt text.
notes: This image deliberately has an src but no image-alt line.
image: probe-figure.svg
- The build must refuse this deck with an actionable fix list

## Slide: Also broken — vague heading for an orphan checkpoint
kind: content
objective: Probe fixture — a second content slide.
notes: Nothing wrong with this slide itself.
- Just filler so the fixture has two slides
