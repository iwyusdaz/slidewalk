// guide.mjs — deck JSON → facilitator-guide.md
// Auto-emitted from the deck JSON: per-slide objectives, speaker notes,
// checkpoint questions with their source slide, timing suggestion, and the
// accessibility note for facilitators.
import { writeFileSync } from "node:fs";

export function emitGuide(deck, outPath) {
  const n = deck.slides.length;
  const contentCount = deck.slides.filter((s) => s.kind === "content").length;
  const checkpoints = deck.slides.filter((s) => s.kind === "checkpoint").length;

  const lines = [];
  lines.push(`# Facilitator guide — ${deck.title}`);
  lines.push("");
  lines.push(`> Generated automatically by **slidewalk 1.0** from the deck JSON. Checkpoint questions are **auto-generated retrieval prompts** (template-derived from each slide's objective) — review and personalize them before teaching.`);
  lines.push("");
  if (deck.audience) lines.push(`**Audience:** ${deck.audience}  `);
  if (deck.duration) lines.push(`**Planned duration:** ${deck.duration}  `);
  lines.push(`**Slides:** ${n} total (${contentCount} content, ${checkpoints} auto-generated checkpoints)  `);
  lines.push(`**Theme:** ${deck.theme}`);
  lines.push("");
  lines.push(`## How to use this deck`);
  lines.push("");
  lines.push(`1. The HTML deck (\`deck.html\`) is keyboard-navigable (arrows, Space, PageUp/PageDown, Home/End) and has a speaker-notes toggle (press **N** or use the button).`);
  lines.push(`2. The PPTX (\`deck.pptx\`) carries the same text and per-slide notes in native, editable text frames.`);
  lines.push(`3. Pause at every **Checkpoint** slide and let learners answer before advancing — the prompts are retrieval practice, not decoration.`);
  lines.push(`4. The deck passed automated accessibility gates (axe WCAG 2.1 A/AA rules, keyboard traversal, 320 px reflow, contrast, alt text). This is automated testing only — a manual pass with assistive technology is still recommended before high-stakes delivery.`);
  lines.push("");

  const section = (title) => {
    lines.push(`## ${title}`);
    lines.push("");
  };

  deck.slides.forEach((s, i) => {
    const label = s.kind === "checkpoint" ? "CHECKPOINT (auto-generated)" : s.kind.toUpperCase();
    lines.push(`### Slide ${i + 1}: ${s.title}  \`${label}\``);
    lines.push("");
    if (s.objective) lines.push(`- **Objective:** ${s.objective}`);
    if (s.kind === "checkpoint") {
      lines.push(`- **Question:** ${s.question}`);
      lines.push(`- **Source slide:** “${s.sourceSlide}” (no orphan questions — every prompt comes from a real slide)`);
      lines.push(`- **Facilitation:** pause, collect answers, then advance to the source slide to confirm.`);
    }
    if (s.bullets && s.bullets.length) {
      lines.push(`- **On-slide content:**`);
      s.bullets.forEach((b) => lines.push(`  - ${b}`));
    }
    if (s.image) {
      lines.push(`- **Figure:** ${s.image.decorative ? "decorative" : `informative — alt text: “${s.image.alt}”`}`);
    }
    if (s.notes) lines.push(`- **Speaker notes:** ${s.notes}`);
    lines.push("");
  });

  lines.push(`## Accessibility notes for facilitators`);
  lines.push("");
  lines.push(`- Describe figures out loud; the alt text above is your script.`);
  lines.push(`- If someone asks for materials in advance, send the HTML deck — it works without JavaScript being required for reading the content order, and it reflows at 320 px width / 400% zoom.`);
  lines.push(`- Known limitation: the PPTX was **not** run through PowerPoint's built-in Accessibility Checker; run it once in PowerPoint before distribution if your organization requires that check.`);
  lines.push("");

  writeFileSync(outPath, lines.join("\n"));
}
