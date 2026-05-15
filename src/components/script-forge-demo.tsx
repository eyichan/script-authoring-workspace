"use client";

import { useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Atom,
  BadgeCheck,
  BarChart3,
  Box,
  ChevronDown,
  Clapperboard,
  Columns2,
  FileText,
  Film,
  Home,
  Hourglass,
  ImageIcon,
  LockKeyhole,
  LayoutGrid,
  MapPin,
  MoreHorizontal,
  MessageSquare,
  PenLine,
  Play,
  Plus,
  Table2,
  Quote,
  RefreshCcw,
  ScrollText,
  Share2,
  Subtitles,
  User,
  Users,
  Video,
  WandSparkles,
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ExportFormat = "fdx" | "fountain" | "pdf";
type EditorTab = "script" | "cover";
type InspectorTab = "info" | "collab";
type PaginationMode = "minimal" | "studio" | "fast";
type PageName =
  | "Script"
  | "Beats"
  | "Characters"
  | "Props"
  | "Locations"
  | "Storyboard"
  | "Scenes"
  | "Assets";
type WorkbenchPageName = Exclude<PageName, "Script" | "Beats" | "Storyboard">;

const navItems = [
  { label: "Script", icon: FileText },
  { label: "Beats", icon: Hourglass },
  { label: "Characters", icon: User },
  { label: "Props", icon: Box },
  { label: "Locations", icon: MapPin },
  { label: "Storyboard", icon: Clapperboard },
  { label: "Scenes", icon: LayoutGrid },
  { label: "Assets", icon: ImageIcon },
] satisfies Array<{ label: PageName; icon: ComponentType<{ className?: string }> }>;

const scenes = [
  { id: 1, title: "INT. MOTEL ROOM", time: "NIGHT" },
  { id: 2, title: "EXT. HIGHWAY DINER", time: "DAWN" },
  { id: 3, title: "INT. INTERROGATION ROOM", time: "DAY" },
];

const tools = [
  { label: "Scene", icon: Film },
  { label: "Action", icon: Zap },
  { label: "Character", icon: User },
  { label: "Paren", icon: Quote },
  { label: "Dialogue", icon: MessageSquare },
  { label: "Transition", icon: RefreshCcw },
  { label: "Comment", icon: MessageSquare },
  { label: "Subtitle", icon: Subtitles },
] as const;
type ToolLabel = (typeof tools)[number]["label"];

const screenplay = [
  { type: "transition", text: "FADE IN:" },
  { type: "scene", text: "EXT. HIGHWAY DINER - DAWN" },
  {
    type: "action",
    text:
      "A roadside diner sits alone under a violet sky. Eighteen-wheelers idle in the gravel lot. The OPEN sign flickers like it has been losing the same argument all night.",
  },
  {
    type: "action",
    text:
      "NORA VALE, 34, trench coat over a hospital gown, crosses the lot barefoot. In one hand: a motel key. In the other: a bloodied cassette tape.",
  },
  { type: "character", text: "NORA" },
  { type: "paren", text: "(to herself)" },
  { type: "dialogue", text: "If he remembers the song, he remembers the room." },
  {
    type: "action",
    text:
      "Inside the diner, DEPUTY MARSH, 52, watches her through the rain-streaked glass. He lowers his coffee without taking a sip.",
  },
  { type: "character", text: "MARSH" },
  { type: "dialogue", text: "That is not the woman from the bulletin." },
  { type: "character", text: "WAITRESS" },
  { type: "dialogue", text: "Then why are you shaking?" },
  { type: "transition", text: "CUT TO:" },
];

const exportLabels: Record<ExportFormat, string> = {
  fdx: "Final Draft",
  fountain: "Fountain",
  pdf: "PDF",
};

const workbenchConfig = {
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
    cards: ["Nora Vale", "Deputy Marsh", "Waitress"],
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
    cards: ["Bloodied cassette tape", "Motel key", "Coffee cup", "Evidence bag"],
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
    cards: ["Highway Diner", "Motel Room", "Interrogation Room"],
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
    cards: ["EXT. HIGHWAY DINER - DAWN", "INT. MOTEL ROOM - NIGHT", "INT. INTERROGATION ROOM - DAY"],
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
    cards: ["Diner exterior still", "Nora reference", "Marsh reference", "Cassette prop", "Scene board export"],
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
    cards: string[];
  }
>;

const initialWorkbenchTabs: Record<WorkbenchPageName, string> = {
  Characters: "Overview",
  Props: "Overview",
  Locations: "Overview",
  Scenes: "Cards",
  Assets: "All",
};

const initialAdditions: Record<WorkbenchPageName, number> = {
  Characters: 0,
  Props: 0,
  Locations: 0,
  Scenes: 0,
  Assets: 0,
};

function isWorkbenchPage(page: PageName): page is WorkbenchPageName {
  return page !== "Script" && page !== "Beats" && page !== "Storyboard";
}

export function ScriptForgeDemo() {
  const [activePage, setActivePage] = useState<PageName>("Script");
  const [activeScene, setActiveScene] = useState(2);
  const [editorTab, setEditorTab] = useState<EditorTab>("script");
  const [activeTool, setActiveTool] = useState<ToolLabel>("Action");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("info");
  const [paginationMode, setPaginationMode] = useState<PaginationMode>("minimal");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("fdx");
  const [breakdownReady, setBreakdownReady] = useState(false);
  const [shotListReady, setShotListReady] = useState(false);
  const [lastExport, setLastExport] = useState("No export yet");
  const [productionMessage, setProductionMessage] = useState(
    "Production actions are simulated locally.",
  );
  const [workbenchTabs, setWorkbenchTabs] = useState(initialWorkbenchTabs);
  const [mockAdditions, setMockAdditions] = useState(initialAdditions);
  const [workbenchMessage, setWorkbenchMessage] = useState(
    "Select a page action to create a local mock state.",
  );
  const [generatedStills, setGeneratedStills] = useState<number[]>([]);
  const editorMode = activePage === "Script" || activePage === "Beats";
  const workbenchCount =
    isWorkbenchPage(activePage)
      ? workbenchConfig[activePage].count + mockAdditions[activePage]
      : 0;
  const sidebarSectionTitle = activePage === "Script" ? "Scenes" : activePage;

  const stats = useMemo(
    () => [
      { label: "Scenes", value: 3 },
      { label: "Characters", value: 5 },
      { label: "Locations", value: 4 },
      { label: "Beats", value: 9 },
      { label: "Shots", value: shotListReady ? 24 : 0 },
      { label: "Props", value: breakdownReady ? 11 : 0 },
      { label: "Exports", value: exportLabels[exportFormat] },
    ],
    [breakdownReady, exportFormat, shotListReady],
  );

  const handleWorkbenchAction = () => {
    if (!isWorkbenchPage(activePage)) return;

    if (activePage === "Scenes") {
      setWorkbenchMessage("Scene board tidied: cards sorted by screenplay order.");
      return;
    }

    setMockAdditions((current) => ({
      ...current,
      [activePage]: current[activePage] + 1,
    }));

    if (activePage === "Assets") {
      setWorkbenchMessage("Imported a local reference asset into the mock library.");
      return;
    }

    setWorkbenchMessage(`${workbenchConfig[activePage].action} created as a local draft.`);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f4f6f5] text-[#242421]">
      <header className="flex h-12 items-center justify-between px-3">
        <div className="flex items-center gap-4">
            <IconChrome label="Home" icon={Home} />
            <IconChrome label="Outline" icon={Columns2} />
        </div>
        <Button
          variant="secondary"
          className="h-8 gap-1.5 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium text-[#171a19] shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] transition-[background-color,box-shadow,color,border-color] duration-150 hover:bg-[#f8faf9] active:translate-y-0"
        >
          <Share2 className="size-[14px]" data-icon="inline-start" />
          Invite
        </Button>
      </header>

      <div className="flex h-[calc(100%-48px)] min-h-0 gap-2 px-2 pb-2 max-[900px]:overflow-auto">
        <aside className="flex min-h-0 w-[230px] shrink-0 flex-col pb-0 pt-4 max-[900px]:hidden">
          <Button
            variant="secondary"
            className="ml-4 h-[30px] w-[112px] justify-between rounded-lg bg-[#e4e8e6] px-2.5 text-[13px] font-normal text-[#171a19] shadow-none transition-colors duration-300 hover:bg-[#dde2df] active:translate-y-0 max-[1180px]:hidden"
          >
            sample
            <ChevronDown data-icon="inline-end" />
          </Button>

          <nav className="mt-4 flex flex-col gap-1 pl-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setActivePage(item.label);
                  if (item.label !== "Script") setEditorTab("script");
                }}
                className={cn(
                  "inline-flex h-[30px] w-[214px] shrink-0 items-center justify-start gap-3 rounded-lg px-2.5 text-[13px] font-normal text-[#171a19] transition-[background-color,color] duration-300 hover:bg-[#e4e8e6] max-[1180px]:w-11 max-[1180px]:justify-center max-[1180px]:px-0",
                  activePage === item.label && "bg-[#dfe4e1] hover:bg-[#dfe4e1]",
                )}
              >
                <item.icon className="size-[17px]" data-icon="inline-start" />
                <span className="max-[1180px]:hidden">{item.label}</span>
              </button>
            ))}
            <button
              type="button"
              disabled
              className="debug-hatch inline-flex h-[30px] w-[214px] shrink-0 items-center justify-start gap-3 rounded-none border border-dashed border-[#c9c9c2] px-2.5 text-[13px] font-normal opacity-100 disabled:cursor-default max-[1180px]:w-11 max-[1180px]:justify-center max-[1180px]:px-0"
            >
              <PenLine className="size-[17px]" data-icon="inline-start" />
              <span className="max-[1180px]:hidden">Design</span>
            </button>
          </nav>

          <section className="mt-5 pl-4 max-[1180px]:hidden">
            <h2 className="mb-4 text-[16px] font-normal">{sidebarSectionTitle}</h2>
            <div className="flex flex-col gap-2">
              {(activePage === "Beats"
                ? [{ id: 1, title: "No beats yet", time: "PLAN" }]
                : activePage === "Characters"
                  ? [{ id: 1, title: "NORA VALE", time: "LEAD" }, { id: 2, title: "DEPUTY MARSH", time: "SUPPORT" }]
                  : activePage === "Props"
                    ? [{ id: 1, title: "CASSETTE TAPE", time: "HERO" }, { id: 2, title: "MOTEL KEY", time: "PROP" }]
                    : activePage === "Locations"
                      ? [{ id: 1, title: "HIGHWAY DINER", time: "DAWN" }, { id: 2, title: "MOTEL ROOM", time: "NIGHT" }]
                      : activePage === "Assets"
                        ? [{ id: 1, title: "DINER STILL", time: "IMG" }, { id: 2, title: "NORA REF", time: "IMG" }]
                        : scenes
              ).map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => setActiveScene(scene.id)}
                  className={cn(
                    "flex h-[42px] w-[214px] items-center justify-between rounded-xl border border-[#e4e8e6] bg-[#fcfdfc] px-2.5 text-left text-[13px] font-normal text-[#55554f] shadow-[0_2px_4px_rgb(0_0_0/0.05),0_1px_2px_-1px_rgb(0_0_0/0.05)] transition-[background-color,border-color,box-shadow,color] duration-150 hover:bg-[#f8faf9]",
                    activeScene === scene.id &&
                      "border-[#dce2de] text-[#252522] shadow-[0_2px_4px_rgb(0_0_0/0.05),0_1px_2px_-1px_rgb(0_0_0/0.05)]",
                  )}
                >
                  <span className="truncate">
                    {scene.id}. {scene.title}
                  </span>
                  <span className="shrink-0 pl-2 text-[#777771]">
                    - {scene.time}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="mx-2 mt-auto rounded-lg border border-[#e5e5df] bg-white p-2 shadow-[0_4px_16px_rgb(32_32_28/0.08)] max-[1180px]:grid max-[1180px]:place-items-center">
            <div className="grid grid-cols-[44px_minmax(0,1fr)_12px] items-center gap-1.5 max-[1180px]:block">
              <Avatar className="size-11 bg-[radial-gradient(circle_at_30%_30%,#eef1bd,#d9e8df_48%,#f2f2ef)]">
                <AvatarFallback className="bg-transparent text-xs font-bold text-[#31543c]">
                  SF
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 max-[1180px]:hidden">
                <div className="truncate text-sm font-medium">sonboy</div>
                <div className="truncate text-xs text-[#7d7d78]">Junior</div>
              </div>
              <ChevronDown className="size-3 max-[1180px]:hidden" />
            </div>
          </div>
          <Button className="mx-2 mt-2 h-7 rounded-full bg-[#32784d] text-[12px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#286640] active:translate-y-0 max-[1180px]:hidden">
            Upgrade
          </Button>
        </aside>

        <div className="flex min-w-0 flex-1 gap-2">
        <main
          className={cn(
            "grid min-h-0 min-w-0 flex-1 grid-rows-[48px_1fr] overflow-hidden rounded-[24px] border border-[#ddddda] bg-[#fcfdfc] shadow-sm max-[900px]:h-auto max-[900px]:grid-rows-[auto_1fr]",
          )}
        >
          <header className="relative flex items-center justify-center border-b border-[#ebebe7] px-4 max-[900px]:min-h-[96px] max-[900px]:flex-col max-[900px]:gap-2 max-[900px]:py-3">
            <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[16px] font-normal max-[900px]:static max-[900px]:translate-y-0">
              {editorMode ? activePage : activePage === "Storyboard" ? "Storyboard" : workbenchConfig[activePage].title}
              {!editorMode && activePage !== "Storyboard" ? (
                <span className="rounded-md bg-[#f3f3f0] px-2 py-1 text-[13px] font-normal">
                  {workbenchCount}
                </span>
              ) : null}
            </div>
            {editorMode ? (
              <Tabs
                value={editorTab}
                onValueChange={(value) => setEditorTab(value as EditorTab)}
                className="items-center"
              >
                <TabsList className="h-9 rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]">
                  <TabsTrigger value="script" className="h-7 min-w-20 rounded-lg border-0 bg-transparent text-[12px] font-medium text-[#6b7370] opacity-60 shadow-none transition-[background-color,box-shadow,color,opacity] duration-200 data-active:bg-[#fcfdfc] data-active:text-[#171a19] data-active:opacity-100 data-active:!shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                    <ScrollText className="size-[15px]" data-icon="inline-start" />
                    Script
                  </TabsTrigger>
                  <TabsTrigger value="cover" className="h-7 min-w-20 rounded-lg border-0 bg-transparent text-[12px] font-medium text-[#6b7370] opacity-60 shadow-none transition-[background-color,box-shadow,color,opacity] duration-200 data-active:bg-[#fcfdfc] data-active:text-[#171a19] data-active:opacity-100 data-active:!shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                    <ImageIcon className="size-[15px]" data-icon="inline-start" />
                    Cover
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : activePage === "Storyboard" ? (
              <Badge variant="secondary" className="justify-self-center">
                Master feature
              </Badge>
            ) : (
              <WorkbenchTabs
                tabs={workbenchConfig[activePage].tabs}
                activeTab={workbenchTabs[activePage]}
                onChange={(tab) =>
                  setWorkbenchTabs((current) => ({
                    ...current,
                    [activePage]: tab,
                  }))
                }
              />
            )}
            {editorMode ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 max-[900px]:hidden">
                <IconChrome label="Statistics" icon={BarChart3} />
              </div>
            ) : activePage !== "Storyboard" ? (
              <Button
                className="absolute right-4 top-1/2 h-7 -translate-y-1/2 rounded-full bg-[#2e6248] px-3 text-[12px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#28583f] active:translate-y-0 max-[900px]:static max-[900px]:translate-y-0"
                onClick={handleWorkbenchAction}
              >
                {workbenchConfig[activePage].action === "Tidy" ? (
                  <MoreHorizontal className="size-[14px]" data-icon="inline-start" />
                ) : (
                  <Plus className="size-[14px]" data-icon="inline-start" />
                )}
                {workbenchConfig[activePage].action}
              </Button>
            ) : null}
          </header>

          <ScrollArea
            className={cn(
              "min-h-0",
              editorMode
                ? "bg-[radial-gradient(circle_at_50%_12%,#fbfbfa_0,#fbfbfa_28%,#f7f7f5_58%,#f4f4f2_100%)]"
                : "bg-[radial-gradient(rgb(188_194_187/0.38)_1px,transparent_1px)] [background-size:30px_30px]",
            )}
          >
            {activePage === "Storyboard" ? (
              <LockedStoryboard />
            ) : !editorMode ? (
              <WorkbenchPage
                page={activePage}
                activeTab={workbenchTabs[activePage]}
                additions={mockAdditions[activePage]}
                message={workbenchMessage}
                generatedStills={generatedStills}
                onGenerateStill={(sceneId) =>
                  setGeneratedStills((current) =>
                    current.includes(sceneId)
                      ? current
                      : [...current, sceneId],
                  )
                }
              />
            ) : editorTab === "cover" ? (
              <CoverPreview />
            ) : (
            <div className="relative min-h-[1180px] px-4 pb-20 pt-8 max-[900px]:px-3">
              <div className="sticky top-8 z-10 mx-auto mb-[-53px] flex w-[520px] max-w-full items-center gap-0 rounded-full border border-[#deded9] bg-[#fafaf8]/92 px-3 py-1 shadow-[0_10px_28px_rgb(30_30_28/0.1)] backdrop-blur-xl max-[900px]:top-2 max-[900px]:w-[calc(100vw-44px)] max-[900px]:max-w-[calc(100vw-44px)] max-[900px]:overflow-x-auto max-[900px]:rounded-2xl">
                {tools.map((tool) => (
                  <Tooltip key={tool.label}>
                    <TooltipTrigger
                      type="button"
                      onClick={() => setActiveTool(tool.label)}
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
                <div className="pointer-events-none sticky top-[92px] z-10 mx-auto mt-[57px] w-[min(816px,100%)] text-right text-[11px] text-[#8b938f]">
                  Current block: {activeTool}
                </div>

              <article className="script-paper mx-auto mt-[-20px] min-h-[1210px] w-[min(816px,100%)] overflow-hidden">
                <div className="mx-auto max-w-[576px] px-0 pb-36 pt-[104px] font-mono text-[16px] leading-[1.8] max-[900px]:max-w-[86%] max-[900px]:pt-20 max-[900px]:text-[13px]">
                  {screenplay.map((block, index) => (
                    <p
                      key={`${block.type}-${index}`}
                      className={cn(
                        "mb-[15px] whitespace-pre-wrap",
                        block.type === "scene" && "mt-1 uppercase",
                        block.type === "character" &&
                          "mb-1 mt-5 text-center uppercase",
                        block.type === "paren" &&
                          "m-0 text-center italic text-[#74746f]",
                        block.type === "dialogue" &&
                          "mx-auto max-w-[470px]",
                        block.type === "transition" && "mb-5",
                      )}
                    >
                      {block.text}
                    </p>
                  ))}
                </div>
              </article>
            </div>
            )}
          </ScrollArea>
        </main>

        {editorMode ? (
        <aside className="min-h-0 w-[260px] shrink-0 max-[900px]:hidden">
          <section className="h-full min-h-0 overflow-hidden rounded-[24px] border border-[#ddddda] bg-[#fcfdfc] shadow-sm">
            <div className="flex h-12 items-center border-b border-[#ebebe7] px-[18px] text-[16px] font-normal">
              Writing
            </div>
            <ScrollArea className="h-[calc(100%-48px)]">
              <div className="p-3">
                <Tabs
                  value={inspectorTab}
                  onValueChange={(value) => setInspectorTab(value as InspectorTab)}
                >
                  <TabsList className="grid h-9 w-full grid-cols-2 rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]">
                    <TabsTrigger value="info" className="h-7 rounded-lg border-0 bg-transparent text-[12px] font-medium text-[#6b7370] opacity-60 shadow-none transition-[background-color,box-shadow,color,opacity] duration-200 data-active:bg-[#fcfdfc] data-active:text-[#171a19] data-active:opacity-100 data-active:!shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">Info</TabsTrigger>
                    <TabsTrigger value="collab" className="h-7 rounded-lg border-0 bg-transparent text-[12px] font-medium text-[#6b7370] opacity-60 shadow-none transition-[background-color,box-shadow,color,opacity] duration-200 data-active:bg-[#fcfdfc] data-active:text-[#171a19] data-active:opacity-100 data-active:!shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">Collaboration</TabsTrigger>
                  </TabsList>
                </Tabs>

                {inspectorTab === "info" ? (
                <>
                <InspectorGroup label="Pagination">
                  <ToggleGroup
                    value={[paginationMode]}
                    onValueChange={(value) => {
                      if (value[0]) setPaginationMode(value[0] as PaginationMode);
                    }}
                    className="grid h-10 w-full grid-cols-[1.35fr_0.8fr_0.8fr] rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]"
                  >
                    <ToggleGroupItem value="minimal" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      <FileText data-icon="inline-start" />
                      Minimal
                    </ToggleGroupItem>
                    <ToggleGroupItem value="studio" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      <ScrollText data-icon="inline-start" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="fast" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      <Zap data-icon="inline-start" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <p className="mt-2 text-[12px] leading-5 text-[#8a928e]">
                    {paginationMode === "minimal"
                      ? "Minimal pagination keeps the page clean while writing."
                      : paginationMode === "studio"
                        ? "Studio pagination exposes page breaks for production review."
                        : "Fast mode reduces visual chrome for quick drafting."}
                  </p>
                </InspectorGroup>

                <InspectorGroup label="Export format">
                  <ToggleGroup
                    value={[exportFormat]}
                    onValueChange={(value) => {
                      if (value[0]) setExportFormat(value[0] as ExportFormat);
                    }}
                    className="grid h-10 w-full grid-cols-3 rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]"
                  >
                    <ToggleGroupItem value="fdx" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      FDX
                    </ToggleGroupItem>
                    <ToggleGroupItem value="fountain" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      Fountain
                    </ToggleGroupItem>
                    <ToggleGroupItem value="pdf" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      PDF
                    </ToggleGroupItem>
                  </ToggleGroup>
                </InspectorGroup>

                <div className="mt-5">
                  <div className="mb-2 text-[14px] font-medium text-[#9a9993]">
                    Statistics
                  </div>
                  <div>
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex min-h-10 items-center justify-between border-b border-[#eeeeea] text-[13px] text-[#72726c]"
                      >
                        <span>{stat.label}</span>
                        <strong className="font-semibold text-[#282825]">
                          {stat.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-[#dce7dd] bg-[#f4faf5] p-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#2e6e45]">
                    <BadgeCheck className="size-[18px]" />
                    Hollywood screenplay active
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-[#657065]">
                    Scene headings, action, character, parenthetical, dialogue,
                    and transitions are normalized for FDX/Fountain export.
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-[#657065]">
                    Current block type: {activeTool}
                  </p>
                </div>

                <div className="debug-hatch mt-7 grid gap-2 overflow-hidden border border-dashed border-[#d2d2cc] p-3">
                  <span className="text-[13px] text-[#8a8982]">Production tools</span>
                  <Button
                    variant="secondary"
                    className="h-8 justify-start bg-white/70 text-[#666660] shadow-none"
                    onClick={() => {
                      setBreakdownReady(true);
                      setProductionMessage("Breakdown generated: scenes, props, and references are ready.");
                    }}
                  >
                    <WandSparkles data-icon="inline-start" />
                    Generate breakdown
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 justify-start bg-white/70 text-[#666660] shadow-none"
                    onClick={() => {
                      setShotListReady(true);
                      setProductionMessage("Shot list created: 24 shot suggestions added to scene units.");
                    }}
                  >
                    <Clapperboard data-icon="inline-start" />
                    Create shot list
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 justify-start bg-white/70 text-[#666660] shadow-none"
                    onClick={() => {
                      setLastExport(`${exportLabels[exportFormat]} package staged`);
                      setProductionMessage(`${exportLabels[exportFormat]} export staged locally.`);
                    }}
                  >
                    <Play data-icon="inline-start" />
                    Export {exportLabels[exportFormat]}
                  </Button>
                  <div className="rounded-md bg-[#fcfdfc]/80 px-2.5 py-2 text-[12px] leading-5 text-[#666660]">
                    {productionMessage}
                    <br />
                    Last export: {lastExport}
                  </div>
                </div>
                </>
                ) : (
                  <CollaborationPanel />
                )}

                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Writer mode</Badge>
                  <div className="flex items-center gap-1 text-xs text-[#8a8982]">
                    <Users className="size-3.5" />
                    3 reviewers
                  </div>
                </div>
              </div>
            </ScrollArea>
          </section>
        </aside>
        ) : null}
        </div>
      </div>
    </div>
  );
}

function IconChrome({
  label,
  icon: Icon,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={label}
        className="inline-flex size-8 items-center justify-center rounded-lg bg-transparent hover:bg-[#e9e9e5]"
      >
        <Icon className="size-[18px]" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function WorkbenchTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Array<{ label: string; icon: ComponentType<{ className?: string }> }>;
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="flex h-9 items-center rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]">
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

function WorkbenchPage({
  page,
  activeTab,
  additions,
  message,
  generatedStills,
  onGenerateStill,
}: {
  page: WorkbenchPageName;
  activeTab: string;
  additions: number;
  message: string;
  generatedStills: number[];
  onGenerateStill: (sceneId: number) => void;
}) {
  const config = workbenchConfig[page];
  const isScenes = page === "Scenes";
  const extraCards = Array.from({ length: additions }, (_, index) =>
    page === "Assets"
      ? `Imported reference ${index + 1}`
      : `${config.action} draft ${index + 1}`,
  );
  const cards = [...config.cards, ...extraCards];
  const filteredCards =
    page !== "Assets" || activeTab === "All"
      ? cards
      : cards.filter((card) =>
          activeTab === "Videos"
            ? card.toLowerCase().includes("video")
            : !card.toLowerCase().includes("video"),
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
          <div className="overflow-hidden rounded-xl border border-[#deded8] bg-[#fcfdfc] shadow-[0_8px_24px_rgb(42_42_37/0.08)]">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className="grid grid-cols-[44px_minmax(0,1fr)_88px_120px] items-center gap-3 border-b border-[#eeeeea] px-4 py-3 text-[13px] last:border-b-0"
              >
                <span className="text-[#8b8b84]">#{index + 1}</span>
                <strong className="truncate font-medium">
                  {scene.title} - {scene.time}
                </strong>
                <span className="text-[#777771]">{index + 2} chars</span>
                <Badge variant="secondary">
                  {generatedStills.includes(scene.id) ? "Still ready" : "1/8"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className="rounded-xl border border-[#deded8] bg-white p-5 shadow-[0_8px_24px_rgb(42_42_37/0.08)]"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <div className="text-sm text-[#8b8b84]">#{index + 1}</div>
                    <h3 className="mt-1 text-lg font-medium">
                      {scene.title} - {scene.time}
                    </h3>
                  </div>
                  <Badge variant="secondary">
                    {generatedStills.includes(scene.id) ? "Still ready" : "1/8"}
                  </Badge>
                </div>
                <div className="mb-5 flex gap-4 text-sm text-[#777771]">
                  <span className="inline-flex items-center gap-1">
                    <User className="size-4" /> {index + 2} chars
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-4" /> {index * 3 + 4} lines
                  </span>
                </div>
                <p className="mb-5 text-sm leading-6 text-[#777771]">
                  A production-ready scene unit derived from screenplay blocks.
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
        )
      ) : activeTab === "Overview" || page === "Assets" ? (
        <div className="grid grid-cols-3 gap-4 max-[1200px]:grid-cols-2">
          {filteredCards.map((card, index) => (
            <div
              key={`${card}-${index}`}
              className="min-h-[150px] rounded-xl border border-[#deded8] bg-[#fcfdfc] p-4 shadow-[0_8px_24px_rgb(42_42_37/0.07)]"
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
                <Badge variant="secondary">
                  {index < config.cards.length ? "Extracted" : "Draft"}
                </Badge>
              </div>
              <h3 className="text-[16px] font-medium leading-6">{card}</h3>
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
      ) : (
        <div className="mx-auto w-full max-w-[540px] overflow-hidden rounded-[24px] border border-[#deded8] bg-white">
          <div className="h-[206px] bg-[linear-gradient(135deg,#e8f0e8,#cfdde8_48%,#f4ead8)]">
            <div className="flex h-full items-center justify-center text-[#5f705f]">
              <ImageIcon className="size-16 opacity-50" />
            </div>
          </div>
          <div className="px-8 py-6 text-center">
            <h2 className="text-[20px] font-medium leading-[26.6667px]">{config.emptyTitle}</h2>
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
      )}
    </div>
  );
}

function CoverPreview() {
  return (
    <div className="relative min-h-[1180px] px-4 pb-20 pt-16 max-[900px]:px-3">
      <article className="script-paper mx-auto min-h-[1000px] w-[min(816px,100%)] overflow-hidden">
        <div className="flex min-h-[1000px] flex-col items-center px-16 pb-20 pt-28 text-center font-mono">
          <div className="mt-16 text-[16px] uppercase tracking-normal">
            THE DINER AT VIOLET DAWN
          </div>
          <div className="mt-8 text-[13px] leading-6 text-[#6f7672]">
            Written by
            <br />
            Nora Vale
          </div>
          <div className="mt-auto grid w-full grid-cols-2 gap-10 text-left text-[12px] leading-5 text-[#6f7672]">
            <div>
              Draft date
              <br />
              May 14, 2026
            </div>
            <div className="text-right">
              Contact
              <br />
              story@sample.studio
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function CollaborationPanel() {
  const reviewers = [
    { name: "YI", role: "Owner", status: "Editing locally" },
    { name: "MK", role: "Producer", status: "2 notes open" },
    { name: "AL", role: "Script editor", status: "Last seen today" },
  ];

  return (
    <div className="mt-5 space-y-3">
      {reviewers.map((reviewer) => (
        <div
          key={reviewer.name}
          className="rounded-xl border border-[#e4e8e6] bg-[#fcfdfc] p-3"
        >
          <div className="flex items-center gap-2">
            <Avatar className="size-8 bg-[#eef3ef]">
              <AvatarFallback className="bg-transparent text-[11px] font-semibold text-[#2e6248]">
                {reviewer.name}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[#252522]">
                {reviewer.role}
              </div>
              <div className="text-[12px] text-[#7b827e]">
                {reviewer.status}
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="debug-hatch rounded-xl border border-dashed border-[#d2d2cc] p-3 text-[12px] leading-5 text-[#6f6f68]">
        Live collaboration is represented as local mock state in this demo.
      </div>
    </div>
  );
}

function LockedStoryboard() {
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

function InspectorGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5">
      <label className="mb-2 block text-[14px] font-medium text-[#9a9993]">
        {label}
      </label>
      {children}
    </div>
  );
}
