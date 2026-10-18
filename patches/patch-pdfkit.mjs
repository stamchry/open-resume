#!/usr/bin/env node
/**
 * Fix broken copy/paste from generated PDFs when using fonts with shared or
 * multi-mapped glyphs (e.g. Calibri: space=U+0020+U+00A0, hyphen=U+002D+
 * U+00AD+U+2010, ligatures).
 *
 * @react-pdf/renderer@3.x bundles @react-pdf/pdfkit@3.x, whose ToUnicode CMap
 * generation has two bugs (both fixed upstream in pdfkit >= 4):
 *
 *  1. `this.unicode[gid]` is filled with `codePointsForGlyph(gid)` — every
 *     character that reverse-maps to the glyph — instead of the glyph's actual
 *     `glyph.codePoints`.
 *  2. `toUnicodeCmap()` emits one <bfrange> entry per *codepoint* inside the
 *     inner loop, while the CMap maps glyph IDs positionally
 *     (<0000> <NNNN> [entry, entry, ...]). Any glyph with more than one
 *     codepoint shifts every subsequent mapping → extracted text is gibberish.
 *
 * This script patches all four lib builds in place. It is idempotent
 * (re-running reports "already fixed") and exits 0 without touching anything
 * when the installed pdfkit major version is not 3 (upstream already fixed).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = join(root, "node_modules", "@react-pdf", "pdfkit");
const pkgJson = join(pkgDir, "package.json");
const libDir = join(pkgDir, "lib");

if (!existsSync(pkgJson)) {
  console.log("[patch-pdfkit] @react-pdf/pdfkit not installed — nothing to do.");
  process.exit(0);
}

const { version = "" } = JSON.parse(readFileSync(pkgJson, "utf8"));
const major = parseInt(version, 10);
if (major !== 3) {
  console.log(`[patch-pdfkit] pdfkit ${version} (major !== 3) — fix is upstream, skipping.`);
  process.exit(0);
}

// Fix 1: record the glyph's real codepoints instead of every unicode char
// that maps to it.
const OLD1 = "this.unicode[gid] = this.font._cmapProcessor.codePointsForGlyph(glyph.id);";
const NEW1 = "this.unicode[gid] = glyph.codePoints;";

// Fix 2: emit exactly one <bfrange> entry per glyph id by moving
// `entries.push(...)` out of the per-codepoint inner loop.
const OLD2 = `          encoded.push(toHex(value));
          entries.push("<" + encoded.join(' ') + ">");
        }
      }
      cmap.end(`;
const NEW2 = `          encoded.push(toHex(value));
        }
        entries.push("<" + encoded.join(' ') + ">");
      }
      cmap.end(`;

const FILES = [
  "pdfkit.cjs.js",
  "pdfkit.es.js",
  "pdfkit.browser.cjs.js",
  "pdfkit.browser.es.js",
];

const occurrences = (src, needle) => src.split(needle).length - 1;

let patchedAny = false;
for (const f of FILES) {
  const p = join(libDir, f);
  if (!existsSync(p)) continue;

  const original = readFileSync(p, "utf8");
  const hadBug1 = occurrences(original, OLD1);
  const hadBug2 = occurrences(original, OLD2);

  if (hadBug1 === 0 && hadBug2 === 0) {
    if (original.includes(NEW1)) {
      console.log(`[patch-pdfkit] ${f}: already fixed`);
      continue;
    }
    throw new Error(
      `[patch-pdfkit] ${f}: expected buggy code not found and no patch marker present — ` +
        "unknown @react-pdf/pdfkit structure, refusing to guess."
    );
  }

  let src = original.split(OLD1).join(NEW1); // fix 1 (two call sites)
  src = src.replace(OLD2, NEW2); // fix 2 (unique)

  if (src.includes(OLD1) || src.includes(OLD2)) {
    throw new Error(`[patch-pdfkit] ${f}: patch did not fully apply`);
  }

  writeFileSync(p, src);
  console.log(`[patch-pdfkit] ${f}: patched (bug1 sites: ${hadBug1}, bug2: ${hadBug2 ? 1 : 0})`);
  patchedAny = true;
}

console.log(
  patchedAny
    ? "[patch-pdfkit] done — copy/paste ToUnicode CMap fixed for pdfkit " + version
    : "[patch-pdfkit] no lib builds found — nothing to patch"
);
