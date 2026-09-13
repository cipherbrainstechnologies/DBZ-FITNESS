"""Extract the 18 specification Markdown files from IntialGPTFIle.md."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "IntialGPTFIle.md"


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    cut_markers = (
        "all 18 files in md format",
        "I can’t attach downloadable",
        "I can't attach downloadable",
    )
    cut = len(text)
    for marker in cut_markers:
        idx = text.find(marker)
        if idx != -1:
            cut = min(cut, idx)
    body = text[:cut]

    pattern = re.compile(r"^File (\d+) — (.+)$", re.M)
    matches = list(pattern.finditer(body))
    if len(matches) != 18:
        raise SystemExit(f"Expected 18 file markers, found {len(matches)}")

    for i, match in enumerate(matches):
        rel = match.group(2).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        content = body[start:end].strip() + "\n"
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content, encoding="utf-8", newline="\n")
        print(f"Wrote {rel}")


if __name__ == "__main__":
    main()
