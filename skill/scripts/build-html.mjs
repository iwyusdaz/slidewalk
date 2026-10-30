// build-html.mjs — deck JSON → single-file accessible HTML deck.
//
// Accessibility contract of the output (enforced afterwards by tooling/run-gates.mjs):
//   - one <h1> (deck title, running header), slide titles are <h2>, notes <h3> — no skipped levels
//   - lang attribute from deck.lang
//   - every slide is a labelled <section role="group" aria-roledescription="slide">
//   - keyboard: ← → ↑ ↓ Space PageUp PageDown Home End; focus moves to the slide heading
//   - speaker notes toggle (button + aria-expanded), notes printed with the deck
//   - 320 px reflow safe: fluid type via clamp(), no fixed widths, wraps not scrolls
//   - informative images REQUIRE alt (builder refuses without it); decorative get alt=""
//   - prefers-reduced-motion respected (no motion by default anyway)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const THEMES = join(SCRIPTS, "..", "themes");

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineImage(slide, deckDir) {
  if (!slide.image) return "";
  const alt = slide.image.decorative ? "" : slide.image.alt;
  let src = slide.image.src;
  // Inline local assets as data URIs so the deck stays a single file.
  if (!/^(data:|https?:)/.test(src)) {
    try {
      const p = resolve(deckDir || ".", src);
      const data = readFileSync(p);
      const ext = src.split(".").pop().toLowerCase();
      const mime = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" }[ext] || "application/octet-stream";
      src = `data:${mime};base64,${data.toString("base64")}`;
    } catch {
      throw new Error(`slide "${slide.title}": image file not found: ${src}`);
    }
  }
  return `<figure class="slide-figure">
  <img src="${esc(src)}" alt="${esc(alt)}"${slide.image.decorative ? ' aria-hidden="true" focusable="false"' : ""} />
</figure>`;
}

function slideInner(slide, i, n, deckDir) {
  const parts = [];
  if (slide.kind === "title") {
    parts.push(`<p class="kicker">Slide 1 of ${n}</p>`);
    parts.push(`<h2 id="s${i}-h" tabindex="-1">${esc(slide.title)}</h2>`);
    if (slide.bullets.length) parts.push(`<ul class="slide-list title-meta">${slide.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`);
  } else if (slide.kind === "section") {
    parts.push(`<p class="kicker">Section</p>`);
    parts.push(`<h2 id="s${i}-h" tabindex="-1">${esc(slide.title)}</h2>`);
    if (slide.bullets.length) parts.push(`<ul class="slide-list section-list">${slide.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`);
  } else if (slide.kind === "checkpoint") {
    parts.push(`<p class="checkpoint-label">Auto-generated retrieval prompt — review before teaching</p>`);
    parts.push(`<h2 id="s${i}-h" tabindex="-1">${esc(slide.title)}</h2>`);
    parts.push(`<div class="checkpoint-box"><p class="checkpoint-q">${esc(slide.question)}</p></div>`);
    parts.push(`<p class="checkpoint-source">Drawn from: “${esc(slide.sourceSlide)}”</p>`);
  } else {
    parts.push(`<h2 id="s${i}-h" tabindex="-1">${esc(slide.title)}</h2>`);
    if (slide.bullets.length) parts.push(`<ul class="slide-list">${slide.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`);
  }
  const img = inlineImage(slide, deckDir);
  if (img) parts.push(img);
  if (slide.notes) {
    parts.push(
      `<div class="speaker-notes" role="note" aria-label="Speaker notes"><h3>Speaker notes</h3><p>${esc(slide.notes)}</p></div>`
    );
  }
  return parts.join("\n  ");
}

const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:auto}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.55;background:var(--bg);color:var(--fg)}
.skip-link{position:absolute;left:-9999px;top:0;background:var(--accent);color:var(--accent-fg);padding:.6rem 1rem;z-index:20;border-radius:0 0 .35rem 0}
.skip-link:focus{left:0}
.topbar{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:baseline;justify-content:space-between;padding:.6rem clamp(.75rem,3vw,1.5rem);background:var(--bar-bg);color:var(--bar-fg);border-bottom:2px solid var(--accent)}
.topbar h1{font-size:clamp(.85rem,2.5vw,1rem);margin:0;font-weight:600}
.counter{margin:0;font-size:.85rem;color:var(--bar-fg);white-space:nowrap}
.progress{height:.25rem;background:var(--bar-bg)}
.progress>span{display:block;height:100%;background:var(--accent);width:0}
.stage{padding:clamp(1rem,4vw,3rem);max-width:60rem;margin:0 auto}
.slide{margin:0 auto;padding:clamp(1.25rem,4vw,3rem) 0;max-width:52rem}
.slide[hidden]{display:none}
.slide h2{font-size:clamp(1.5rem,4.5vw,2.4rem);line-height:1.2;margin:.2rem 0 1rem;color:var(--fg)}
.kicker{font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);margin:0 0 .5rem;font-weight:600}
.slide-list{padding-left:1.25rem;margin:0 0 1rem}
.slide-list li{margin:.5rem 0;font-size:clamp(1.05rem,2.8vw,1.35rem);overflow-wrap:break-word}
.title-meta{list-style:none;padding:0;font-size:clamp(1rem,2.5vw,1.2rem);color:var(--muted)}
.section-list{list-style:none;padding:0;color:var(--muted);font-size:clamp(1rem,2.5vw,1.2rem)}
.slide[aria-roledescription="slide"][data-kind="section"] h2,
.slide[data-kind="title"] h2{font-size:clamp(1.9rem,6vw,3.2rem)}
.slide-figure{margin:1rem 0}
.slide-figure img{max-width:100%;height:auto;display:block;border:1px solid var(--border);border-radius:.4rem;background:#fff}
.speaker-notes{display:none;border-left:.3rem solid var(--accent);background:var(--notes-bg);color:var(--notes-fg);padding:.75rem 1rem;margin-top:1.5rem;border-radius:0 .4rem .4rem 0}
body.show-notes .speaker-notes{display:block}
.speaker-notes h3{margin:0 0 .35rem;font-size:.85rem;text-transform:uppercase;letter-spacing:.06em;color:var(--accent)}
.speaker-notes p{margin:0;font-size:.95rem}
.checkpoint-label{display:inline-block;font-size:.8rem;font-weight:600;color:var(--accent);border:1px solid var(--accent);border-radius:999px;padding:.15rem .7rem;margin:0 0 .75rem}
.checkpoint-box{background:var(--panel-bg);border:2px solid var(--accent);border-radius:.6rem;padding:clamp(1rem,3vw,2rem);margin:1rem 0}
.checkpoint-q{margin:0;font-size:clamp(1.2rem,3.5vw,1.8rem);font-weight:600}
.checkpoint-source{font-size:.85rem;color:var(--muted);margin:.25rem 0 0}
.toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:space-between;padding:.75rem clamp(.75rem,3vw,1.5rem) 1.5rem;max-width:60rem;margin:0 auto}
.toolbar .controls{display:flex;gap:.5rem;flex-wrap:wrap}
button{font:inherit;cursor:pointer;background:var(--accent);color:var(--accent-fg);border:2px solid var(--accent);border-radius:.4rem;padding:.45rem .9rem;font-weight:600}
button:disabled{opacity:.45;cursor:not-allowed}
button[aria-pressed="true"]{background:var(--panel-bg);color:var(--accent)}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.hint{font-size:.8rem;color:var(--muted);margin:.25rem 0 0}
@media (prefers-reduced-motion: reduce){*{transition:none!important;animation:none!important}}
@media print{
  .topbar,.toolbar,.progress,.skip-link{display:none}
  .slide[hidden]{display:block}
  .speaker-notes{display:block}
  .slide{page-break-after:always}
}
`;

const PAGE_JS = `
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var counter = document.getElementById('counter');
  var bar = document.getElementById('progress-fill');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var notesBtn = document.getElementById('toggle-notes');
  var i = 0;

  function show(n, focusHeading) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (s, idx) { s.hidden = idx !== i; });
    counter.textContent = 'Slide ' + (i + 1) + ' of ' + slides.length;
    bar.style.width = (((i + 1) / slides.length) * 100) + '%';
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    if (location.hash !== '#s' + (i + 1)) history.replaceState(null, '', '#s' + (i + 1));
    if (focusHeading) {
      var h = slides[i].querySelector('h2');
      if (h) h.focus({ preventScroll: false });
    }
  }

  function toggleNotes() {
    var open = document.body.classList.toggle('show-notes');
    notesBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    notesBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
  }

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
        e.preventDefault(); show(i + 1, true); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); show(i - 1, true); break;
      case 'Home': e.preventDefault(); show(0, true); break;
      case 'End': e.preventDefault(); show(slides.length - 1, true); break;
      case 'n': case 'N': toggleNotes(); break;
    }
  });

  prev.addEventListener('click', function () { show(i - 1, true); });
  next.addEventListener('click', function () { show(i + 1, true); });
  notesBtn.addEventListener('click', toggleNotes);

  // deep link support (#s7)
  var m = /^#s(\\d+)$/.exec(location.hash);
  show(m ? parseInt(m[1], 10) - 1 : 0, false);
})();
`;

export function buildHtml(deck, outPath, theme = "midnight") {
  const themeFile = join(THEMES, `${theme}.css`);
  let themeCss;
  try {
    themeCss = readFileSync(themeFile, "utf8");
  } catch {
    throw new Error(`unknown theme "${theme}". Available themes: ` +
      readdirSync(THEMES).filter((f) => f.endsWith(".css")).map((f) => f.replace(/\.css$/, "")).join(", "));
  }
  const deckDir = dirname(resolve(outPath));
  const n = deck.slides.length;
  const slidesHtml = deck.slides
    .map((s, i) => {
      const label = s.kind === "checkpoint" ? `Retrieval checkpoint — ${s.title}` : s.title;
      return `  <section class="slide" id="s${i + 1}" data-kind="${esc(s.kind)}" role="group" aria-roledescription="slide" aria-label="Slide ${i + 1} of ${n}: ${esc(label)}"${i === 0 ? "" : " hidden"}>
    ${slideInner(s, i + 1, n, deckDir)}
  </section>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="${esc(deck.lang)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(deck.title)} — accessible slide deck</title>
<meta name="description" content="${esc(deck.summary || `${deck.title}: accessible HTML slide deck generated by slidewalk.`)}" />
<meta name="generator" content="slidewalk 1.0" />
<style>
:root{--focus:#1a0dab}
${themeCss}
${BASE_CSS}
</style>
</head>
<body>
<a class="skip-link" href="#s1">Skip to first slide</a>
<header class="topbar">
  <h1>${esc(deck.title)}</h1>
  <p class="counter" id="counter" aria-live="polite">Slide 1 of ${n}</p>
</header>
<div class="progress" aria-hidden="true"><span id="progress-fill"></span></div>
<main id="main" class="stage">
${slidesHtml}
</main>
<footer class="toolbar">
  <div class="controls">
    <button type="button" id="prev">Previous slide</button>
    <button type="button" id="next">Next slide</button>
    <button type="button" id="toggle-notes" aria-expanded="false" aria-pressed="false">Speaker notes</button>
  </div>
  <p class="hint">Keyboard: arrow keys, Space, PageUp/PageDown, Home/End move between slides. Press N for speaker notes.</p>
</footer>
<script>
${PAGE_JS}
</script>
</body>
</html>
`;
  writeFileSync(outPath, html);
}
