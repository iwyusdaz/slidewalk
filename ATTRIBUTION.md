# Attribution

## Inspiration (patterns adopted, no code copied)

slidewalk's architecture was shaped by studying two open-source projects. No source code from either was copied; the patterns below were re-implemented from scratch in this repository.

| Project | What we adopted | License | Changes made |
|---|---|---|---|
| [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) | The idea of zero-dependency single-file HTML deck output, and the "style bake-off" workflow (render the user's real content in several visual themes and let them choose by looking). | MIT (checked at build time) | Re-implemented as a Node build step with an intermediate deck JSON; added the accessibility gate layer, which is the core of slidewalk and absent in the source. |
| [hugohe3/ppt-master](https://github.com/hugohe3/ppt-master) | The native-PPTX approach: real text frames and slide structure rather than exported images, and speaker notes treated as first-class narration content. | MIT | Re-implemented on python-pptx with a shared intermediate JSON so HTML and PPTX come from one source of truth; added per-slide objective metadata and round-trip verification. |

## Third-party software (dependencies, not bundled)

| Package | Version | License | Role |
|---|---|---|---|
| [axe-core](https://github.com/dequelabs/axe-core) | 4.11.1 | MPL-2.0 | Accessibility rule engine inside the gate runner. Run, not redistributed. |
| [Playwright](https://github.com/microsoft/playwright) | 1.57.0 | Apache-2.0 | Browser automation for the gates. |
| [python-pptx](https://github.com/scanny/python-pptx) | 1.0.2 | MIT | PPTX generation and round-trip verification. |

## Content

- The reference deck "Intro to WCAG for content authors" is original content for this repository, written to teach WCAG 2.1 concepts at a content-author level. It cites the WCAG 2.1 quick reference (W3C, CC BY 4.0) as further reading. WCAG itself is published by the W3C: https://www.w3.org/TR/WCAG21/
- Screenshots in `docs/assets/` were captured with Playwright from the generated deck and are part of the CC BY 4.0 content of this repo.

## Repository licensing

- Code (`skill/`, `tooling/`, `tooling-py/`, `tests/`, generated deck HTML/CSS/JS): MIT — see [LICENSE](LICENSE).
- Learning content and case study (outlines, deck text, facilitator guide, `docs/` prose, `evaluation/`): CC BY 4.0.
