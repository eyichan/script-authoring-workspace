"use client";

import type { ComponentType } from "react";
import {
  Atom,
  Box,
  CalendarRange,
  ClipboardList,
  Film,
  Hourglass,
  ImageIcon,
  ListChecks,
  LockKeyhole,
  MapPin,
  MessageSquare,
  PenLine,
  ScrollText,
  Sparkles,
  Table2,
  Trash2,
  User,
  Users,
  Video,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AssetTask,
  Beat,
  DerivedCharacter,
  DerivedLocation,
  DerivedScene,
  Prop,
} from "@/lib/domain/types";
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

export const beatTabs = [
  { label: "Arrangement", icon: CalendarRange },
  { label: "Beats", icon: ListChecks },
  { label: "Outline", icon: ScrollText },
];

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
      { label: "Generate", icon: Sparkles },
      { label: "Tasks", icon: ClipboardList },
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
  activeTab,
  beats,
  message,
  mutationPending,
  outlineText,
  onDeleteBeat,
  onEditBeat,
  onUpdateOutline,
  onUpdateBeat,
}: {
  activeTab: string;
  beats: Beat[];
  message: string;
  mutationPending: boolean;
  outlineText: string;
  onDeleteBeat: (beatId: string) => void;
  onEditBeat: (beatId: string) => void;
  onUpdateOutline: (text: string) => void;
  onUpdateBeat: (beatId: string, title: string) => void;
}) {
  const selectedBeat = beats[0];

  return (
    <div className="relative min-h-[669px] px-6 py-6">
      {activeTab === "Arrangement" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#e4e7e4] pb-3">
            <div>
              <h2 className="text-[18px] font-medium">Arrangement</h2>
              <p className="mt-1 text-[13px] text-[#777771]">
                Timeline view for ordering story turns before script revisions.
              </p>
            </div>
            <Button
              variant="secondary"
              className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
            >
              Tidy
            </Button>
          </div>
          <div className="grid grid-cols-[72px_repeat(6,minmax(96px,1fr))] border-b border-[#e7e9e6] pb-2 text-[11px] uppercase tracking-normal text-[#8b8b84]">
            <span>Beat</span>
            <span>0m</span>
            <span>10m</span>
            <span>20m</span>
            <span>30m</span>
            <span>40m</span>
            <span>50m</span>
          </div>
          <div className="grid gap-3">
            {beats.map((beat, index) => (
              <div
                key={beat.id}
                className="grid grid-cols-[72px_minmax(0,1fr)_176px] items-center gap-3 rounded-xl border border-[#deded8] bg-white p-4 shadow-[0_8px_24px_rgb(42_42_37/0.06)]"
              >
                <span className="text-[13px] text-[#8b8b84]">#{index + 1}</span>
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-medium">{beat.title}</h3>
                  <p className="mt-1 truncate text-[13px] text-[#777771]">
                    {beat.description}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Badge variant="secondary">{beat.durationMinutes} min</Badge>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onEditBeat(beat.id)}
                    className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
                  >
                    Edit beat
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-dashed border-[#cfd8d2] bg-[#f8faf8] p-4 text-[13px] leading-5 text-[#6f7772]">
            {message}
          </div>
        </div>
      ) : activeTab === "Outline" ? (
        <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-4 max-[900px]:grid-cols-1">
          <div className="rounded-xl border border-[#deded8] bg-white p-4 shadow-[0_8px_24px_rgb(42_42_37/0.06)]">
            <h2 className="text-[18px] font-medium">Outline</h2>
            <p className="mt-2 text-[13px] leading-5 text-[#777771]">
              Project-level story summary. Persistence lands with the upcoming
              outline model.
            </p>
          </div>
          <OutlineEditor
            beats={beats}
            mutationPending={mutationPending}
            outlineText={outlineText}
            onUpdateOutline={onUpdateOutline}
          />
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-4 max-[1100px]:grid-cols-1">
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
            <h3 className="text-[16px] font-medium leading-6">Beat editor</h3>
            <p className="mt-2 text-[13px] leading-5 text-[#777771]">
              {selectedBeat
                ? `Selected: ${selectedBeat.title}`
                : "Create a beat to start outlining the script."}
            </p>
            {selectedBeat ? (
              <div className="mt-4 rounded-lg border border-[#e4e7e4] bg-[#f8faf8] p-3 text-[13px] leading-5 text-[#6f7772]">
                <strong className="block text-[#242421]">Description</strong>
                {selectedBeat.description}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onEditBeat(selectedBeat.id)}
                  className="mt-3 h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
                >
                  Edit Beat
                </Button>
              </div>
            ) : null}
            <div className="mt-4 rounded-lg border border-dashed border-[#cfd8d2] bg-[#f8faf8] p-3 text-[13px] leading-5 text-[#6f7772]">
              {message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OutlineEditor({
  beats,
  mutationPending,
  outlineText,
  onUpdateOutline,
}: {
  beats: Beat[];
  mutationPending: boolean;
  outlineText: string;
  onUpdateOutline: (text: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <textarea
        aria-label="Script outline"
        defaultValue={
          outlineText ||
          beats
            .map((beat, index) => `${index + 1}. ${beat.title} - ${beat.description}`)
            .join("\n")
        }
        className="min-h-[420px] resize-none rounded-xl border border-[#deded8] bg-[#fcfdfc] p-5 text-[14px] leading-7 text-[#242421] outline-none focus:ring-2 focus:ring-[#dfe8e2]"
      />
      <Button
        type="button"
        disabled={mutationPending}
        onClick={(event) => {
          const textarea = event.currentTarget
            .closest("div")
            ?.querySelector<HTMLTextAreaElement>("textarea");
          onUpdateOutline(textarea?.value ?? "");
        }}
        className="h-8 w-fit rounded-full bg-[#2e6248] px-4 text-[13px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#28583f] active:translate-y-0"
      >
        {mutationPending ? "Saving" : "Save Outline"}
      </Button>
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
  assetTasks,
  characters,
  locations,
  props,
  scenes,
  mutationPending,
  onDeleteCard,
  onEditCard,
  onEditScene,
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
  assetTasks: AssetTask[];
  characters: DerivedCharacter[];
  locations: DerivedLocation[];
  props: Prop[];
  scenes: DerivedScene[];
  mutationPending: boolean;
  onDeleteCard: (id: string) => void;
  onEditCard: (id: string) => void;
  onEditScene: (id: string) => void;
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

  return (
    <div className="relative min-h-[669px] px-6 py-6">
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
            onEditScene={onEditScene}
            onGenerateStill={onGenerateStill}
          />
        )
      ) : page === "Characters" && activeTab === "Relationships" ? (
        <CharacterRelationships characters={characters} scenes={scenes} />
      ) : page === "Characters" && activeTab === "Casting" ? (
        <CharacterCastingTable characters={characters} />
      ) : page === "Props" && activeTab === "List" ? (
        <PropList props={props} mutationPending={mutationPending} onDeleteProp={onDeleteCard} />
      ) : page === "Locations" && activeTab === "Relationships" ? (
        <LocationRelationships locations={locations} scenes={scenes} />
      ) : page === "Locations" && activeTab === "Scout Sheet" ? (
        <ScoutSheet locations={locations} />
      ) : page === "Assets" && activeTab === "Generate" ? (
        <AssetGenerateGallery />
      ) : page === "Assets" && activeTab === "Tasks" ? (
        <AssetTaskTable
          assetTasks={assetTasks}
          mutationPending={mutationPending}
          onDeleteAsset={onDeleteCard}
          onUpdateAsset={onUpdateCard}
        />
      ) : activeTab === "Overview" ? (
        <WorkbenchCardGrid
          cards={displayCards}
          activeItemId={activeItemId}
          message={message}
          mutationPending={mutationPending}
          page={page}
          onDeleteCard={onDeleteCard}
          onEditCard={onEditCard}
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
      <div className="grid grid-cols-[72px_minmax(0,1.4fr)_minmax(120px,0.8fr)_88px_88px] items-center gap-3 border-b border-[#eeeeea] bg-[#f8faf8] px-4 py-3 text-[11px] font-medium uppercase tracking-normal text-[#8b8b84]">
        <span>Scene</span>
        <span>Scene Title</span>
        <span>Characters</span>
        <span>Count</span>
        <span>Lines</span>
      </div>
      {scenes.map((scene, index) => (
        <div
          key={scene.id}
          className={cn(
            "grid grid-cols-[72px_minmax(0,1.4fr)_minmax(120px,0.8fr)_88px_88px] items-center gap-3 border-b border-[#eeeeea] px-4 py-3 text-[13px] last:border-b-0",
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
          <span className="text-[#777771]">{scene.dialogueLineCount}</span>
        </div>
      ))}
    </div>
  );
}

function CharacterRelationships({
  characters,
  scenes,
}: {
  characters: DerivedCharacter[];
  scenes: DerivedScene[];
}) {
  return (
    <div className="grid gap-3">
      <SurfaceTitle
        title="Relationships"
        copy="Characters are grouped by shared scene appearances from the current script."
      />
      {characters.map((character) => {
        const related = characters.filter(
          (candidate) =>
            candidate.id !== character.id &&
            candidate.sceneIds.some((sceneId) => character.sceneIds.includes(sceneId)),
        );
        const sharedScenes = scenes.filter((scene) =>
          character.sceneIds.includes(scene.id),
        );

        return (
          <div
            key={character.id}
            className="grid grid-cols-[minmax(140px,0.8fr)_minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-4 rounded-xl border border-[#deded8] bg-white p-4 shadow-[0_8px_24px_rgb(42_42_37/0.06)]"
          >
            <strong className="truncate text-[15px]">{character.displayName}</strong>
            <span className="truncate text-[13px] text-[#777771]">
              {related.length
                ? related.map((item) => item.displayName).join(", ")
                : "No shared scenes yet"}
            </span>
            <span className="truncate text-[13px] text-[#777771]">
              {sharedScenes.length
                ? sharedScenes.map((scene) => scene.locationName).join(", ")
                : "No scene links"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CharacterCastingTable({
  characters,
}: {
  characters: DerivedCharacter[];
}) {
  return (
    <EntityTable
      columns={["Character", "Scenes", "Lines", "Casting Status", "Notes"]}
      rows={characters.map((character) => [
        character.displayName,
        String(character.sceneIds.length),
        String(character.dialogueLineCount),
        "Uncast",
        "Profile pending",
      ])}
    />
  );
}

function PropList({
  props,
  mutationPending,
  onDeleteProp,
}: {
  props: Prop[];
  mutationPending: boolean;
  onDeleteProp: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#deded8] bg-[#fcfdfc] shadow-[0_8px_24px_rgb(42_42_37/0.08)]">
      <div className="grid grid-cols-[minmax(140px,1fr)_120px_minmax(0,1.2fr)_minmax(0,1fr)_44px] items-center gap-3 border-b border-[#eeeeea] bg-[#f8faf8] px-4 py-3 text-[11px] font-medium uppercase tracking-normal text-[#8b8b84]">
        <span>Name</span>
        <span>Category</span>
        <span>Description</span>
        <span>Image Note</span>
        <span />
      </div>
      {props.map((prop) => (
        <div
          key={prop.id}
          className="grid grid-cols-[minmax(140px,1fr)_120px_minmax(0,1.2fr)_minmax(0,1fr)_44px] items-center gap-3 border-b border-[#eeeeea] px-4 py-3 text-[13px] last:border-b-0"
        >
          <strong className="truncate font-medium">{prop.name}</strong>
          <Badge variant="secondary">{prop.category}</Badge>
          <span className="truncate text-[#777771]">{prop.description}</span>
          <span className="truncate text-[#777771]">{prop.imageNote}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={mutationPending}
            aria-label={`Delete ${prop.name}`}
            onClick={() => onDeleteProp(prop.id)}
            className="size-8 rounded-full text-[#8d938f] hover:bg-[#f1f4f2] hover:text-[#b0473e] active:translate-y-0"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function LocationRelationships({
  locations,
  scenes,
}: {
  locations: DerivedLocation[];
  scenes: DerivedScene[];
}) {
  return (
    <div className="grid gap-3">
      <SurfaceTitle
        title="Relationships"
        copy="Location links come from scene headings and character appearances."
      />
      {locations.map((location) => {
        const locationScenes = scenes.filter((scene) =>
          location.sceneIds.includes(scene.id),
        );

        return (
          <div
            key={location.id}
            className="grid grid-cols-[minmax(150px,0.8fr)_minmax(0,1.2fr)_120px] items-center gap-4 rounded-xl border border-[#deded8] bg-white p-4 shadow-[0_8px_24px_rgb(42_42_37/0.06)]"
          >
            <strong className="truncate text-[15px]">{location.displayName}</strong>
            <span className="truncate text-[13px] text-[#777771]">
              {locationScenes.map((scene) => scene.heading).join(", ")}
            </span>
            <Badge variant="secondary">{location.characterIds.length} chars</Badge>
          </div>
        );
      })}
    </div>
  );
}

function ScoutSheet({
  locations,
}: {
  locations: DerivedLocation[];
}) {
  return (
    <EntityTable
      columns={[
        "Name",
        "Status",
        "Address",
        "Owner",
        "Daily Rental",
        "Availability",
        "Scenes",
      ]}
      rows={locations.map((location) => [
        location.displayName,
        "Pending",
        "TBD",
        "TBD",
        "TBD",
        "TBD",
        String(location.sceneIds.length),
      ])}
    />
  );
}

function AssetGenerateGallery() {
  const templates = [
    ["Movie Poster", "One-sheet artwork for pitch and share pages.", ImageIcon],
    ["Casting Poster", "Character-first portrait composition.", Users],
    ["Concept Trailer", "Short-form teaser plan from selected scenes.", Video],
    ["Scene Dramatization", "Scene-linked video prompt package.", Film],
    ["Director Roundtable", "Audio/video discussion asset.", MessageSquare],
    ["Script Table Read", "Dialogue read-through generation task.", ScrollText],
  ] as const;

  return (
    <div className="grid gap-4">
      <SurfaceTitle
        title="Creative Studio"
        copy="Generate visual and video tasks from script structure and production entities."
      />
      <div className="grid grid-cols-3 gap-4 max-[1200px]:grid-cols-2 max-[800px]:grid-cols-1">
        {templates.map(([title, copy, Icon]) => (
          <div
            key={title}
            className="rounded-xl border border-[#deded8] bg-white p-4 shadow-[0_8px_24px_rgb(42_42_37/0.06)]"
          >
            <div className="mb-4 grid size-10 place-items-center rounded-lg bg-[#eef3ef] text-[#2e6248]">
              <Icon className="size-5" />
            </div>
            <h3 className="text-[16px] font-medium">{title}</h3>
            <p className="mt-2 min-h-10 text-[13px] leading-5 text-[#777771]">
              {copy}
            </p>
            <Button
              variant="secondary"
              className="mt-4 h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
            >
              <Wand2 className="size-[14px]" data-icon="inline-start" />
              Generate
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetTaskTable({
  assetTasks,
  mutationPending,
  onDeleteAsset,
  onUpdateAsset,
}: {
  assetTasks: AssetTask[];
  mutationPending: boolean;
  onDeleteAsset: (id: string) => void;
  onUpdateAsset: (id: string, title: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#deded8] bg-[#fcfdfc] shadow-[0_8px_24px_rgb(42_42_37/0.08)]">
      <div className="grid grid-cols-[minmax(180px,1fr)_160px_120px_160px_44px] items-center gap-3 border-b border-[#eeeeea] bg-[#f8faf8] px-4 py-3 text-[11px] font-medium uppercase tracking-normal text-[#8b8b84]">
        <span>Task</span>
        <span>Template</span>
        <span>Task Status</span>
        <span>Created</span>
        <span />
      </div>
      {assetTasks.map((task) => (
        <div
          key={task.id}
          className="grid grid-cols-[minmax(180px,1fr)_160px_120px_160px_44px] items-center gap-3 border-b border-[#eeeeea] px-4 py-3 text-[13px] last:border-b-0"
        >
          <EditableTaskTitle
            mutationPending={mutationPending}
            task={task}
            onUpdateAsset={onUpdateAsset}
          />
          <span className="truncate text-[#777771]">{formatAssetKind(task.kind)}</span>
          <Badge variant="secondary">{task.status}</Badge>
          <span className="truncate text-[#777771]">
            {new Date(task.createdAt).toLocaleDateString("en-US")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={mutationPending}
            aria-label={`Delete ${task.title}`}
            onClick={() => onDeleteAsset(task.id)}
            className="size-8 rounded-full text-[#8d938f] hover:bg-[#f1f4f2] hover:text-[#b0473e] active:translate-y-0"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function EditableTaskTitle({
  mutationPending,
  task,
  onUpdateAsset,
}: {
  mutationPending: boolean;
  task: AssetTask;
  onUpdateAsset: (id: string, title: string) => void;
}) {
  return (
    <>
      <label htmlFor={`asset-task-title-${task.id}`} className="sr-only">
        Asset title {task.title}
      </label>
      <input
        id={`asset-task-title-${task.id}`}
        name={`asset-task-title-${task.id}`}
        aria-label={`Asset title ${task.title}`}
        defaultValue={task.title}
        disabled={mutationPending}
        spellCheck={false}
        onBlur={(event) => {
          const nextTitle = event.target.value.trim();
          if (nextTitle && nextTitle !== task.title) {
            onUpdateAsset(task.id, nextTitle);
          } else {
            event.target.value = task.title;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.currentTarget.value = task.title;
            event.currentTarget.blur();
          }
        }}
        className="block w-full truncate border-0 bg-transparent p-0 font-medium text-[#242421] outline-none focus:bg-[#f8faf9] disabled:opacity-60"
      />
    </>
  );
}

function SurfaceTitle({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="border-b border-[#e4e7e4] pb-3">
      <h2 className="text-[18px] font-medium">{title}</h2>
      <p className="mt-1 text-[13px] leading-5 text-[#777771]">{copy}</p>
    </div>
  );
}

function EntityTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#deded8] bg-[#fcfdfc] shadow-[0_8px_24px_rgb(42_42_37/0.08)]">
      <div
        className="grid items-center gap-3 border-b border-[#eeeeea] bg-[#f8faf8] px-4 py-3 text-[11px] font-medium uppercase tracking-normal text-[#8b8b84]"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.join("-")}
          className="grid items-center gap-3 border-b border-[#eeeeea] px-4 py-3 text-[13px] last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {row.map((cell, index) => (
            <span
              key={`${cell}-${index}`}
              className={cn(index === 0 ? "font-medium text-[#242421]" : "truncate text-[#777771]")}
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function formatAssetKind(kind: AssetTask["kind"]) {
  return kind
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SceneCards({
  activeItemId,
  scenes,
  generatedStills,
  onEditScene,
  onGenerateStill,
}: {
  activeItemId: string;
  scenes: DerivedScene[];
  generatedStills: string[];
  onEditScene: (sceneId: string) => void;
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
            <Button
              variant="secondary"
              onClick={() => onEditScene(scene.id)}
              className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
            >
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
  onEditCard,
  onUpdateCard,
}: {
  cards: WorkbenchCard[];
  activeItemId: string;
  message: string;
  mutationPending: boolean;
  page: WorkbenchPageName;
  onDeleteCard: (id: string) => void;
  onEditCard: (id: string) => void;
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
          {page !== "Assets" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onEditCard(card.id)}
              className="mt-4 h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
            >
              Edit
            </Button>
          ) : null}
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
