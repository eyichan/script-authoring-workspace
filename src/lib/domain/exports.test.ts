import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildScriptExport,
  formatFinalDraftXml,
  formatFountain,
  formatNativePdf,
} from "./exports";
import type { ScriptBlock } from "./types";

const blocks: ScriptBlock[] = [
  {
    id: "block-2",
    scriptId: "script-test",
    type: "action",
    text: "A door opens.",
    position: 2,
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  },
  {
    id: "block-1",
    scriptId: "script-test",
    type: "scene",
    text: "INT. TEST ROOM - DAY",
    position: 1,
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  },
  {
    id: "block-3",
    scriptId: "script-test",
    type: "character",
    text: "Ada",
    position: 3,
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  },
  {
    id: "block-4",
    scriptId: "script-test",
    type: "dialogue",
    text: "We are live.",
    position: 4,
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  },
  {
    id: "block-5",
    scriptId: "script-test",
    type: "paren",
    text: "quietly",
    position: 5,
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  },
  {
    id: "block-6",
    scriptId: "script-test",
    type: "transition",
    text: "SMASH CUT TO:",
    position: 6,
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  },
];

describe("script exports", () => {
  it("formats ordered Fountain text", () => {
    const fountain = formatFountain("Pilot Draft", blocks);

    assert.match(fountain, /^Title: Pilot Draft/);
    assert.ok(
      fountain.indexOf("INT. TEST ROOM - DAY") < fountain.indexOf("A door opens."),
    );
    assert.match(fountain, /ADA\n\nWe are live\./);
    assert.match(fountain, /> SMASH CUT TO:/);
  });

  it("formats Final Draft XML with escaped text", () => {
    const xml = formatFinalDraftXml("Pilot & Draft", blocks);

    assert.match(xml, /<FinalDraft DocumentType="Script"/);
    assert.match(xml, /Pilot &amp; Draft/);
    assert.match(xml, /<Paragraph Type="Scene Heading">/);
    assert.match(xml, /<Paragraph Type="Dialogue">/);
    assert.match(xml, /<Paragraph Type="Transition">/);
  });

  it("builds export packages with useful filenames and mime types", () => {
    const fdx = buildScriptExport("fdx", "Pilot Draft", blocks);
    const fountain = buildScriptExport("fountain", "Pilot Draft", blocks);
    const pdf = buildScriptExport("pdf", "Pilot Draft", blocks);

    assert.equal(fdx.filename, "pilot-draft.fdx");
    assert.equal(fountain.filename, "pilot-draft.fountain");
    assert.equal(pdf.filename, "pilot-draft.pdf");
    assert.equal(fdx.mimeType, "application/xml;charset=utf-8");
    assert.equal(pdf.mimeType, "application/pdf");
  });

  it("formats a native PDF document", () => {
    const pdf = formatNativePdf("Pilot Draft", blocks);

    assert.match(pdf, /^%PDF-1\.4/);
    assert.match(pdf, /\/Type \/Catalog/);
    assert.match(pdf, /INT\. TEST ROOM - DAY/);
    assert.match(pdf, /SMASH CUT TO:/);
    assert.match(pdf, /startxref\n\d+\n%%EOF/);
  });
});
