#!/usr/bin/env python3
"""Round-trip verification for a slidewalk PPTX.

Checks, in order:
1. The file is a valid ZIP with the OOXML parts a PowerPoint file needs
   (presentation.xml, slide parts, notesSlide parts).
2. python-pptx can open it and read back every slide: title text, body text,
   and speaker notes survive the round-trip.
3. Every slide has a notes part.

Exit 0 = verified; exit 1 = any check failed with a printed reason.
"""
import json
import sys
import zipfile


def fail(msg):
    print(f"pptx-verify: FAIL — {msg}")
    sys.exit(1)


def main():
    if len(sys.argv) < 3:
        fail("usage: verify-pptx.py <deck.pptx> <deck.json>")
    pptx_path, json_path = sys.argv[1], sys.argv[2]

    # --- 1. ZIP / OOXML sanity -------------------------------------------------
    try:
        zf = zipfile.ZipFile(pptx_path)
    except zipfile.BadZipFile as e:
        fail(f"not a valid zip/pptx file: {e}")
    names = zf.namelist()
    required = ["[Content_Types].xml", "ppt/presentation.xml"]
    for part in required:
        if part not in names:
            fail(f"missing required OOXML part: {part}")
    slide_parts = sorted(n for n in names if n.startswith("ppt/slides/slide") and n.endswith(".xml"))
    notes_parts = sorted(n for n in names if n.startswith("ppt/notesSlides/notesSlide") and n.endswith(".xml"))

    # --- 2. python-pptx round-trip read ----------------------------------------
    from pptx import Presentation

    with open(json_path, "r", encoding="utf-8") as f:
        deck = json.load(f)
    expected = deck["slides"]

    try:
        prs = Presentation(pptx_path)
    except Exception as e:  # noqa: BLE001
        fail(f"python-pptx could not open the file: {e}")

    slides = list(prs.slides)
    if len(slides) != len(expected):
        fail(f"slide count mismatch: pptx has {len(slides)}, deck JSON has {len(expected)}")

    problems = []
    for i, (slide, src) in enumerate(zip(slides, expected), start=1):
        # title text frame survived
        texts = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                texts.append(shape.text_frame.text)
        joined = "\n".join(texts)
        if src["title"] not in joined:
            problems.append(f"slide {i}: title text missing after round-trip: “{src['title'][:60]}”")
        # bullets survived (content slides)
        for b in src.get("bullets", []):
            if b not in joined:
                problems.append(f"slide {i}: bullet text missing after round-trip: “{b[:60]}”")
        # notes survived
        if not slide.has_notes_slide:
            problems.append(f"slide {i}: no notes slide part")
        else:
            note_text = slide.notes_slide.notes_text_frame.text or ""
            if not note_text.strip():
                problems.append(f"slide {i}: speaker notes are empty")
            elif src.get("notes") and src["notes"][:40] not in note_text:
                problems.append(f"slide {i}: speaker notes text does not match the source deck JSON")

    if len(notes_parts) < len(slides):
        problems.append(f"only {len(notes_parts)} notesSlide parts for {len(slides)} slides")

    if problems:
        for p in problems:
            print(f"pptx-verify: FAIL — {p}")
        sys.exit(1)

    size_kb = round(len(open(pptx_path, "rb").read()) / 1024, 1)
    print(f"pptx-verify: PASS — {len(slides)} slides round-tripped")
    print(f"  zip parts: {len(names)} ({len(slide_parts)} slide parts, {len(notes_parts)} notesSlide parts)")
    print(f"  titles, body text and speaker notes match deck.json; file size {size_kb} KB")
    # sample of what came back
    first = slides[0]
    title_text = next((s.text_frame.text for s in first.shapes if s.has_text_frame and s.text_frame.text), "?")
    print(f"  sample: slide 1 reads back as “{title_text}”; notes: “{(first.notes_slide.notes_text_frame.text or '')[:80]}...”")


if __name__ == "__main__":
    main()
