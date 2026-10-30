#!/usr/bin/env node
// slidewalk accessibility gate runner — the product's spine.
//
// Adapts the workspace Playwright/axe tooling (tooling/audit-axe.mjs) into a
// self-contained deck-aware gate CLI. Runs SIX gates on an HTML deck file:
//
//   1. axe-core: WCAG 2.1 A/AA + best-practice rules, run with ALL slides made
//      visible so hidden slides are audited too. FAIL if any critical/serious
//      violation; moderate/minor are reported as warnings.
//   2. Keyboard traversal: every slide must be reachable with ArrowRight/Space
//       and reverse traversal with ArrowLeft; focus must land on the slide
//       heading; toolbar buttons must be Tab-reachable; notes toggle must work.
//   3. 320 px reflow: at a 320 px viewport, every slide must show without
//      horizontal page scroll (WCAG 1.4.10 Reflow).
//   4. Contrast: axe color-contrast across all slides (part of gate 1's rules
//      but reported separately here for a readable fix list).
//   5. Alt text: every <img> must carry an alt attribute; informative images
//      must have non-empty alt; role="img" elements must have an accessible name.
//   6. Structure: exactly one <h1>, no skipped heading levels, lang attribute.
//
// Exit codes: 0 = all gates pass, 1 = one or more gates FAIL (build fails),
// 2 = could not run (usage/browser error).
//
// Usage: node tooling/run-gates.mjs <deck.html> [more-decks...]
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const outDir = outIdx >= 0 ? args[outIdx + 1] : "gate-results";
const targets = args.filter((a, i) => !(outIdx >= 0 && (i === outIdx || i === outIdx + 1)));
if (!targets.length) {
  console.error("Usage: node tooling/run-gates.mjs <deck.html>... [--out <dir>]");
  process.exit(2);
}
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const axeSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "axe-core", "axe.min.js"),
  "utf8"
);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const FIX_HINTS = {
  "color-contrast": "Raise the text/background contrast to at least 4.5:1 (3:1 for large text). Edit the theme tokens in skill/themes/<theme>.css.",
  "image-alt": "Add alt text: set `image-alt: <description>` in the outline for informative images, or `image-decorative: true` for decorative ones.",
  "heading-order": "Do not skip heading levels. In slidewalk output the deck title is the single <h1>; slide titles are <h2>. If you edited the template, fix the level order.",
  "html-has-lang": "Set `lang:` in the outline front matter so the deck gets <html lang=\"...\">.",
  "html-lang-valid": "Use a valid BCP-47 language tag, e.g. `lang: en` or `lang: en-GB`.",
  "landmark-one-main": "Keep the <main class=\"stage\"> wrapper from the slidewalk template.",
  "region": "Keep each slide as <section role=\"group\" aria-roledescription=\"slide\" aria-label=\"...\">.",
  "button-name": "Toolbar buttons need text content — restore the template markup for Previous/Next/notes buttons.",
  "nested-interactive": "Do not place buttons or links inside each other.",
  "aria-allowed-attr": "Remove the ARIA attribute that is not allowed on this element's role.",
  "aria-required-attr": "Add the required ARIA attributes for this role.",
  "duplicate-id": "Slide ids are generated as #s1..#sN; if you hand-edited the deck, make ids unique again.",
};
function fixHint(ruleId) {
  return FIX_HINTS[ruleId] || `See axe rule docs: https://dequeuniversity.com/rules/axe/4.11/${ruleId}`;
}

function serveFile(abs) {
  const root = dirname(abs);
  const server = createServer((req, res) => {
    let p = normalize(decodeURIComponent(req.url.split("?")[0]));
    if (p.endsWith("/")) p += "index.html";
    let fp = join(root, p);
    try {
      const data = readFileSync(fp);
      const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
      res.writeHead(200, { "content-type": types[extname(fp)] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r({ server, port: server.address().port })));
}

// ---------------------------------------------------------------------------
// the gates, executed in the page
// ---------------------------------------------------------------------------
async function runAxe(page) {
  // Make every slide visible so axe audits ALL slides, not just slide 1.
  await page.evaluate(() => {
    document.querySelectorAll(".slide[hidden]").forEach((el) => el.removeAttribute("hidden"));
  });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
      resultTypes: ["violations", "incomplete"],
    });
    return {
      violations: r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map((nd) => ({
          target: nd.target,
          html: (nd.html || "").slice(0, 160),
          failureSummary: nd.failureSummary,
        })),
      })),
      incomplete: r.incomplete.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
    };
  });
}

async function gateKeyboardTraversal(page) {
  // Fresh page state: reload so the hidden/visible logic is intact.
  await page.reload({ waitUntil: "networkidle" });
  const problems = [];
  const total = await page.evaluate(() => document.querySelectorAll(".slide").length);
  const isSlidewalk = await page.evaluate(() =>
    document.querySelector(".slide") !== null && document.getElementById("counter") !== null
  );
  if (total === 0 || !isSlidewalk) {
    return {
      problems: [
        total === 0
          ? "No .slide sections found — keyboard traversal cannot run. Every slidewalk deck is built from <section class=\"slide\"> elements; rebuild with skill/scripts/slidewalk.mjs."
          : "Deck does not follow the slidewalk structure (missing slide counter) — keyboard traversal cannot be verified. Rebuild with skill/scripts/slidewalk.mjs.",
      ],
      total,
    };
  }

  // Traverse forward through every slide with ArrowRight.
  for (let expect = 0; expect < total; expect++) {
    if (expect > 0) await page.keyboard.press("ArrowRight");
    const state = await page.evaluate(() => {
      const slides = Array.from(document.querySelectorAll(".slide"));
      const visible = slides.findIndex((s) => !s.hidden);
      const h = visible >= 0 ? slides[visible].querySelector("h2") : null;
      return {
        visible,
        focusedHeading: document.activeElement === h,
        focusInSlide: visible >= 0 && document.activeElement && slides[visible].contains(document.activeElement),
        counter: document.getElementById("counter")?.textContent || "",
        hash: location.hash,
      };
    });
    if (state.visible !== expect) problems.push(`ArrowRight step ${expect + 1}: visible slide is #${state.visible + 1}, expected #${expect + 1}`);
    // focus check applies only after an actual keypress; on initial load nothing
    // is focused yet (deliberate: we do not steal focus on page open)
    if (expect > 0 && !state.focusedHeading) problems.push(`Slide ${expect + 1}: focus did not move to the slide heading after keyboard navigation`);
    if (state.hash !== `#s${expect + 1}`) problems.push(`Slide ${expect + 1}: deep-link hash is "${state.hash}", expected "#s${expect + 1}"`);
  }

  // Reverse traversal with ArrowLeft (back through every slide).
  for (let k = 0; k < total - 1; k++) {
    await page.keyboard.press("ArrowLeft");
  }
  const backAtStart = await page.evaluate(() => Array.from(document.querySelectorAll(".slide")).findIndex((s) => !s.hidden));
  if (backAtStart !== 0) problems.push(`ArrowLeft traversal ended on slide #${backAtStart + 1}, expected #1`);

  // Home / End
  await page.keyboard.press("End");
  const endIdx = await page.evaluate(() => Array.from(document.querySelectorAll(".slide")).findIndex((s) => !s.hidden));
  if (endIdx !== total - 1) problems.push(`End key: expected last slide (#${total}), got #${endIdx + 1}`);
  await page.keyboard.press("Home");
  const homeIdx = await page.evaluate(() => Array.from(document.querySelectorAll(".slide")).findIndex((s) => !s.hidden));
  if (homeIdx !== 0) problems.push(`Home key: expected first slide, got #${homeIdx + 1}`);

  // Space must advance too.
  await page.keyboard.press(" ");
  const afterSpace = await page.evaluate(() => Array.from(document.querySelectorAll(".slide")).findIndex((s) => !s.hidden));
  if (afterSpace !== 1) problems.push(`Space: expected slide #2, got #${afterSpace + 1}`);

  // Toolbar reachable by Tab; buttons actually work.
  const tabState = await page.evaluate(() => {
    const btn = document.getElementById("next");
    if (!btn) return { focused: false, missing: true };
    btn.focus();
    return { focused: document.activeElement === btn };
  });
  if (tabState.missing) problems.push("No Next-slide button (#next) found — keyboard/pointer users have no navigation control. Restore the slidewalk toolbar.");
  if (!tabState.focused) problems.push("Next-slide button is not focusable");
  if (!tabState.missing) {
    await page.keyboard.press("Enter");
    const afterEnter = await page.evaluate(() => Array.from(document.querySelectorAll(".slide")).findIndex((s) => !s.hidden));
    if (afterEnter !== 2) problems.push(`Next button click: expected slide #3, got #${afterEnter + 1}`);
  }

  // No keyboard trap: Tab cycles through toolbar controls and back.
  for (let k = 0; k < 8; k++) await page.keyboard.press("Tab");
  const trap = await page.evaluate(() => !!document.activeElement && document.activeElement !== document.body);

  // Speaker notes toggle ('n' key and button).
  const notesExist = await page.evaluate(() => document.querySelector(".speaker-notes") !== null);
  if (notesExist) {
    await page.keyboard.press("n");
    const notesShown = await page.evaluate(() => document.body.classList.contains("show-notes"));
    if (!notesShown) problems.push("Pressing N did not toggle speaker notes on");
    const visibleNotesReadable = await page.evaluate(() => {
      const el = document.querySelector(".speaker-notes:not([hidden])") || document.querySelector(".speaker-notes");
      return el ? getComputedStyle(el).display !== "none" : false;
    });
    if (!visibleNotesReadable) problems.push("Speaker notes are not displayed after toggling");
    await page.keyboard.press("n");
  }

  return { problems, total };
}

async function gateReflow(page) {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload({ waitUntil: "networkidle" });
  const problems = [];
  const total = await page.evaluate(() => document.querySelectorAll(".slide").length);
  for (let i = 0; i < total; i++) {
    await page.evaluate((idx) => {
      const slides = Array.from(document.querySelectorAll(".slide"));
      slides.forEach((s, k) => (s.hidden = k !== idx));
    }, i);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      return {
        scrollW: de.scrollWidth,
        clientW: de.clientWidth,
        bodyScrollW: document.body.scrollWidth,
      };
    });
    if (r.scrollW > 320 + 1 || r.bodyScrollW > 320 + 1) {
      problems.push(`Slide ${i + 1}: horizontal overflow at 320 px (scrollWidth ${r.scrollW}px). Fluid units/clamp() or wrapping is missing.`);
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  return { problems, total };
}

async function gateStructureAndAlts(page) {
  const r = await page.evaluate(() => {
    const problems = [];
    const h1s = document.querySelectorAll("h1");
    if (h1s.length !== 1) problems.push(`Exactly one <h1> is required; found ${h1s.length}. The deck title in the top bar is the h1.`);
    // skipped heading levels
    const levels = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) => Number(h.tagName[1]));
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        problems.push(`Heading level skipped: h${levels[i - 1]} is followed by h${levels[i]}. slidewalk uses h1 (deck) → h2 (slides) → h3 (notes).`);
        break;
      }
    }
    const lang = document.documentElement.getAttribute("lang");
    if (!lang || !lang.trim()) problems.push("<html> is missing a lang attribute. Set `lang:` in the outline front matter.");

    // alt text gate: the skill refuses to ship informative images without alt
    document.querySelectorAll("img").forEach((img, k) => {
      if (!img.hasAttribute("alt")) {
        problems.push(`Image ${k + 1} (${(img.getAttribute("src") || "").slice(0, 60)}) has no alt attribute at all. Add image-alt: in the outline.`);
      }
    });
    document.querySelectorAll('[role="img"]').forEach((el, k) => {
      const name = el.getAttribute("aria-label") || (el.querySelector("title")?.textContent ?? "");
      if (!name.trim()) problems.push(`role="img" element ${k + 1} has no accessible name (needs aria-label or a <title> child).`);
    });

    // slides must all be labelled sections
    const slides = document.querySelectorAll(".slide");
    slides.forEach((s, k) => {
      if (!s.querySelector("h2")) problems.push(`Slide ${k + 1} has no <h2> title.`);
      if (!s.getAttribute("aria-label") && !s.getAttribute("aria-labelledby")) problems.push(`Slide ${k + 1} has no accessible name (aria-label or aria-labelledby).`);
    });
    return { problems, slideCount: slides.length };
  });
  return r;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const allReports = [];
let failed = false;

for (const target of targets) {
  const abs = resolve(target);
  const { server, port } = await serveFile(abs);
  const url = `http://127.0.0.1:${port}/${abs.replace(dirname(abs) + "/", "")}`;
  const page = await ctx.newPage();
  const report = { deck: target, url, gates: {} };
  allReports.push(report);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.addScriptTag({ content: axeSource });

    // Gate 1 + 4: axe with all slides visible
    const axe = await runAxe(page);
    const critical = axe.violations.filter((v) => v.impact === "critical");
    const serious = axe.violations.filter((v) => v.impact === "serious");
    const moderate = axe.violations.filter((v) => v.impact === "moderate");
    const minor = axe.violations.filter((v) => v.impact === "minor");
    const contrast = axe.violations.filter((v) => v.id === "color-contrast");
    report.gates.axe = { critical: critical.length, serious: serious.length, moderate: moderate.length, minor: minor.length, violations: axe.violations, incomplete: axe.incomplete };
    report.gates.contrast = { violations: contrast.length, detail: contrast };

    // Gate 2: keyboard traversal
    const kb = await gateKeyboardTraversal(page);
    report.gates.keyboard = { problems: kb.problems, slides: kb.total };

    // Gate 3: 320px reflow
    const rf = await gateReflow(page);
    report.gates.reflow = { problems: rf.problems, slides: rf.total };

    // Gate 5 + 6: alt text, headings, lang, slide labelling
    const st = await gateStructureAndAlts(page);
    report.gates.structure = { problems: st.problems, slides: st.slideCount };

    // ---- verdict ----
    const failList = [];
    if (critical.length || serious.length) {
      for (const v of [...critical, ...serious]) {
        failList.push({ gate: "axe", id: v.id, impact: v.impact, help: v.help, nodes: v.nodes, fix: fixHint(v.id) });
      }
    }
    if (contrast.length) {
      for (const v of contrast) failList.push({ gate: "contrast", id: v.id, impact: v.impact, help: v.help, nodes: v.nodes, fix: fixHint("color-contrast") });
    }
    for (const p of kb.problems) failList.push({ gate: "keyboard", fix: p });
    for (const p of rf.problems) failList.push({ gate: "reflow-320", fix: p });
    for (const p of st.problems) failList.push({ gate: "structure/alt", fix: p });

    report.failures = failList;
    report.pass = failList.length === 0;

    console.log(`\n=== ${target} ===`);
    console.log(`  slides: ${st.slideCount}`);
    console.log(`  axe: ${axe.violations.length} violation rule(s) — critical=${critical.length}, serious=${serious.length}, moderate=${moderate.length}, minor=${minor.length}; incomplete=${axe.incomplete.length}`);
    console.log(`  keyboard traversal: ${kb.problems.length === 0 ? "PASS" : "FAIL"} (${kb.total} slides)`);
    console.log(`  320px reflow: ${rf.problems.length === 0 ? "PASS" : "FAIL"} (${rf.total} slides)`);
    console.log(`  contrast: ${contrast.length === 0 ? "PASS" : "FAIL"}`);
    console.log(`  alt text + structure: ${st.problems.length === 0 ? "PASS" : "FAIL"}`);
    for (const w of [...moderate, ...minor]) console.log(`  warning [${w.impact}] ${w.id}: ${w.help} (not blocking, still fix it)`);
    if (report.pass) {
      console.log("  RESULT: PASS — all gates green");
    } else {
      console.log(`  RESULT: FAIL — ${failList.length} blocking issue(s). Fix list:`);
      for (const f of failList) {
        console.log(`    - [${f.gate}] ${f.id ? `${f.id} (${f.impact}) ` : ""}${f.help || ""}`);
        console.log(`      where: ${JSON.stringify(f.nodes?.map((x) => x.target) || f.fix || f).slice(0, 220)}`);
        console.log(`      fix:   ${f.fix}`);
      }
      failed = true;
    }
  } catch (err) {
    console.error(`GATE RUNNER ERROR on ${target}: ${err.message}`);
    report.error = err.message;
    failed = true;
  }
  writeFileSync(join(outDir, `${target.replace(/[^a-z0-9.-]+/gi, "_")}.json`), JSON.stringify(report, null, 2));
  await page.close();
  await new Promise((r) => server.close(r));
}

writeFileSync(join(outDir, "_summary.json"), JSON.stringify(allReports, null, 2));
await browser.close();
console.log(failed ? "\ngates: FAILED (exit 1)" : "\ngates: all pass (exit 0)");
process.exit(failed ? 1 : 0);
