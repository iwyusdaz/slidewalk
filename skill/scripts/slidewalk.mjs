#!/usr/bin/env node
// slidewalk CLI — lesson outline in, WCAG-gated dual-format deck out.
//
// Subcommands:
//   parse <outline.md> --out deck.json [--checkpoints]       outline → intermediate deck JSON
//   html  <deck.json>  --out deck.html [--theme midnight]     deck JSON → single-file HTML deck
//   pptx  <deck.json>  --out deck.pptx                        deck JSON → native PPTX (python-pptx)
//   guide <deck.json>  --out facilitator-guide.md             deck JSON → facilitator guide (md)
//   build <outline.md> --out <dir> [--theme T] [--pptx] [--guide] [--checkpoints]
//                                                             full pipeline
//   validate <deck.json>                                      structural checks incl. alt-text rule
//
// Exit codes: 0 = ok, 1 = build failure (gates/validation), 2 = usage error.
import { parseArgs } from "node:util";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url)); // skill/scripts
const THEMES_DIR = join(ROOT, "..", "themes");

function fail(msg) {
  console.error(`slidewalk: ${msg}`);
  process.exit(2);
}

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    fail(`cannot read JSON ${p}: ${e.message}`);
  }
}

import { readdirSync } from "node:fs";
export function listThemes() {
  return readdirSync(THEMES_DIR).filter((f) => f.endsWith(".css")).map((f) => f.replace(/\.css$/, ""));
}

// ---------------------------------------------------------------------------
// validate: structural checks that run BEFORE any output is written
// ---------------------------------------------------------------------------
export function validateDeck(deck) {
  const problems = [];
  if (deck.schema !== "slidewalk/deck@1") problems.push(`unknown schema ${deck.schema}`);
  if (!deck.title || !deck.title.trim()) problems.push("deck.title is empty — add `title:` to the outline front matter");
  if (!deck.lang) problems.push("deck.lang is missing — add `lang: en` (or your locale) to the front matter");
  const slides = deck.slides || [];
  if (!slides.length) problems.push("deck has no slides — add `## Slide: ...` headings");
  slides.forEach((s, i) => {
    const n = i + 1;
    if (!s.title || !s.title.trim()) problems.push(`slide ${n}: missing title`);
    if (s.image) {
      if (!s.image.src) problems.push(`slide ${n}: image has no src`);
      if (s.image.decorative !== true && !(s.image.alt || "").trim()) {
        problems.push(
          `slide ${n} ("${s.title}"): informative image without alt text — the skill refuses to ship it. ` +
            `Add "image-alt: <description>" in the outline, or "image-decorative: true" if purely decorative.`
        );
      }
    }
    if (s.kind === "checkpoint" && !s.sourceSlide) problems.push(`slide ${n}: checkpoint has no sourceSlide reference (orphan question)`);
    if (!["title", "section", "content", "checkpoint"].includes(s.kind)) problems.push(`slide ${n}: unknown kind "${s.kind}"`);
  });
  // checkpoint sources must point at real slides (no orphan questions)
  const titles = new Set(slides.map((s) => s.title));
  slides.forEach((s, i) => {
    if (s.kind === "checkpoint" && s.sourceSlide && !titles.has(s.sourceSlide)) {
      problems.push(`slide ${i + 1}: checkpoint references missing slide "${s.sourceSlide}"`);
    }
  });
  return problems;
}

// ---------------------------------------------------------------------------
// parse: outline markdown → deck JSON (+ auto checkpoints)
// ---------------------------------------------------------------------------
export function parseOutline(md, baseDir = ".") {
  // front matter between --- lines: key: value pairs
  const meta = {};
  let body = md;
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (fm) {
    for (const line of fm[1].split("\n")) {
      const m = /^([a-zA-Z-]+)\s*:\s*(.*)$/.exec(line.trim());
      if (m) meta[m[1].toLowerCase()] = m[2].trim();
    }
    body = md.slice(fm[0].length);
  }

  const slides = [];
  let cur = null;
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trimEnd();
    const slideHead = /^##\s+Slide:\s*(.+)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line.trim());
    const kv = /^([a-zA-Z-]+)\s*:\s*(.*)$/.exec(line.trim());
    if (slideHead) {
      cur = { kind: "content", title: slideHead[1].trim(), bullets: [], notes: "", objective: "", image: null };
      slides.push(cur);
    } else if (cur && kv && !bullet) {
      const key = kv[1].toLowerCase();
      const val = kv[2].trim();
      if (key === "kind") cur.kind = val;
      else if (key === "objective") cur.objective = val;
      else if (key === "question") cur.question = val;
      else if (key === "source-slide" || key === "sourceslide") cur.sourceSlide = val;
      else if (key === "notes" || key === "speaker-notes") cur.notes += (cur.notes ? " " : "") + val;
      else if (key === "image") cur.image = { src: val, alt: "", decorative: false };
      else if (key === "image-alt" && cur.image) cur.image.alt = val;
      else if (key === "image-decorative" && cur.image) cur.image.decorative = val === "true";
      // unknown keys are ignored deliberately (forward compatible)
    } else if (cur && bullet) {
      cur.bullets.push(bullet[1].trim());
    }
    // `# Heading` lines and prose outside slides are ignored: one idea per slide,
    // everything belongs to a `## Slide:` block.
  }
  // resolve image paths against the outline's own directory so builds work
  // from any working directory; images are inlined as data URIs at HTML build time
  for (const s of slides) {
    if (s.image && s.image.src && !/^(data:|https?:)/.test(s.image.src)) {
      s.image.src = resolve(baseDir, s.image.src);
    }
  }
  return {
    schema: "slidewalk/deck@1",
    title: meta.title || "",
    lang: meta.lang || "en",
    author: meta.author || "",
    summary: meta.summary || "",
    theme: meta.theme || "midnight",
    audience: meta.audience || "",
    duration: meta.duration || "",
    generated: new Date().toISOString(),
    generator: "slidewalk 1.0",
    slides,
  };
}

// ---------------------------------------------------------------------------
// checkpoints: retrieval-practice slides every N content slides.
// Questions are TEMPLATE-DERIVED from the slide's own objective/title.
// They are labeled auto-generated wherever they appear. No LLM is used.
// ---------------------------------------------------------------------------
const CHECKPOINT_TEMPLATES = [
  (t) => `Without looking back: in your own words, how would you explain “${t}”?`,
  (t) => `Quick self-check: give one concrete example from your own content where “${t}” applies.`,
  (t) => `Rate yourself 1–5 on “${t}”. What is one gap you still have?`,
  (t) => `A colleague asks you about “${t}”. What are the first two things you would tell them?`,
];

export function insertCheckpoints(deck, everyN = 4) {
  const out = [];
  let sinceContent = 0;
  let cpIndex = 0;
  for (const slide of deck.slides) {
    out.push(slide);
    if (slide.kind === "content") {
      sinceContent++;
      if (sinceContent >= everyN) {
        sinceContent = 0;
        const topic = (slide.objective || slide.title).replace(/^learners can\s*/i, "").trim();
        const tmpl = CHECKPOINT_TEMPLATES[cpIndex % CHECKPOINT_TEMPLATES.length];
        cpIndex++;
        out.push({
          kind: "checkpoint",
          title: `Checkpoint: ${slide.title}`,
          question: tmpl(topic),
          sourceSlide: slide.title,
          autoGenerated: true,
          notes:
            `Auto-generated retrieval prompt drawn from the objective of slide “${slide.title}”. ` +
            `Pause here and let learners answer before advancing. Review and personalize before teaching.`,
          bullets: [],
          objective: "",
        });
      }
    }
  }
  return { ...deck, slides: out, checkpointEvery: everyN };
}

// ---------------------------------------------------------------------------
// CLI dispatch
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const cmd = args[0];
const { values, positionals } = parseArgs({
  args: args.slice(1),
  options: {
    out: { type: "string" },
    theme: { type: "string" },
    pptx: { type: "boolean" },
    guide: { type: "boolean" },
    checkpoints: { type: "boolean" },
    every: { type: "string", default: "4" },
    "pptx-bin": { type: "string" },
  },
  allowPositionals: true,
});

async function main() {
  if (!cmd) fail("usage: slidewalk.mjs <parse|html|pptx|guide|build|validate> ...");

  if (cmd === "parse") {
    const [outline] = positionals;
    if (!outline || !values.out) fail("usage: slidewalk.mjs parse <outline.md> --out deck.json [--checkpoints]");
    let deck = parseOutline(readFileSync(resolve(outline), "utf8"), dirname(resolve(outline)));
    if (values.checkpoints) deck = insertCheckpoints(deck, parseInt(values.every, 10) || 4);
    const problems = validateDeck(deck);
    if (problems.length) {
      console.error("slidewalk: deck validation FAILED — build refused:");
      for (const p of problems) console.error(`  - ${p}`);
      process.exit(1);
    }
    mkdirSync(dirname(resolve(values.out)), { recursive: true });
    writeFileSync(values.out, JSON.stringify(deck, null, 2));
    console.log(`slidewalk: wrote ${values.out} — ${deck.slides.length} slides` +
      (deck.slides.some((s) => s.kind === "checkpoint") ? ` (checkpoints every ${values.every} content slides)` : ""));
    return;
  }

  if (cmd === "validate") {
    const [deckPath] = positionals;
    if (!deckPath) fail("usage: slidewalk.mjs validate <deck.json>");
    const problems = validateDeck(readJson(deckPath));
    if (problems.length) {
      console.error("slidewalk: deck validation FAILED:");
      for (const p of problems) console.error(`  - ${p}`);
      process.exit(1);
    }
    console.log("slidewalk: deck JSON is valid.");
    return;
  }

  if (cmd === "html") {
    const { buildHtml } = await import("./build-html.mjs");
    const [deckPath] = positionals;
    if (!deckPath || !values.out) fail("usage: slidewalk.mjs html <deck.json> --out deck.html [--theme midnight]");
    const deck = readJson(deckPath);
    const problems = validateDeck(deck);
    if (problems.length) {
      console.error("slidewalk: deck validation FAILED — HTML build refused:");
      for (const p of problems) console.error(`  - ${p}`);
      process.exit(1);
    }
    buildHtml(deck, values.out, values.theme || deck.theme || "midnight");
    console.log(`slidewalk: wrote ${values.out} (theme: ${values.theme || deck.theme || "midnight"})`);
    return;
  }

  if (cmd === "pptx") {
    const [deckPath] = positionals;
    if (!deckPath || !values.out) fail("usage: slidewalk.mjs pptx <deck.json> --out deck.pptx");
    const { runPython } = await import("./pptx-runner.mjs");
    const status = runPython(["--json", resolve(deckPath), "--out", resolve(values.out)]);
    process.exit(status);
  }

  if (cmd === "guide") {
    const { emitGuide } = await import("./guide.mjs");
    const [deckPath] = positionals;
    if (!deckPath || !values.out) fail("usage: slidewalk.mjs guide <deck.json> --out facilitator-guide.md");
    emitGuide(readJson(deckPath), values.out);
    console.log(`slidewalk: wrote ${values.out}`);
    return;
  }

  if (cmd === "build") {
    const [outline] = positionals;
    if (!outline || !values.out) fail("usage: slidewalk.mjs build <outline.md> --out <dir> [--theme T] [--pptx] [--guide] [--checkpoints]");
    const outDir = resolve(values.out);
    mkdirSync(outDir, { recursive: true });
    let deck = parseOutline(readFileSync(resolve(outline), "utf8"), dirname(resolve(outline)));
    if (values.checkpoints) deck = insertCheckpoints(deck, parseInt(values.every, 10) || 4);
    const problems = validateDeck(deck);
    if (problems.length) {
      console.error("slidewalk: deck validation FAILED — build refused:");
      for (const p of problems) console.error(`  - ${p}`);
      process.exit(1);
    }
    const deckPath = join(outDir, "deck.json");
    writeFileSync(deckPath, JSON.stringify(deck, null, 2));
    console.log(`slidewalk: wrote ${deckPath} — ${deck.slides.length} slides`);

    const theme = values.theme || deck.theme || "midnight";
    const { buildHtml } = await import("./build-html.mjs");
    buildHtml(deck, join(outDir, "deck.html"), theme);
    console.log(`slidewalk: wrote ${join(outDir, "deck.html")} (theme: ${theme})`);

    if (values.guide) {
      const { emitGuide } = await import("./guide.mjs");
      emitGuide(deck, join(outDir, "facilitator-guide.md"));
      console.log(`slidewalk: wrote ${join(outDir, "facilitator-guide.md")}`);
    }
    if (values.pptx) {
      const { runPython } = await import("./pptx-runner.mjs");
      const status = runPython(["--json", deckPath, "--out", join(outDir, "deck.pptx")]);
      if (status !== 0) process.exit(status);
    }
    console.log("slidewalk: next step — run the accessibility gates: npm run gates");
    return;
  }

  fail(`unknown command "${cmd}"`);
}

// run the CLI only when this file is the entry point (not when imported as a library)
import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
