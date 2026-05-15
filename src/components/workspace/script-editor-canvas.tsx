"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import {
  Copy,
  ExternalLink,
  Film,
  MessageSquare,
  Quote,
  RefreshCcw,
  Subtitles,
  Trash2,
  User,
  Zap,
} from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  DerivedCharacter,
  SceneHeadingParts,
  ScriptBlock,
  ScriptBlockType,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export type BlockInputElement = HTMLInputElement | HTMLTextAreaElement;

const scriptTools = [
  { label: "Scene", icon: Film },
  { label: "Action", icon: Zap },
  { label: "Character", icon: User },
  { label: "Paren", icon: Quote },
  { label: "Dialogue", icon: MessageSquare },
  { label: "Transition", icon: RefreshCcw },
  { label: "Comment", icon: MessageSquare },
  { label: "Subtitle", icon: Subtitles },
] as const;

export type ToolLabel = (typeof scriptTools)[number]["label"];

const blockTypeToTool: Record<ScriptBlockType, ToolLabel> = {
  scene: "Scene",
  action: "Action",
  character: "Character",
  paren: "Paren",
  dialogue: "Dialogue",
  transition: "Transition",
  comment: "Comment",
  subtitle: "Subtitle",
};

const scenePrefixOptions = ["INT", "EXT"] as const;
const sceneTimeOptions = ["DAY", "NIGHT"] as const;

type ScriptEditorCanvasProps = {
  activeTool: ToolLabel;
  blocks: ScriptBlock[];
  characters: DerivedCharacter[];
  pendingFocusBlockId: string | null;
  sceneDrafts: Record<string, SceneHeadingParts>;
  scriptMutationPending: boolean;
  getSceneDraft: (text: string) => SceneHeadingParts;
  onBlockBlur: (block: ScriptBlock, input: BlockInputElement) => void;
  onBlockChange: (blockId: string, value: string) => void;
  onBlockFocus: (blockId: string, tool: ToolLabel) => void;
  onBlockKeyDown: (
    block: ScriptBlock,
    event: KeyboardEvent<BlockInputElement>,
  ) => void;
  onDeleteBlock: (block: ScriptBlock) => void;
  onDuplicateBlock: (block: ScriptBlock) => void;
  onInsertBlock: (tool: ToolLabel) => void;
  onOpenBlock: (blockId: string) => void;
  onPendingFocusHandled: () => void;
  onScenePartChange: (
    block: ScriptBlock,
    patch: Partial<SceneHeadingParts>,
    persist?: boolean,
  ) => void;
};

function getDefaultBlockText(tool: ToolLabel): string {
  switch (tool) {
    case "Scene":
      return "EXT. ORBITAL DOCK - DAWN";
    case "Action":
      return "A maintenance alarm pulses across the empty corridor.";
    case "Character":
      return "DR. VALE";
    case "Paren":
      return "(quietly)";
    case "Dialogue":
      return "If the signal is real, we are already late.";
    case "Transition":
      return "CUT TO:";
    case "Comment":
      return "Need a stronger visual hook here.";
    case "Subtitle":
      return "Radio chatter overlaps in Mandarin.";
  }
}

function getBlockLabel(type: ScriptBlockType): string {
  return blockTypeToTool[type];
}

function getBlockSummary(block: ScriptBlock): string {
  const text = block.text.trim();
  if (text) return text;

  return `${getBlockLabel(block.type)} block`;
}

function resizeBlockInput(input: HTMLTextAreaElement) {
  input.style.height = "auto";
  input.style.height = `${Math.max(input.scrollHeight, 29)}px`;
}

export function ScriptEditorCanvas({
  activeTool,
  blocks,
  characters,
  pendingFocusBlockId,
  sceneDrafts,
  scriptMutationPending,
  getSceneDraft,
  onBlockBlur,
  onBlockChange,
  onBlockFocus,
  onBlockKeyDown,
  onDeleteBlock,
  onDuplicateBlock,
  onInsertBlock,
  onOpenBlock,
  onPendingFocusHandled,
  onScenePartChange,
}: ScriptEditorCanvasProps) {
  const blockInputRefs = useRef<Record<string, BlockInputElement | null>>({});

  useEffect(() => {
    if (!pendingFocusBlockId) return;

    const input = blockInputRefs.current[pendingFocusBlockId];
    if (!input) return;

    input.focus();
    input.select();
    if (input instanceof HTMLTextAreaElement) {
      resizeBlockInput(input);
    }
    onPendingFocusHandled();
  }, [blocks, onPendingFocusHandled, pendingFocusBlockId]);

  const withBlockMenu = (block: ScriptBlock, children: ReactNode) => (
    <ContextMenu key={block.id}>
      <ContextMenuTrigger className="select-text">{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-[178px] border-[#dfe4e1] bg-[#fcfdfc] text-[#252522]">
        <ContextMenuGroup>
          <ContextMenuLabel className="max-w-[220px] truncate">
            {getBlockSummary(block)}
          </ContextMenuLabel>
        </ContextMenuGroup>
        <ContextMenuItem onClick={() => onOpenBlock(block.id)}>
          <ExternalLink className="size-4" />
          Open
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicateBlock(block)}>
          <Copy className="size-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => onDeleteBlock(block)}
        >
          <Trash2 className="size-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  return (
    <div className="relative min-h-[1180px] px-4 pb-20 pt-8 max-[900px]:px-3">
      <div className="sticky top-8 z-10 mx-auto mb-[-53px] flex w-[520px] max-w-full items-center gap-0 rounded-full border border-[#deded9] bg-[#fafaf8]/92 px-3 py-1 shadow-[0_10px_28px_rgb(30_30_28/0.1)] backdrop-blur-xl max-[900px]:top-2 max-[900px]:w-[calc(100vw-44px)] max-[900px]:max-w-[calc(100vw-44px)] max-[900px]:overflow-x-auto max-[900px]:rounded-2xl">
        {scriptTools.map((tool) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger
              type="button"
              disabled={scriptMutationPending}
              onClick={() => onInsertBlock(tool.label)}
              className={cn(
                "relative grid h-[45px] w-[62px] shrink-0 justify-items-center gap-0.5 rounded-full bg-transparent px-2 py-1.5 text-[11px] font-normal text-[#6b7370] transition-[background-color,color] duration-150 hover:bg-[#f0f3f1]",
                activeTool === tool.label &&
                  "text-[#171a19] after:absolute after:bottom-1 after:left-1/2 after:h-0.5 after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-[#2e6248]",
              )}
            >
              <tool.icon className="size-[17px]" />
              <span>{tool.label}</span>
            </TooltipTrigger>
            <TooltipContent>{tool.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <article className="script-paper mx-auto mt-[-20px] min-h-[1210px] w-[min(816px,100%)] overflow-hidden">
        <div className="mx-auto max-w-[576px] px-0 pb-36 pt-[104px] font-mono text-[16px] leading-[1.8] max-[900px]:max-w-[86%] max-[900px]:pt-20 max-[900px]:text-[13px]">
          {blocks.map((block, index) => {
            if (block.type === "scene") {
              const scene = sceneDrafts[block.id] ?? getSceneDraft(block.text);
              const sceneLocationId = `scene-location-${block.id}`;

              return withBlockMenu(
                block,
                <div
                  data-testid={`script-block-${index + 1}`}
                  className="mb-[15px] mt-1 flex min-h-[29px] items-center gap-2 font-mono text-[16px] uppercase leading-[1.8]"
                >
                  <div className="flex overflow-hidden rounded-md border border-[#e1e5e2] bg-[#f8faf9]">
                    {scenePrefixOptions.map((prefix) => (
                      <button
                        key={prefix}
                        type="button"
                        onClick={() =>
                          onScenePartChange(block, { prefix }, true)
                        }
                        className={cn(
                          "h-7 px-2 text-[13px] text-[#747c78] transition-colors hover:bg-white",
                          scene.prefix === prefix &&
                            "bg-white text-[#171a19] shadow-[inset_0_0_0_1px_rgb(46_98_72/0.16)]",
                        )}
                      >
                        {prefix}.
                      </button>
                    ))}
                  </div>
                  <label htmlFor={sceneLocationId} className="sr-only">
                    Scene location
                  </label>
                  <input
                    ref={(node) => {
                      blockInputRefs.current[block.id] = node;
                    }}
                    id={sceneLocationId}
                    name={sceneLocationId}
                    aria-label={`scene location block ${index + 1}`}
                    value={scene.locationName}
                    placeholder="LOCATION"
                    spellCheck={false}
                    onFocus={() => onBlockFocus(block.id, "Scene")}
                    onChange={(event) =>
                      onScenePartChange(block, {
                        locationName: event.target.value,
                      })
                    }
                    onBlur={(event) => onBlockBlur(block, event.currentTarget)}
                    onKeyDown={(event) => onBlockKeyDown(block, event)}
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[16px] uppercase leading-[1.8] text-[#242421] outline-none placeholder:text-[#aeb6b2] focus:bg-[#f9fbfa]"
                  />
                  <span className="text-[#a0a6a2]">-</span>
                  <div className="flex overflow-hidden rounded-md border border-[#e1e5e2] bg-[#f8faf9]">
                    {sceneTimeOptions.map((timeOfDay) => (
                      <button
                        key={timeOfDay}
                        type="button"
                        onClick={() =>
                          onScenePartChange(block, { timeOfDay }, true)
                        }
                        className={cn(
                          "h-7 px-2 text-[13px] text-[#747c78] transition-colors hover:bg-white",
                          scene.timeOfDay === timeOfDay &&
                            "bg-white text-[#171a19] shadow-[inset_0_0_0_1px_rgb(46_98_72/0.16)]",
                        )}
                      >
                        {timeOfDay}
                      </button>
                    ))}
                  </div>
                </div>,
              );
            }

            if (block.type === "character") {
              const listId = `character-options-${block.id}`;
              const characterFieldId = `character-${block.id}`;

              return withBlockMenu(
                block,
                <div className="mb-1 mt-5">
                  <label htmlFor={characterFieldId} className="sr-only">
                    Character name
                  </label>
                  <input
                    ref={(node) => {
                      blockInputRefs.current[block.id] = node;
                    }}
                    id={characterFieldId}
                    name={characterFieldId}
                    aria-label={`character block ${index + 1}`}
                    list={listId}
                    value={block.text}
                    placeholder={getDefaultBlockText("Character")}
                    spellCheck={false}
                    onFocus={() => onBlockFocus(block.id, "Character")}
                    onChange={(event) =>
                      onBlockChange(block.id, event.target.value)
                    }
                    onBlur={(event) => onBlockBlur(block, event.currentTarget)}
                    onKeyDown={(event) => onBlockKeyDown(block, event)}
                    className="block w-full border-0 bg-transparent p-0 text-center font-mono text-[16px] uppercase leading-[1.8] text-[#242421] outline-none placeholder:text-[#aeb6b2] focus:bg-[#f9fbfa]"
                  />
                  <datalist id={listId}>
                    {characters.map((character) => (
                      <option
                        key={character.id}
                        value={character.displayName}
                      />
                    ))}
                  </datalist>
                </div>,
              );
            }

            const blockFieldId = `${block.type}-${block.id}`;
            const tool = blockTypeToTool[block.type];

            return withBlockMenu(
              block,
              <>
                <label htmlFor={blockFieldId} className="sr-only">
                  {getBlockLabel(block.type)}
                </label>
                <textarea
                  ref={(node) => {
                    blockInputRefs.current[block.id] = node;
                    if (node) resizeBlockInput(node);
                  }}
                  id={blockFieldId}
                  name={blockFieldId}
                  aria-label={`${block.type} block ${index + 1}`}
                  rows={1}
                  value={block.text}
                  placeholder={getDefaultBlockText(tool)}
                  spellCheck={false}
                  onFocus={() => onBlockFocus(block.id, tool)}
                  onChange={(event) => {
                    onBlockChange(block.id, event.target.value);
                    resizeBlockInput(event.target);
                  }}
                  onBlur={(event) => onBlockBlur(block, event.currentTarget)}
                  onInput={(event) => resizeBlockInput(event.currentTarget)}
                  onKeyDown={(event) => onBlockKeyDown(block, event)}
                  className={cn(
                    "block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-mono text-[16px] leading-[1.8] text-[#242421] outline-none placeholder:text-[#aeb6b2] focus:bg-[#f9fbfa]",
                    "mb-[15px] whitespace-pre-wrap",
                    block.type === "paren" &&
                      "m-0 text-center italic text-[#74746f]",
                    block.type === "dialogue" && "mx-auto max-w-[470px]",
                    block.type === "transition" && "mb-5",
                  )}
                />
              </>,
            );
          })}
        </div>
      </article>
    </div>
  );
}
