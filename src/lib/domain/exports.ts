import type { ScriptBlock } from "./types";

export type ScriptExportFormat = "fdx" | "fountain" | "pdf";

export type ScriptExportPackage = {
  filename: string;
  mimeType: string;
  content: string;
};

const extensions: Record<ScriptExportFormat, string> = {
  fdx: "fdx",
  fountain: "fountain",
  pdf: "pdf",
};

function slugifyTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "script";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapePdfString(value: string): string {
  return value
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function orderedBlocks(blocks: ScriptBlock[]): ScriptBlock[] {
  return [...blocks].sort((a, b) => a.position - b.position);
}

function getFdxParagraphType(block: ScriptBlock): string {
  switch (block.type) {
    case "scene":
      return "Scene Heading";
    case "action":
      return "Action";
    case "character":
      return "Character";
    case "paren":
      return "Parenthetical";
    case "dialogue":
      return "Dialogue";
    case "transition":
      return "Transition";
    case "comment":
      return "General";
    case "subtitle":
      return "General";
  }
}

function formatFountainBlock(block: ScriptBlock): string {
  const text = block.text.trim();

  switch (block.type) {
    case "scene":
      return text.toUpperCase();
    case "action":
      return text;
    case "character":
      return text.toUpperCase();
    case "paren":
      return text.startsWith("(") ? text : `(${text})`;
    case "dialogue":
      return text;
    case "transition":
      return text.toUpperCase();
    case "comment":
      return `[[${text}]]`;
    case "subtitle":
      return `[[SUBTITLE: ${text}]]`;
  }
}

export function formatFountain(title: string, blocks: ScriptBlock[]): string {
  const body = orderedBlocks(blocks)
    .map(formatFountainBlock)
    .filter(Boolean)
    .join("\n\n");

  return `Title: ${title.trim() || "Untitled Script"}\n\n${body}\n`;
}

export function formatFinalDraftXml(title: string, blocks: ScriptBlock[]): string {
  const paragraphs = orderedBlocks(blocks)
    .map((block) => {
      const paragraphType = getFdxParagraphType(block);
      const text = escapeXml(block.text.trim());

      return `    <Paragraph Type="${paragraphType}">\n      <Text>${text}</Text>\n    </Paragraph>`;
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<FinalDraft DocumentType="Script" Template="No" Version="1">',
    "  <TitlePage>",
    `    <Content>${escapeXml(title.trim() || "Untitled Script")}</Content>`,
    "  </TitlePage>",
    "  <Content>",
    paragraphs,
    "  </Content>",
    "</FinalDraft>",
    "",
  ].join("\n");
}

export function formatPrintableHtml(title: string, blocks: ScriptBlock[]): string {
  const safeTitle = escapeHtml(title.trim() || "Untitled Script");
  const paragraphs = orderedBlocks(blocks)
    .map((block) => {
      const className = `block-${block.type}`;
      const text = escapeHtml(block.text.trim());

      return `<p class="${className}">${text}</p>`;
    })
    .join("\n");

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    `  <title>${safeTitle}</title>`,
    "  <style>",
    "    body { font: 12pt Courier, monospace; margin: 1in; color: #111; }",
    "    h1 { font-size: 14pt; text-align: center; margin-bottom: 2rem; }",
    "    p { margin: 0 0 1rem; white-space: pre-wrap; }",
    "    .block-scene, .block-transition, .block-character { text-transform: uppercase; }",
    "    .block-character { text-align: center; margin-top: 1.5rem; margin-bottom: 0.25rem; }",
    "    .block-dialogue { margin-left: 1.5in; max-width: 3.6in; }",
    "    .block-paren { margin-left: 1.25in; font-style: italic; }",
    "    .block-transition { text-align: right; }",
    "    @media print { body { margin: 0.75in; } }",
    "  </style>",
    "</head>",
    "<body>",
    `  <h1>${safeTitle}</h1>`,
    paragraphs,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function wrapPdfLine(value: string, limit = 78): string[] {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of normalized.split(" ")) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length > limit) {
      lines.push(current);
      current = word;
      continue;
    }

    current = `${current} ${word}`;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function formatPdfBlock(block: ScriptBlock): string[] {
  const text = block.text.trim();

  if (!text) return [""];

  switch (block.type) {
    case "scene":
    case "character":
    case "transition":
      return wrapPdfLine(text.toUpperCase());
    case "paren":
      return wrapPdfLine(text.startsWith("(") ? text : `(${text})`);
    case "comment":
      return wrapPdfLine(`[[${text}]]`);
    case "subtitle":
      return wrapPdfLine(`[[SUBTITLE: ${text}]]`);
    case "action":
    case "dialogue":
      return wrapPdfLine(text);
  }
}

export function formatNativePdf(title: string, blocks: ScriptBlock[]): string {
  const documentTitle = title.trim() || "Untitled Script";
  const lines = [
    documentTitle.toUpperCase(),
    "",
    ...orderedBlocks(blocks).flatMap((block) => [...formatPdfBlock(block), ""]),
  ].slice(0, 44);
  const stream = [
    "BT",
    "/F1 12 Tf",
    "14 TL",
    "72 742 Td",
    ...lines.map((line) => `(${escapePdfString(line)}) Tj T*`),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const [index, object] of objects.entries()) {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return pdf;
}

export function buildScriptExport(
  format: ScriptExportFormat,
  title: string,
  blocks: ScriptBlock[],
): ScriptExportPackage {
  const baseName = slugifyTitle(title);

  if (format === "fdx") {
    return {
      filename: `${baseName}.fdx`,
      mimeType: "application/xml;charset=utf-8",
      content: formatFinalDraftXml(title, blocks),
    };
  }

  if (format === "pdf") {
    return {
      filename: `${baseName}.pdf`,
      mimeType: "application/pdf",
      content: formatNativePdf(title, blocks),
    };
  }

  return {
    filename: `${baseName}.${extensions[format]}`,
    mimeType: "text/plain;charset=utf-8",
    content: formatFountain(title, blocks),
  };
}
