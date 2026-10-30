# tooling-py

Python side of slidewalk: PPTX generation (python-pptx) and PPTX round-trip verification.

## Setup

The venv is created automatically on first use (by `skill/scripts/pptx-runner.mjs` or `verify-pptx.sh`), or manually:

```sh
python3 -m venv .venv
.venv/bin/pip install python-pptx==1.0.2
```

`.venv/` is git-ignored; the dependency is pinned in both `pptx-runner.mjs` and this README.

## Files

- `verify-pptx.py` — round-trip verifier: checks the OOXML zip parts, then re-reads every slide with python-pptx and compares titles, body text and speaker notes against `deck.json`. Exit 0 = verified.
- `verify-pptx.sh` — shell wrapper that uses/creates the venv, then runs the verifier.

## Usage

```sh
tooling-py/verify-pptx.sh docs/deck.pptx docs/deck.json
```
