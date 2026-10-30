# Facilitator guide — Intro to WCAG for content authors

> Generated automatically by **slidewalk 1.0** from the deck JSON. Checkpoint questions are **auto-generated retrieval prompts** (template-derived from each slide's objective) — review and personalize them before teaching.

**Audience:** Content authors, editors and marketing writers who publish to the web but do not write code  
**Planned duration:** 45 minutes (about 30 minutes of content plus discussion at the checkpoints)  
**Slides:** 17 total (11 content, 2 auto-generated checkpoints)  
**Theme:** midnight

## How to use this deck

1. The HTML deck (`deck.html`) is keyboard-navigable (arrows, Space, PageUp/PageDown, Home/End) and has a speaker-notes toggle (press **N** or use the button).
2. The PPTX (`deck.pptx`) carries the same text and per-slide notes in native, editable text frames.
3. Pause at every **Checkpoint** slide and let learners answer before advancing — the prompts are retrieval practice, not decoration.
4. The deck passed automated accessibility gates (axe WCAG 2.1 A/AA rules, keyboard traversal, 320 px reflow, contrast, alt text). This is automated testing only — a manual pass with assistive technology is still recommended before high-stakes delivery.

### Slide 1: Intro to WCAG for content authors  `TITLE`

- **Objective:** Set expectations — this is a content-author session, not a developer session.
- **On-slide content:**
  - No code required — this session is about the words, links, images and structure you publish
  - Two short checkpoints: answer from memory, wrong answers welcome
  - Everything today maps to WCAG 2.1 levels A and AA
- **Speaker notes:** Welcome people as they arrive. Say up front that there is no code in this session: everything here is about decisions writers and editors make every day. Mention that there will be two short checkpoints where the group answers questions from memory — that is retrieval practice, and getting things wrong there is the point.

### Slide 2: Part 1 — Why WCAG belongs to you  `SECTION`

- **Objective:** Frame the session: accessibility failures usually start in content decisions, not code.
- **On-slide content:**
  - First: the mental model (POUR)
  - Then: the everyday checklist
- **Speaker notes:** Signpost the two halves of the session. Part 1 is the mental model; Part 2 is the practical checklist people can use tomorrow.

### Slide 3: Accessibility is part of your job  `CONTENT`

- **Objective:** Learners can explain, in one sentence, why accessibility failures usually begin in content decisions rather than code.
- **On-slide content:**
  - The words you write become what screen readers speak
  - Missing alt text, vague links and walls of text are content decisions, not code bugs
  - Retrofitting is expensive; writing it right the first time is nearly free
  - Legal reality: public-sector bodies (and many private ones) must meet WCAG 2.1 AA
- **Speaker notes:** Ask the room who they think "owns" accessibility. Most people point at developers. Walk through the three examples on the slide — every one of them is a writing or publishing decision. Developers can only make accessible what content gives them. A screen reader can only read the words that were written.

### Slide 4: What WCAG is — and isn't  `CONTENT`

- **Objective:** Learners can describe what WCAG covers, what a level A/AA/AAA means, and name two things WCAG does not decide.
- **On-slide content:**
  - WCAG = Web Content Accessibility Guidelines, published by the W3C
  - Three conformance levels: A (must), AA (should, and usually the legal bar), AAA (aspirational)
  - It is technology-neutral: principles and testable criteria, not a code recipe
  - Meeting AA is a floor, not a guarantee — real users still need to be listened to
- **Speaker notes:** Keep this short — it is orientation, not legal training. Emphasise that WCAG is technology-neutral: it says "provide text alternatives", not "use this attribute". The pass/fail line for most organisations is AA; AAA is aspirational for most content. Be honest that meeting WCAG does not guarantee a good experience for every disabled user — it is a floor, not a ceiling.

### Slide 5: The four POUR principles  `CONTENT`

- **Objective:** Learners can name the four POUR principles and say in plain words what each one asks.
- **On-slide content:**
  - Perceivable — can everyone sense it?
  - Operable — can everyone use it?
  - Understandable — does it make sense?
  - Robust — can machines read it?
- **Figure:** informative — alt text: “Diagram of the four POUR principles, each with a plain-language question: Perceivable — can everyone sense it? Operable — can everyone use it? Understandable — does it make sense? Robust — can machines read it?”
- **Speaker notes:** This is the backbone of the whole session — spend time here. Read the diagram aloud and give a one-line plain-language version of each principle. Tell learners the next four slides take one principle each, and that the checkpoint right after will ask them to recall the four from memory. Encourage them to translate each principle into a question they would ask about their own pages. The plain-language questions on the diagram are the ones learners should memorise.

### Slide 6: Perceivable — alternatives you provide  `CONTENT`

- **Objective:** Learners can list the three text alternatives they own most often: alt text, captions and transcripts.
- **On-slide content:**
  - Alt text for meaningful images; empty alt for decorative ones
  - Captions for video; transcripts for audio
  - "chart.png" is not alt text — describe what the reader would miss
  - Test: if the image vanished, what information would be gone? That is your alt text
- **Speaker notes:** Give the fail-forward example: an image of a chart with alt text "chart.png" helps nobody. The test for alt text: close your eyes and have someone read the page — would you get the same information? Mention that decorative images should get empty alt text so screen readers skip them, which is a decision only the author can make. Captions benefit far more people than deaf users: people in open offices, on trains, with sound muted.

### Slide 7: Checkpoint — Perceivable and POUR  `CHECKPOINT (auto-generated)`

- **Question:** Without looking back: name the four POUR principles, then give one concrete example of a Perceivable fix in your own content.
- **Source slide:** “The four POUR principles” (no orphan questions — every prompt comes from a real slide)
- **Facilitation:** pause, collect answers, then advance to the source slide to confirm.
- **On-slide content:**
  - Answer from memory — wrong answers are useful
  - Two minutes, then we confirm on the next slides
- **Speaker notes:** Auto-generated retrieval prompt drawn from the objective of slide "The four POUR principles". Let the room answer before advancing; the source slide follows immediately for confirmation. Review and personalize this prompt before teaching.

### Slide 8: Operable — everything works by keyboard  `CONTENT`

- **Objective:** Learners can explain why keyboard operation matters and name one content decision that breaks it.
- **On-slide content:**
  - Some users cannot use a mouse — tremors, RSI, screen-reader or switch users
  - If it works by click, it must work by keyboard (Tab, Enter, arrows)
  - Visible focus outline is a feature, not a design flaw
  - Hover-only menus and click-only widgets are the usual suspects
- **Speaker notes:** Ask people to unplug their mouse for thirty seconds and try their own site — this lands harder than any explanation. The common content-side keyboard killers are components that only respond to click and links hidden behind hover-only menus. Also mention: never remove the focus outline because it "looks ugly"; visible focus is how keyboard users know where they are.

### Slide 9: Understandable — plain language, predictable pages  `CONTENT`

- **Objective:** Learners can rewrite one piece of jargon into plain language and explain why predictable navigation helps people with cognitive disabilities.
- **On-slide content:**
  - Short sentences, common words, expand acronyms on first use
  - Say the same thing the same way everywhere (labels, buttons, menus)
  - Consistent navigation helps people who rely on memory and habit
  - Plain language helps everyone — including your stressed, distracted expert users
- **Speaker notes:** Read a sentence from your own organisation's site that fails the plain-language test and fix it live if you can. Predictability means menus and terms stay the same across pages — consistency is an editorial job. Explain that this principle exists largely for people with cognitive and learning disabilities, the largest disability group that WCAG's cognitive criteria serve.

### Slide 10: Robust — markup assistive tech can read  `CONTENT`

- **Objective:** Learners can describe, without code, what "robust" asks of the content pipeline: real headings, real lists, real tables.
- **On-slide content:**
  - Use real headings, real lists, real tables — not bold text that looks like them
  - Meaning you write becomes structure assistive tech navigates by
  - Fake structure (visual-only headings, space-formatted tables) is invisible to machines
  - Agree with your developers on what "good content" hands over
- **Speaker notes:** This is the principle authors share with developers, so frame it as a collaboration contract: authors supply meaning, developers supply markup that preserves it. The classic failure is a visually bold line that is not a real heading — it looks structured but screen readers see a paragraph. Same for fake tables made of tabs and spaces in a PDF. If the machine cannot see the structure, no amount of styling helps.

### Slide 11: Checkpoint — Operable, Understandable, Robust  `CHECKPOINT (auto-generated)`

- **Question:** Quick self-check: give one concrete example from your own content where each of Operable, Understandable and Robust applies.
- **Source slide:** “Understandable — plain language, predictable pages” (no orphan questions — every prompt comes from a real slide)
- **Facilitation:** pause, collect answers, then advance to the source slide to confirm.
- **On-slide content:**
  - One example per principle, from pages you actually own
  - Two minutes, then we move to the practical checklist
- **Speaker notes:** Auto-generated retrieval prompt drawn from the objective of slide "Understandable — plain language, predictable pages". Let the room answer before advancing; the source slide follows immediately for confirmation. Review and personalize this prompt before teaching.

### Slide 12: Part 2 — Your everyday checklist  `SECTION`

- **Objective:** Transition from the mental model to the four checks authors run on every page.
- **On-slide content:**
  - Four checks, five minutes, every page
- **Speaker notes:** Signpost: four checks, all doable in under five minutes per page.

### Slide 13: Alt text that actually works  `CONTENT`

- **Objective:** Learners can distinguish informative, decorative and functional images and write alt text for each.
- **On-slide content:**
  - Informative image → describe the information it carries
  - Decorative image → alt="" so screen readers skip it
  - Image inside a link → alt text is the action ("Search", not "icon")
  - Never stuff keywords, never leave "image1.jpg"
- **Speaker notes:** Walk the three cases. Informative images: describe the information, not the picture. Decorative: empty alt, and let them go. Functional (an image inside a link or button): the alt text is the action — "Search", not "magnifying glass icon". Warn about the two classic failures: keyword-stuffed alt text for SEO, and file names pasted in as alt.

### Slide 14: Contrast — text everyone can read  `CONTENT`

- **Objective:** Learners can state the minimum contrast ratios (4.5:1 body text, 3:1 large text) and check them with a free tool.
- **On-slide content:**
  - Body text: at least 4.5:1 against its background
  - Large text (18pt+ or 14pt bold): at least 3:1
  - Light grey body text in templates is the most common failure
  - Free tools: WebAIM contrast checker, or your browser's DevTools
- **Speaker notes:** Show the numbers, then show a real contrast checker (the WebAIM contrast checker or the browser DevTools) on a fail and a pass. Mention low-contrast grey-on-white body text as the most common offender in corporate templates. Also flag that light-grey placeholder text in forms usually fails too.

### Slide 15: Links, headings and structure  `CONTENT`

- **Objective:** Learners can write link text that makes sense out of context and explain why heading order matters to screen-reader users.
- **On-slide content:**
  - Link text must make sense out of context — screen readers skim by link list
  - "Click here" and "read more" fail that test; name the destination instead
  - Headings in order (h1 → h2 → h3), used for structure, not for font size
  - Many screen-reader users navigate entirely by headings
- **Speaker notes:** The classic test: read only the links on a page aloud — "click here", "read more", "learn more" tells a screen-reader user nothing, because many of them skim by link list. For headings: many screen-reader users navigate by heading list, so heading levels must be real and in order. Warn against skipping levels for visual size — that is what CSS is for.

### Slide 16: Check your work before you publish  `CONTENT`

- **Objective:** Learners can run a five-minute pre-publish routine: automated check, keyboard pass, and read-aloud alt test.
- **On-slide content:**
  - Run an automated check (axe DevTools, WAVE) — it catches roughly a third of issues
  - Tab through the page without a mouse
  - Read your alt text aloud: would you get the same information?
  - Automated passes are a floor, not a certificate — real users are the real test
- **Speaker notes:** Frame this as the habit that makes everything stick. Automated tools catch about a third of issues — they find missing alt text and contrast failures, but cannot judge whether alt text is good. The keyboard pass catches what machines miss. Close with the honest framing: WCAG AA is the floor; listening to disabled users is how you get past it.

### Slide 17: Wrap-up — your routine and where to go next  `SECTION`

- **Objective:** Consolidate: POUR as a mental model, four checks as a routine, WCAG AA as the floor.
- **On-slide content:**
  - Ask the four POUR questions about every page you publish
  - Run the five-minute pre-publish check
  - Explore the WCAG quick reference: w3.org/WAI/WCAG21/quickref
  - Bring one of your own pages next time — we will check it together
- **Speaker notes:** Recap in one breath: perceivable, operable, understandable, robust — four questions you can ask about any page. Point people at the WCAG 2.1 quick reference (w3.org) and their organisation's accessibility policy. Thank the room; invite them to bring a real page to the next session and run the checklist on it together.

## Accessibility notes for facilitators

- Describe figures out loud; the alt text above is your script.
- If someone asks for materials in advance, send the HTML deck — it works without JavaScript being required for reading the content order, and it reflows at 320 px width / 400% zoom.
- Known limitation: the PPTX was **not** run through PowerPoint's built-in Accessibility Checker; run it once in PowerPoint before distribution if your organization requires that check.
