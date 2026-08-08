// Logik-Test fuer den PDF-Farbwaehler (nur das exportierte Ladevorschlag-PDF).
// Extrahiert hexA + PDF_ACCENTS + shade + pdfAccentCSS aus app.html (Block zwischen
// "var hexA =" und "function makeFloorPacker") und prueft die Spec-Zusicherungen.
import fs from "node:fs";
import assert from "node:assert";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const L = fs.readFileSync(path.join(dir, "..", "app.html"), "utf8").split("\n");
const s = L.findIndex((l) => l.includes("var hexA = (hex, a) =>"));
const e = L.findIndex((l, i) => i > s && l.includes("function makeFloorPacker"));
const { hexA, shade, pdfAccentCSS, PDF_ACCENTS } = new Function(
  L.slice(s, e).join("\n") + "\nreturn { hexA, shade, pdfAccentCSS, PDF_ACCENTS };"
)();

test("shade veraendert die Farbe und liefert gueltigen Hex", () => {
  assert.notStrictEqual(shade("#0057a3", -0.22).toLowerCase(), "#0057a3", "shade veraendert die Farbe");
  assert.ok(/^#[0-9a-f]{6}$/i.test(shade("#0057a3", -0.22)), "shade liefert gueltigen Hex-String");
  assert.strictEqual(shade("#000000", -0.22), "#000000", "Schwarz bleibt Schwarz (Clamp unten)");
});

test("pdfAccentCSS: kein Style-Block ohne Farbe (standard)", () => {
  assert.strictEqual(pdfAccentCSS(null), "", "kein Style-Block ohne Farbe");
  assert.strictEqual(pdfAccentCSS(PDF_ACCENTS.standard), "", "standard = kein Override");
});

test("pdfAccentCSS: setzt alle drei --ac-*-Variablen", () => {
  const css = pdfAccentCSS("#0057a3");
  assert.ok(css.includes("--ac-solid:#0057a3"), "Solid-Farbe wird gesetzt");
  assert.ok(css.includes("--ac-grad:"), "Gradient wird gesetzt");
  assert.ok(css.includes("--ac-soft:"), "Soft-Tint wird gesetzt");
  assert.ok(css.startsWith("<style>:root{") && css.endsWith("}</style>"), "gueltiger :root-Style-Block");
});

test("Weiss ist bewusst NICHT als Preset enthalten (Spec Abschnitt 2)", () => {
  const vals = Object.values(PDF_ACCENTS).filter(Boolean).map((h) => h.toLowerCase());
  assert.ok(!vals.includes("#ffffff") && !vals.includes("#fff"), "kein Weiss als Akzent");
  assert.deepStrictEqual(Object.keys(PDF_ACCENTS), ["standard", "blau", "rot"], "genau die drei Presets");
});

console.log("pdf-accent: alle Tests gruen");
