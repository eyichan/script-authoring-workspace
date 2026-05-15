import type { ScriptBlock } from "./types";

function orderScriptBlocks(blocks: ScriptBlock[]): ScriptBlock[] {
  return [...blocks].sort((a, b) => a.position - b.position);
}

export function resequenceScriptBlocks(blocks: ScriptBlock[]): ScriptBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    position: index + 1,
  }));
}

export function insertScriptBlockAfter(
  blocks: ScriptBlock[],
  nextBlock: ScriptBlock,
  afterBlockId?: string,
): ScriptBlock[] {
  const orderedBlocks = orderScriptBlocks(blocks);
  const sourceIndex = afterBlockId
    ? orderedBlocks.findIndex((block) => block.id === afterBlockId)
    : -1;
  const insertIndex = sourceIndex >= 0 ? sourceIndex + 1 : orderedBlocks.length;
  const nextBlocks = [...orderedBlocks];

  nextBlocks.splice(insertIndex, 0, nextBlock);

  return resequenceScriptBlocks(nextBlocks);
}

export function updateScriptBlockText(
  blocks: ScriptBlock[],
  blockId: string,
  text: string,
  updatedAt = new Date().toISOString(),
): ScriptBlock[] {
  return blocks.map((block) =>
    block.id === blockId
      ? {
          ...block,
          text,
          updatedAt,
        }
      : block,
  );
}

export function duplicateScriptBlock(
  blocks: ScriptBlock[],
  sourceBlockId: string,
  duplicateBlock: ScriptBlock,
): ScriptBlock[] {
  return insertScriptBlockAfter(blocks, duplicateBlock, sourceBlockId);
}

export function deleteScriptBlock(
  blocks: ScriptBlock[],
  blockId: string,
): ScriptBlock[] {
  return resequenceScriptBlocks(
    orderScriptBlocks(blocks).filter((block) => block.id !== blockId),
  );
}
