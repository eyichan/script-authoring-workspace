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
  pdf: "html",
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
      filename: `${baseName}-print.html`,
      mimeType: "text/html;charset=utf-8",
      content: formatPrintableHtml(title, blocks),
    };
  }

  return {
    filename: `${baseName}.${extensions[format]}`,
    mimeType: "text/plain;charset=utf-8",
    content: formatFountain(title, blocks),
  };
}
