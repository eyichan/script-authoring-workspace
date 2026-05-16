"use client";

import type { ComponentType } from "react";
import {
  Atom,
  Box,
  Film,
  Hourglass,
  ImageIcon,
  LayoutGrid,
  LockKeyhole,
  MapPin,
  MessageSquare,
  PenLine,
  Table2,
  Trash2,
  User,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Beat, DerivedScene } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export type WorkbenchPageName =
  | "Characters"
  | "Props"
  | "Locations"
  | "Scenes"
  | "Assets";

export type WorkbenchCard = {
  id: string;
  title: string;
  persisted: boolean;
};

export const workbenchConfig = {
  Characters: {
    title: "Characters",
    count: 3,
    tabs: [
      { label: "Overview", icon: User },
      { label: "Relationships", icon: Atom },
      { label: "Casting", icon: Table2 },
    ],
    action: "New Character",
    emptyTitle: "Casting Sheet",
    emptyCopy:
      "Characters come from the script. Add them here in advance, or write a character name in the script and the entity will be created automatically.",
  },
  Props: {
    title: "Props",
    count: 4,
    tabs: [
      { label: "Overview", icon: PenLine },
      { label: "List", icon: Table2 },
    ],
    action: "New Prop",
    emptyTitle: "Prop Book",
    emptyCopy:
      "Props turn action lines into production memory: cassette tape, motel key, coffee cup, and evidence bag.",
  },
  Locations: {
    title: "Locations",
    count: 3,
    tabs: [
      { label: "Overview", icon: MapPin },
      { label: "Relationships", icon: Atom },
      { label: "Scout Sheet", icon: Table2 },
    ],
    action: "Add",
    emptyTitle: "Scout Book",
    emptyCopy:
      "Locations come from scene headings and help scout, lighting, and production teams align before principal photography.",
  },
  Scenes: {
    title: "Scene Board",
    count: 3,
    tabs: [
      { label: "Cards", icon: Film },
      { label: "Scene List", icon: Table2 },
    ],
    action: "Tidy",
    emptyTitle: "Scene Board",
    emptyCopy:
      "Scenes become production units for still generation, shot planning, and video prompts.",
  },
  Assets: {
    title: "Assets",
    count: 5,
    tabs: [
      { label: "All", icon: LayoutGrid },
      { label: "Stills", icon: ImageIcon },
      { label: "Videos", icon: Video },
    ],
    action: "Import",
    emptyTitle: "Asset Library",
    emptyCopy:
      "Generated stills, videos, reference images, and production exports live here with links back to scenes.",
  },
} satisfies Record<
  WorkbenchPageName,
  {
    title: string;
    count: number;
    tabs: Array<{ label: string; icon: ComponentType<{ className?: string }> }>;
    action: string;
    emptyTitle: string;
    emptyCopy: string;
  }
>;

export function WorkbenchTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Array<{ label: string; icon: ComponentType<{ className?: string }> }>;
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="pointer-events-auto flex h-9 items-center rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]">
      {tabs.map((tab) => (
        <Button
          key={tab.label}
          variant="ghost"
          onClick={() => onChange(tab.label)}
          className={cn(
            "h-7 min-w-[100px] gap-1.5 rounded-lg bg-transparent px-3 text-[12px] font-medium text-[#6b7370] opacity-60 shadow-none transition-[background-color,box-shadow,color,opacity] duration-200 hover:bg-[#eef2f0] active:translate-y-0",
            activeTab === tab.label &&
              "bg-[#fcfdfc] text-[#171a19] opacity-100 shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#fcfdfc]",
          )}
        >
          <tab.icon className="size-[14px]" data-icon="inline-start" />
          {tab.label}
        </Button>
      ))}
    </div>
  );
}

export function BeatsPage({
  beats,
  message,
  mutationPending,
  onDeleteBeat,
  onUpdateBeat,
}: {
  beats: Beat[];
  message: string;
  mutationPending: boolean;
  onDeleteBeat: (beatId: string) => void;
  onUpdateBeat: (beatId: string, title: string) => void;
}) {
  return (
    <div className="relative min-h-[669px] px-6 py-6">
      <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-4 max-[1100px]:grid-cols-1">
        <div className="overflow-hidden rounded-xl border border-[#deded8] bg-[#fcfdfc] shadow-[0_8px_24px_rgb(42_42_37/0.08)]">
          {beats.map((beat, index) => (
            <div
              key={beat.id}
              className="grid grid-cols-[44px_minmax(0,1fr)_76px_32px] items-center gap-3 border-b border-[#eeeeea] px-4 py-3 text-[13px] last:border-b-0"
            >
              <span className="text-[#8b8b84]">#{index + 1}</span>
              <div className="min-w-0">
                <label htmlFor={`beat-title-${beat.id}`} className="sr-only">
                  Beat title {index + 1}
                </label>
                <input
                  id={`beat-title-${beat.id}`}
                  name={`beat-title-${beat.id}`}
                  aria-label={`Beat title ${index + 1}`}
                  defaultValue={beat.title}
                  disabled={mutationPending}
                  spellCheck={false}
                  onBlur={(event) => {
                    const nextTitle = event.target.value.trim();
                    if (nextTitle && nextTitle !== beat.title) {
                      onUpdateBeat(beat.id, nextTitle);
                    } else {
                      event.target.value = beat.title;
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                    if (event.key === "Escape") {
                      event.currentTarget.value = beat.title;
                      event.currentTarget.blur();
                    }
                  }}
                  className="block w-full truncate border-0 bg-transparent p-0 font-medium text-[#242421] outline-none focus:bg-[#f8faf9] disabled:opacity-60"
                />
                <span className="block truncate text-[#777771]">
                  {beat.description}
                </span>
              </div>
              <Badge variant="secondary">{beat.durationMinutes} min</Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={mutationPending}
                aria-label={`Delete ${beat.title}`}
                onClick={() => onDeleteBeat(beat.id)}
                className="size-8 rounded-full text-[#8d938f] hover:bg-[#f1f4f2] hover:text-[#b0473e] active:translate-y-0"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#deded8] bg-white p-4 shadow-[0_8px_24px_rgb(42_42_37/0.07)]">
          <div className="mb-3 grid size-9 place-items-center rounded-lg bg-[#eef3ef] text-[#2e6248]">
            <Hourglass className="size-5" />
          </div>
          <h3 className="text-[16px] font-medium leading-6">Beat outline</h3>
          <p className="mt-2 text-[13px] leading-5 text-[#777771]">
            Beats are manual outline units. They stay separate from script-derived
            scenes so the writer can plan structure before rewriting pages.
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-[#cfd8d2] bg-[#f8faf8] p-3 text-[13px] leading-5 text-[#6f7772]">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkbenchPage({
  page,
  activeTab,
  activeItemId,
  additions,
  message,
  generatedStills,
  onGenerateStill,
  cards,
  scenes,
  mutationPending,
  onDeleteCard,
  onUpdateCard,
}: {
  page: WorkbenchPageName;
  activeTab: string;
  activeItemId: string;
  additions: number;
  message: string;
  generatedStills: string[];
  onGenerateStill: (sceneId: string) => void;
  cards: WorkbenchCard[];
  scenes: DerivedScene[];
  mutationPending: boolean;
  onDeleteCard: (id: string) => void;
  onUpdateCard: (id: string, title: string) => void;
}) {
  const config = workbenchConfig[page];
  const isScenes = page === "Scenes";
  const extraCards = Array.from({ length: additions }, (_, index) => ({
    id: `draft-${page}-${index + 1}`,
    title:
      page === "Assets"
        ? `Imported reference ${index + 1}`
        : `${config.action} draft ${index + 1}`,
    persisted: false,
  }));
  const displayCards = [...cards, ...extraCards];
  const filteredCards =
    page !== "Assets" || activeTab === "All"
      ? displayCards
      : displayCards.filter((card) =>
          activeTab === "Videos"
            ? card.title.toLowerCase().includes("video")
            : !card.title.toLowerCase().includes("video"),
        );

  return (
    <div
      className={cn(
        "relative min-h-[669px] px-6 py-6",
        !isScenes && activeTab !== "Overview" && "grid place-items-center",
      )}
    >
      {isScenes ? (
        activeTab === "Scene List" ? (
          <SceneList
            activeItemId={activeItemId}
            scenes={scenes}
            generatedStills={generatedStills}
          />
        ) : (
          <SceneCards
            activeItemId={activeItemId}
            scenes={scenes}
            generatedStills={generatedStills}
            onGenerateStill={onGenerateStill}
          />
        )
      ) : activeTab === "Overview" || page === "Assets" ? (
        <WorkbenchCardGrid
          cards={filteredCards}
          activeItemId={activeItemId}
          message={message}
          mutationPending={mutationPending}
          page={page}
          onDeleteCard={onDeleteCard}
          onUpdateCard={onUpdateCard}
        />
      ) : (
        <WorkbenchPrompt config={config} />
      )}
    </div>
  );
}

export function LockedStoryboard() {
  return (
    <div className="grid min-h-[900px] place-items-center px-10 py-16">
      <div className="max-w-[640px] rounded-2xl border border-[#deded8] bg-white p-10 text-center shadow-[0_12px_32px_rgb(42_42_37/0.1)]">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-[#f4f4f2]">
          <LockKeyhole className="size-6 text-[#777771]" />
        </div>
        <h2 className="text-2xl font-medium">Storyboard is locked</h2>
        <p className="mt-4 text-base leading-7 text-[#777771]">
          This module is reserved for generated boards and image-to-video
          planning. It stays visible so the production workflow remains clear.
        </p>
        <div className="debug-hatch mt-8 rounded-xl border border-dashed border-[#d2d2cc] p-4 text-sm text-[#6f6f68]">
          Unavailable module pattern retained from the Design item.
        </div>
      </div>
    </div>
  );
}

function SceneList({
  activeItemId,
  scenes,
  generatedStills,
}: {
  activeItemId: string;
  scenes: DerivedScene[];
  generatedStills: string[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#deded8] bg-[#fcfdfc] shadow-[0_8px_24px_rgb(42_42_37/0.08)]">
      {scenes.map((scene, index) => (
        <div
          key={scene.id}
          className={cn(
            "grid grid-cols-[44px_minmax(0,1fr)_88px_120px] items-center gap-3 border-b border-[#eeeeea] px-4 py-3 text-[13px] last:border-b-0",
            activeItemId === scene.id && "bg-[#f1f5f2]",
          )}
        >
          <span className="text-[#8b8b84]">#{index + 1}</span>
          <strong className="truncate font-medium">{scene.heading}</strong>
          <span className="text-[#777771]">
            {scene.characterIds.length} chars
          </span>
          <Badge variant="secondary">
            {generatedStills.includes(scene.id) ? "Still ready" : "1/8"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function SceneCards({
  activeItemId,
  scenes,
  generatedStills,
  onGenerateStill,
}: {
  activeItemId: string;
  scenes: DerivedScene[];
  generatedStills: string[];
  onGenerateStill: (sceneId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
      {scenes.map((scene, index) => (
        <div
          key={scene.id}
          className={cn(
            "rounded-xl border border-[#deded8] bg-white p-5 shadow-[0_8px_24px_rgb(42_42_37/0.08)]",
            activeItemId === scene.id && "border-[#b9c7bd] ring-2 ring-[#dfe8e2]",
          )}
        >
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="text-sm text-[#8b8b84]">#{index + 1}</div>
              <h3 className="mt-1 text-lg font-medium">
                {scene.locationName} - {scene.timeOfDay}
              </h3>
            </div>
            <Badge variant="secondary">
              {generatedStills.includes(scene.id) ? "Still ready" : "1/8"}
            </Badge>
          </div>
          <div className="mb-5 flex gap-4 text-sm text-[#777771]">
            <span className="inline-flex items-center gap-1">
              <User className="size-4" /> {scene.characterIds.length} chars
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-4" /> {scene.dialogueLineCount} lines
            </span>
          </div>
          <p className="mb-5 text-sm leading-6 text-[#777771]">
            {scene.heading} · {scene.blockCount} linked script blocks.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
              onClick={() => onGenerateStill(scene.id)}
            >
              {generatedStills.includes(scene.id) ? "Still Generated" : "Generate Still"}
            </Button>
            <Button variant="secondary" className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0">
              Edit
            </Button>
            <Button variant="secondary" className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium text-[#8a8f8b] shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0">
              Generate Video
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkbenchCardGrid({
  cards,
  activeItemId,
  message,
  mutationPending,
  page,
  onDeleteCard,
  onUpdateCard,
}: {
  cards: WorkbenchCard[];
  activeItemId: string;
  message: string;
  mutationPending: boolean;
  page: WorkbenchPageName;
  onDeleteCard: (id: string) => void;
  onUpdateCard: (id: string, title: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 max-[1200px]:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.id}
          className={cn(
            "min-h-[150px] rounded-xl border border-[#deded8] bg-[#fcfdfc] p-4 shadow-[0_8px_24px_rgb(42_42_37/0.07)]",
            activeItemId === card.id && "border-[#b9c7bd] ring-2 ring-[#dfe8e2]",
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="grid size-9 place-items-center rounded-lg bg-[#eef3ef] text-[#2e6248]">
              {page === "Characters" ? (
                <User className="size-5" />
              ) : page === "Props" ? (
                <Box className="size-5" />
              ) : page === "Locations" ? (
                <MapPin className="size-5" />
              ) : (
                <ImageIcon className="size-5" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary">
                {card.persisted ? "Persisted" : "Draft"}
              </Badge>
              {(page === "Props" || page === "Assets") && card.persisted ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={mutationPending}
                  aria-label={`Delete ${card.title}`}
                  onClick={() => onDeleteCard(card.id)}
                  className="rounded-full text-[#8d938f] hover:bg-[#f1f4f2] hover:text-[#b0473e] active:translate-y-0"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
          {card.persisted && (page === "Props" || page === "Assets") ? (
            <EditableCardTitle
              card={card}
              mutationPending={mutationPending}
              page={page}
              onUpdateCard={onUpdateCard}
            />
          ) : (
            <h3 className="text-[16px] font-medium leading-6">{card.title}</h3>
          )}
          <p className="mt-2 text-[13px] leading-5 text-[#777771]">
            {page === "Assets"
              ? "Linked to scene production and export history."
              : "Derived from screenplay structure and ready for production notes."}
          </p>
        </div>
      ))}
      <div className="rounded-xl border border-dashed border-[#cfd8d2] bg-[#f8faf8] p-4 text-[13px] leading-5 text-[#6f7772]">
        {message}
      </div>
    </div>
  );
}

function EditableCardTitle({
  card,
  mutationPending,
  page,
  onUpdateCard,
}: {
  card: WorkbenchCard;
  mutationPending: boolean;
  page: WorkbenchPageName;
  onUpdateCard: (id: string, title: string) => void;
}) {
  return (
    <>
      <label htmlFor={`${page.toLowerCase()}-title-${card.id}`} className="sr-only">
        {page === "Props" ? "Prop" : "Asset"} title
      </label>
      <input
        id={`${page.toLowerCase()}-title-${card.id}`}
        name={`${page.toLowerCase()}-title-${card.id}`}
        aria-label={`${page === "Props" ? "Prop" : "Asset"} title ${card.title}`}
        defaultValue={card.title}
        disabled={mutationPending}
        spellCheck={false}
        onBlur={(event) => {
          const nextTitle = event.target.value.trim();
          if (nextTitle && nextTitle !== card.title) {
            onUpdateCard(card.id, nextTitle);
          } else {
            event.target.value = card.title;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.currentTarget.value = card.title;
            event.currentTarget.blur();
          }
        }}
        className="block w-full border-0 bg-transparent p-0 text-[16px] font-medium leading-6 text-[#242421] outline-none focus:bg-[#f8faf9] disabled:opacity-60"
      />
    </>
  );
}

function WorkbenchPrompt({
  config,
}: {
  config: (typeof workbenchConfig)[WorkbenchPageName];
}) {
  return (
    <div className="mx-auto w-full max-w-[540px] overflow-hidden rounded-[24px] border border-[#deded8] bg-white">
      <div className="h-[206px] bg-[linear-gradient(135deg,#e8f0e8,#cfdde8_48%,#f4ead8)]">
        <div className="flex h-full items-center justify-center text-[#5f705f]">
          <ImageIcon className="size-16 opacity-50" />
        </div>
      </div>
      <div className="px-8 py-6 text-center">
        <h2 className="text-[20px] font-medium leading-[26.6667px]">
          {config.emptyTitle}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[474px] text-[12px] leading-[19.5px] text-[#777771]">
          {config.emptyCopy}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-4 text-[13px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0">
            Got it
          </Button>
          <Button className="h-8 rounded-full bg-[#2e6248] px-4 text-[13px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#28583f] active:translate-y-0">
            Write Script
          </Button>
        </div>
      </div>
    </div>
  );
}
