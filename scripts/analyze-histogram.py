#!/usr/bin/env python3
"""Analyze a double-encoded JSON typography/color histogram dump.

Usage: python3 analyze-histogram.py <file> [--leaves]
The file contains agent-browser's eval output: a JSON-quoted string wrapping
the actual JSON object (stringify'd twice on the wire).
"""
import json
import sys
from collections import Counter


def load(path: str) -> dict:
    raw = open(path, encoding="utf-8").read().strip()
    data = json.loads(raw)  # outer: the wire string
    if isinstance(data, str):
        data = json.loads(data)  # inner: the actual object
    return data


def main() -> None:
    path = sys.argv[1]
    show_leaves = "--leaves" in sys.argv
    data = load(path)
    leaves = data.get("leaves", data if isinstance(data, list) else [])
    print("leaf count:", data.get("count", len(leaves)))

    fs, lh, ls, col, wt, tag = Counter(), Counter(), Counter(), Counter(), Counter(), Counter()
    for leaf in leaves:
        fs[leaf["fs"]] += 1
        lh[leaf["lh"]] += 1
        ls[leaf["ls"]] += 1
        col[leaf["col"]] += 1
        wt[leaf["wt"]] += 1
        tag[leaf.get("tag", "?")] += 1

    print("FONT-SIZE :", dict(fs.most_common(25)))
    print("LINE-HEIGHT:", dict(lh.most_common(25)))
    print("LETTER-SP :", dict(ls.most_common(15)))
    print("TEXT-COLOR:", dict(col.most_common(18)))
    print("WEIGHT    :", dict(wt.most_common(12)))
    print("TAGS      :", dict(tag.most_common(12)))

    if show_leaves:
        print("\n--- leaves ---")
        for leaf in leaves:
            print(
                f"{leaf.get('tag', '?'):6} {leaf['fs']:8} {leaf['wt']:5} "
                f"{leaf['col']:22} | {leaf['text']!r}"
            )


if __name__ == "__main__":
    main()
