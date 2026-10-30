// build-theme-probes.mjs — renders one fixed 3-slide probe deck per theme and
// gates it. The probe deck exercises every themed surface (top bar, body text,
// muted text, accent/kicker, checkpoint panel, figure) so a theme cannot ship
// until its palette passes the WCAG gates on its own.
//
// Usage: node skill/scripts/build-theme-probes.mjs   (writes tests/theme-probes/)
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseOutline, validateDeck } from "./slidewalk.mjs";
import { buildHtml } from "./build-html.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const PROBE_OUTLINE = `---
title: Theme probe
lang: en
summary: Fixed probe deck used to gate every slidewalk theme before any real deck is generated on top.
---

## Slide: Theme probe
kind: title
notes: Probe slide for theme gating.
- Body text sample
- Muted metadata sample

## Slide: Probe content with every themed surface
kind: content
objective: Probe the kicker, list, figure and checkpoint surfaces.
notes: Probe notes.
- Body list item one
- Body list item two with a longer sentence so wrapping is exercised at 320 px width
image: probe-figure.svg
image-alt: Probe figure: a labelled rectangle used to exercise image rendering and alt text.

## Slide: Probe checkpoint
kind: checkpoint
question: Probe retrieval prompt used to gate the checkpoint panel styling.
sourceSlide: Probe content with every themed surface
notes: Auto-generated retrieval prompt for probe purposes.
`;

// tiny informative figure so the img path is exercised
const FIGURE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" role="img" aria-label="Probe figure: a labelled rectangle."><rect x="5" y="5" width="190" height="90" fill="#eaf1f7" stroke="#0b5fa5" stroke-width="2"/><text x="100" y="55" text-anchor="middle" font-family="system-ui" font-size="16" fill="#1b2733">Probe figure</text></svg>`;

const themes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["slate", "midnight", "ember"];

const outDir = join(ROOT, "tests", "theme-probes");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "probe-figure.svg"), FIGURE_SVG);

for (const theme of themes) {
  const deck = parseOutline(PROBE_OUTLINE, outDir);
  const problems = validateDeck(deck);
  if (problems.length) {
    console.error(`probe deck invalid: ${problems.join("; ")}`);
    process.exit(1);
  }
  const out = join(outDir, `probe-${theme}.html`);
  buildHtml(deck, out, theme);
  console.log(`wrote ${out}`);
}
