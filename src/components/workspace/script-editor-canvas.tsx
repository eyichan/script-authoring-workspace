"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import {
  ChevronDown,
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
import {
  commonTransitionOptions,
  scenePrefixOptions,
  sceneTimeOptions,
} from "@/lib/domain/screenplay";
import { cn } from "@/lib/utils";

export type BlockInputElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

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

const sceneSelectClassName =
  "h-8 appearance-none rounded-md border border-[#dfe4e1] bg-[#f8faf9] py-0 pl-2 pr-7 font-mono text-[13px] uppercase leading-none text-[#242421] outline-none transition-colors hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#2e6248]/15";

const blockSelectClassName =
  "h-8 appearance-none border-0 bg-transparent py-0 pl-0 pr-7 text-right font-mono text-[16px] uppercase leading-[1.8] text-[#242421] outline-none focus:bg-[#f9fbfa]";

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
    if (!(input instanceof HTMLSelectElement)) {
      input.select();
    }
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
                  className="mb-[15px] mt-1 flex min-h-[29px] items-center gap-2 font-mono text-[16px] uppercase leading-[1.8] max-[900px]:flex-wrap"
                >
                  <div className="relative shrink-0">
                    <label htmlFor={`scene-prefix-${block.id}`} className="sr-only">
                      Scene prefix
                    </label>
                    <select
                      id={`scene-prefix-${block.id}`}
                      value={scene.prefix}
                      aria-label={`scene prefix block ${index + 1}`}
                      onFocus={() => onBlockFocus(block.id, "Scene")}
                      onChange={(event) =>
                        onScenePartChange(
                          block,
                          { prefix: event.target.value },
                          true,
                        )
                      }
                      className={cn(sceneSelectClassName, "w-[112px]")}
                    >
                      {scenePrefixOptions.map((prefix) => (
                        <option key={prefix.value} value={prefix.value}>
                          {prefix.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#767d79]" />
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
                  <div className="relative shrink-0">
                    <label htmlFor={`scene-time-${block.id}`} className="sr-only">
                      Scene time
                    </label>
                    <select
                      id={`scene-time-${block.id}`}
                      value={scene.timeOfDay}
                      aria-label={`scene time block ${index + 1}`}
                      onFocus={() => onBlockFocus(block.id, "Scene")}
                      onChange={(event) =>
                        onScenePartChange(
                          block,
                          { timeOfDay: event.target.value },
                          true,
                        )
                      }
                      className={cn(sceneSelectClassName, "w-[162px]")}
                    >
                      {!sceneTimeOptions.some(
                        (timeOfDay) => timeOfDay.value === scene.timeOfDay,
                      ) ? (
                        <option value={scene.timeOfDay}>{scene.timeOfDay}</option>
                      ) : null}
                      {sceneTimeOptions.map((timeOfDay) => (
                        <option key={timeOfDay.value} value={timeOfDay.value}>
                          {timeOfDay.value}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#767d79]" />
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
                    className="block ml-[220px] w-[250px] max-w-[calc(100%_-_220px)] border-0 bg-transparent p-0 text-left font-mono text-[16px] uppercase leading-[1.8] text-[#242421] outline-none placeholder:text-[#aeb6b2] focus:bg-[#f9fbfa] max-[900px]:ml-[28%] max-[900px]:max-w-[72%]"
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

            if (block.type === "transition") {
              const transitionFieldId = `transition-${block.id}`;
              const transitionIsCommon = commonTransitionOptions.includes(
                block.text as (typeof commonTransitionOptions)[number],
              );

              return withBlockMenu(
                block,
                <div className="mb-5 mt-5 flex justify-end">
                  <label htmlFor={transitionFieldId} className="sr-only">
                    Transition
                  </label>
                  <div className="relative w-[260px] max-w-full">
                    <select
                      ref={(node) => {
                        blockInputRefs.current[block.id] = node;
                      }}
                      id={transitionFieldId}
                      name={transitionFieldId}
                      aria-label={`transition block ${index + 1}`}
                      value={transitionIsCommon ? block.text : "__custom"}
                      onFocus={() => onBlockFocus(block.id, "Transition")}
                      onChange={(event) => {
                        if (event.target.value === "__custom") return;
                        onBlockChange(block.id, event.target.value);
                      }}
                      onBlur={(event) =>
                        onBlockBlur(block, event.currentTarget)
                      }
                      onKeyDown={(event) => onBlockKeyDown(block, event)}
                      className={cn(blockSelectClassName, "w-full")}
                    >
                      {!transitionIsCommon ? (
                        <option value="__custom">{block.text || "CUSTOM"}</option>
                      ) : null}
                      {commonTransitionOptions.map((transition) => (
                        <option key={transition} value={transition}>
                          {transition}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#767d79]" />
                  </div>
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
                      "mb-0 ml-[144px] max-w-[240px] text-left text-[#5f6662] max-[900px]:ml-[18%] max-[900px]:max-w-[64%]",
                    block.type === "dialogue" &&
                      "ml-[96px] max-w-[336px] max-[900px]:ml-[12%] max-[900px]:max-w-[76%]",
                    block.type === "comment" &&
                      "rounded-md border border-dashed border-[#d9dedb] bg-[#f3f6f4]/70 px-2 py-1 text-[#66706b]",
                    block.type === "subtitle" &&
                      "ml-[96px] max-w-[420px] text-[#3e5950] max-[900px]:ml-[12%] max-[900px]:max-w-[76%]",
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
