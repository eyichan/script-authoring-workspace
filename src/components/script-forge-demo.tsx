"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, KeyboardEvent, ReactNode } from "react";
import {
  Atom,
  BadgeCheck,
  BarChart3,
  Box,
  ChevronDown,
  Clapperboard,
  Columns2,
  Copy,
  ExternalLink,
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
  Trash2,
  User,
  Users,
  Video,
  WandSparkles,
  Zap,
} from "lucide-react";

import {
  createProjectAction,
  openProjectAction,
  renameProjectAction,
  restoreProjectAction,
  trashProjectAction,
} from "@/app/actions/projects";
import { createInviteAction } from "@/app/actions/collaboration";
import {
  commitAndInsertScriptBlockAction,
  deleteScriptBlockAction,
  duplicateScriptBlockAction,
  insertScriptBlockAction,
  updateScriptBlockAction,
} from "@/app/actions/script-blocks";
import {
  createBeatAction,
  createPropAction,
  deleteAssetAction,
  deleteBeatAction,
  deletePropAction,
  importAssetAction,
  updateAssetAction,
  updateBeatAction,
  updatePropAction,
} from "@/app/actions/workbench";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildScriptExport,
  type ScriptExportFormat,
} from "@/lib/domain/exports";
import {
  deriveScriptEntities,
  formatSceneHeading,
  parseSceneHeading,
} from "@/lib/domain/screenplay";
import {
  getActiveProjects,
  getTrashedProjects,
} from "@/lib/domain/projects";
import {
  updateScriptBlockText,
} from "@/lib/domain/script-blocks";
import { seedWorkspace } from "@/lib/domain/seed";
import type {
  AssetTask,
  Beat,
  CollaborationState,
  DerivedScene,
  Prop,
  Project,
  SceneHeadingParts,
  Script,
  ScriptBlock,
  ScriptBlockType,
  WorkspaceView,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type ExportFormat = ScriptExportFormat;
type EditorTab = "script" | "cover";
type InspectorTab = "info" | "collab";
type PaginationMode = "minimal" | "studio" | "fast";
type WorkspaceMode = "workspace" | "projects";
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
type BlockInputElement = HTMLInputElement | HTMLTextAreaElement;
type WorkbenchCard = {
  id: string;
  title: string;
  persisted: boolean;
};

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

const toolToBlockType: Record<ToolLabel, ScriptBlockType> = {
  Scene: "scene",
  Action: "action",
  Character: "character",
  Paren: "paren",
  Dialogue: "dialogue",
  Transition: "transition",
  Comment: "comment",
  Subtitle: "subtitle",
};

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

const nextToolByBlockType: Record<ScriptBlockType, ToolLabel> = {
  scene: "Action",
  action: "Action",
  character: "Dialogue",
  paren: "Dialogue",
  dialogue: "Character",
  transition: "Scene",
  comment: "Action",
  subtitle: "Action",
};

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

const seedProjects: Project[] = [
  seedWorkspace.project,
  {
    id: "project-reference",
    title: "Foreign Screenplay Study",
    status: "active",
    createdAt: "2026-05-15T00:20:00.000Z",
    updatedAt: "2026-05-15T00:20:00.000Z",
  },
  {
    id: "project-trash-sample",
    title: "Deleted Treatment Sample",
    status: "trashed",
    createdAt: "2026-05-15T00:10:00.000Z",
    updatedAt: "2026-05-15T00:30:00.000Z",
    trashedAt: "2026-05-15T00:30:00.000Z",
  },
];

const scenePrefixOptions = ["INT", "EXT"] as const;
const sceneTimeOptions = ["DAY", "NIGHT"] as const;

function isWorkbenchPage(page: PageName): page is WorkbenchPageName {
  return page !== "Script" && page !== "Beats" && page !== "Storyboard";
}

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

function normalizeBlockText(type: ScriptBlockType, value: string): string {
  if (type === "scene" || type === "character" || type === "transition") {
    return value.toUpperCase();
  }

  return value;
}

function resizeBlockInput(input: HTMLTextAreaElement) {
  input.style.height = "auto";
  input.style.height = `${Math.max(input.scrollHeight, 29)}px`;
}

function getSceneDraft(text: string): SceneHeadingParts {
  const parsed = parseSceneHeading(text);

  return {
    prefix: parsed?.prefix === "EXT" ? "EXT" : "INT",
    locationName: parsed?.locationName ?? "",
    timeOfDay: parsed?.timeOfDay ?? "DAY",
  };
}

function buildSceneHeading(parts: SceneHeadingParts): string {
  const locationName = parts.locationName.trim().replace(/\s+/g, " ").toUpperCase();
  if (!locationName) return "";

  return formatSceneHeading({
    prefix: parts.prefix,
    locationName,
    timeOfDay: parts.timeOfDay.trim().replace(/\s+/g, " ").toUpperCase() || "DAY",
  });
}

function getBlockLabel(type: ScriptBlockType): string {
  return blockTypeToTool[type];
}

function getBlockSummary(block: ScriptBlock): string {
  const text = block.text.trim();
  if (text) return text;

  return `${getBlockLabel(block.type)} block`;
}

type ScriptForgeDemoProps = {
  initialActiveProjectId?: string;
  initialProjects?: Project[];
  initialWorkspace?: WorkspaceView;
  persistenceLabel?: string;
};

type WorkspaceSnapshotPayload = {
  projects: Project[];
  workspace: WorkspaceView;
  activeProjectId: string;
};

type ScriptMutationPayload = WorkspaceSnapshotPayload & {
  activeBlockId?: string;
};

type WorkbenchMutationPayload = WorkspaceSnapshotPayload & {
  message: string;
};

type CollaborationMutationPayload = WorkspaceSnapshotPayload & {
  message: string;
};

export function ScriptForgeDemo({
  initialActiveProjectId,
  initialProjects,
  initialWorkspace = seedWorkspace,
  persistenceLabel = "Local project lifecycle before database persistence.",
}: ScriptForgeDemoProps) {
  const initialProjectList = initialProjects?.length ? initialProjects : seedProjects;
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("workspace");
  const [projects, setProjects] = useState<Project[]>(initialProjectList);
  const [activeProjectId, setActiveProjectId] = useState(
    initialActiveProjectId ?? initialWorkspace.project.id,
  );
  const [projectTitleDraft, setProjectTitleDraft] = useState({
    projectId: initialWorkspace.project.id,
    title: initialWorkspace.project.title,
  });
  const [script, setScript] = useState<Script>(initialWorkspace.script);
  const [activePage, setActivePage] = useState<PageName>("Script");
  const [blocks, setBlocks] = useState<ScriptBlock[]>(initialWorkspace.blocks);
  const nextBlockNumber = useRef(initialWorkspace.blocks.length + 1);
  const nextBeatNumber = useRef(initialWorkspace.beats.length + 1);
  const nextPropNumber = useRef(initialWorkspace.props.length + 1);
  const nextAssetNumber = useRef(initialWorkspace.assetTasks.length + 1);
  const nextRevisionNumber = useRef(1);
  const blockInputRefs = useRef<Record<string, BlockInputElement | null>>({});
  const [beats, setBeats] = useState<Beat[]>(initialWorkspace.beats);
  const [props, setProps] = useState<Prop[]>(initialWorkspace.props);
  const [assetTasks, setAssetTasks] = useState<AssetTask[]>(
    initialWorkspace.assetTasks,
  );
  const [collaboration, setCollaboration] = useState<CollaborationState>(
    initialWorkspace.collaboration,
  );
  const derived = useMemo(
    () => deriveScriptEntities(script.id, blocks),
    [blocks, script.id],
  );
  const [activeScene, setActiveScene] = useState(
    initialWorkspace.scenes[0]?.id ?? "",
  );
  const [editorTab, setEditorTab] = useState<EditorTab>("script");
  const [activeTool, setActiveTool] = useState<ToolLabel>("Action");
  const [activeBlockId, setActiveBlockId] = useState(
    initialWorkspace.blocks.at(-1)?.id ?? "",
  );
  const [pendingFocusBlockId, setPendingFocusBlockId] = useState<string | null>(null);
  const [sceneDrafts, setSceneDrafts] = useState<Record<string, SceneHeadingParts>>({});
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
  const [generatedStills, setGeneratedStills] = useState<string[]>([]);
  const [projectMutationPending, setProjectMutationPending] = useState(false);
  const [scriptMutationPending, setScriptMutationPending] = useState(false);
  const [workbenchMutationPending, setWorkbenchMutationPending] = useState(false);
  const [collaborationMutationPending, setCollaborationMutationPending] =
    useState(false);
  const [collaborationMessage, setCollaborationMessage] = useState(
    "Invite collaborators to create a persisted review link.",
  );
  const editorMode = activePage === "Script";
  const activeProject =
    projects.find((project) => project.id === activeProjectId) ??
    initialWorkspace.project;
  const projectTitleValue =
    projectTitleDraft.projectId === activeProject.id
      ? projectTitleDraft.title
      : activeProject.title;
  const activeProjects = useMemo(() => getActiveProjects(projects), [projects]);
  const trashedProjects = useMemo(() => getTrashedProjects(projects), [projects]);

  const applyWorkspace = (
    workspace: WorkspaceView,
    options: { focusBlockId?: string | null; resetView?: boolean } = {},
  ) => {
    setScript(workspace.script);
    setBlocks(workspace.blocks);
    setBeats(workspace.beats);
    setProps(workspace.props);
    setAssetTasks(workspace.assetTasks);
    setCollaboration(workspace.collaboration);
    setActiveProjectId(workspace.project.id);
    setSceneDrafts({});
    setActiveScene(workspace.scenes[0]?.id ?? "");
    if (options.resetView) {
      setActivePage("Script");
      setEditorTab("script");
    }
    if (options.focusBlockId !== undefined) {
      setActiveBlockId(options.focusBlockId ?? "");
      setPendingFocusBlockId(options.focusBlockId);
    }
    nextBlockNumber.current = workspace.blocks.length + 1;
    nextBeatNumber.current = workspace.beats.length + 1;
    nextPropNumber.current = workspace.props.length + 1;
    nextAssetNumber.current = workspace.assetTasks.length + 1;
  };

  const applySnapshot = (snapshot: WorkspaceSnapshotPayload) => {
    setProjects(snapshot.projects);
    applyWorkspace(snapshot.workspace, {
      focusBlockId: snapshot.workspace.blocks.at(-1)?.id ?? null,
      resetView: true,
    });
    setActiveProjectId(snapshot.activeProjectId);
    setWorkspaceMode("workspace");
  };

  const runProjectMutation = async (
    operation: () => Promise<WorkspaceSnapshotPayload>,
  ) => {
    if (projectMutationPending) return;

    setProjectMutationPending(true);
    try {
      const snapshot = await operation();
      applySnapshot(snapshot);
    } finally {
      setProjectMutationPending(false);
    }
  };

  const runScriptMutation = async (
    operation: () => Promise<ScriptMutationPayload>,
    options: { focusReturnedBlock?: boolean } = {},
  ) => {
    if (scriptMutationPending) return;

    setScriptMutationPending(true);
    try {
      const snapshot = await operation();
      setProjects(snapshot.projects);
      applyWorkspace(snapshot.workspace, {
        focusBlockId: options.focusReturnedBlock
          ? snapshot.activeBlockId ?? null
          : undefined,
      });
      if (snapshot.activeBlockId) {
        setActiveBlockId(snapshot.activeBlockId);
      }
    } finally {
      setScriptMutationPending(false);
    }
  };

  const runWorkbenchMutation = async (
    operation: () => Promise<WorkbenchMutationPayload>,
  ) => {
    if (workbenchMutationPending) return;

    setWorkbenchMutationPending(true);
    try {
      const snapshot = await operation();
      setProjects(snapshot.projects);
      applyWorkspace(snapshot.workspace);
      setWorkbenchMessage(snapshot.message);
    } finally {
      setWorkbenchMutationPending(false);
    }
  };

  const runCollaborationMutation = async (
    operation: () => Promise<CollaborationMutationPayload>,
  ) => {
    if (collaborationMutationPending) return;

    setCollaborationMutationPending(true);
    try {
      const snapshot = await operation();
      setProjects(snapshot.projects);
      applyWorkspace(snapshot.workspace);
      setCollaborationMessage(snapshot.message);
      setInspectorTab("collab");
    } finally {
      setCollaborationMutationPending(false);
    }
  };

  useEffect(() => {
    if (!pendingFocusBlockId) return;

    const input = blockInputRefs.current[pendingFocusBlockId];
    if (!input) return;

    input.focus();
    input.select();
    if (input instanceof HTMLTextAreaElement) {
      resizeBlockInput(input);
    }
    setPendingFocusBlockId(null);
  }, [blocks, pendingFocusBlockId]);

  const dynamicCards: Record<WorkbenchPageName, WorkbenchCard[]> = {
    Characters: derived.characters.map((character) => ({
      id: character.id,
      title: character.displayName,
      persisted: false,
    })),
    Props: props.map((prop) => ({
      id: prop.id,
      title: prop.name,
      persisted: true,
    })),
    Locations: derived.locations.map((location) => ({
      id: location.id,
      title: location.displayName,
      persisted: false,
    })),
    Scenes: derived.scenes.map((scene) => ({
      id: scene.id,
      title: scene.heading,
      persisted: false,
    })),
    Assets: assetTasks.map((task) => ({
      id: task.id,
      title: task.title,
      persisted: true,
    })),
  };
  const workbenchCount =
    isWorkbenchPage(activePage)
      ? dynamicCards[activePage].length + mockAdditions[activePage]
      : 0;
  const pageActionCount = activePage === "Beats" ? beats.length : workbenchCount;
  const sidebarSectionTitle = activePage === "Script" ? "Scenes" : activePage;
  const sidebarItems = useMemo(() => {
    if (activePage === "Beats") {
      return beats.length
        ? beats.map((beat, index) => ({
            id: beat.id,
            title: beat.title,
            time: `${beat.durationMinutes}M`,
            index: index + 1,
          }))
        : [{ id: "empty-beats", title: "No beats yet", time: "PLAN", index: 1 }];
    }

    if (activePage === "Characters") {
      return derived.characters.map((character, index) => ({
        id: character.id,
        title: character.displayName,
        time: `${character.dialogueLineCount} LINES`,
        index: index + 1,
      }));
    }

    if (activePage === "Props") {
      return props.map((prop, index) => ({
        id: prop.id,
        title: prop.name.toUpperCase(),
        time: prop.category.toUpperCase(),
        index: index + 1,
      }));
    }

    if (activePage === "Locations") {
      return derived.locations.map((location, index) => ({
        id: location.id,
        title: location.displayName,
        time: `${location.sceneIds.length} SCENES`,
        index: index + 1,
      }));
    }

    if (activePage === "Assets") {
      return assetTasks.length
        ? assetTasks.map((task, index) => ({
            id: task.id,
            title: task.title,
            time: task.status.toUpperCase(),
            index: index + 1,
          }))
        : [{ id: "empty-assets", title: "No assets yet", time: "TASKS", index: 1 }];
    }

    return derived.scenes.map((scene, index) => ({
      id: scene.id,
      title: `${scene.prefix} ${scene.locationName}`,
      time: scene.timeOfDay,
      index: index + 1,
    }));
  }, [activePage, assetTasks, beats, derived.characters, derived.locations, derived.scenes, props]);

  const stats = useMemo(
    () => [
      { label: "Scenes", value: derived.scenes.length },
      { label: "Characters", value: derived.characters.length },
      { label: "Locations", value: derived.locations.length },
      { label: "Beats", value: beats.length },
      { label: "Shots", value: shotListReady ? 24 : 0 },
      { label: "Props", value: props.length + (breakdownReady ? 7 : 0) },
      { label: "Exports", value: exportLabels[exportFormat] },
    ],
    [
      beats.length,
      breakdownReady,
      derived.characters.length,
      derived.locations.length,
      derived.scenes.length,
      exportFormat,
      props.length,
      shotListReady,
    ],
  );

  const handleInsertScriptBlock = (tool: ToolLabel, afterBlockId = activeBlockId) => {
    const type = toolToBlockType[tool];
    setActiveTool(tool);

    void runScriptMutation(
      () =>
        insertScriptBlockAction({
          projectId: activeProject.id,
          scriptId: script.id,
          type,
          afterBlockId: afterBlockId || undefined,
        }),
      { focusReturnedBlock: true },
    );
  };

  const handleUpdateScriptBlock = (id: string, value: string) => {
    setBlocks((current) => {
      const block = current.find((item) => item.id === id);
      const nextValue = block ? normalizeBlockText(block.type, value) : value;

      return updateScriptBlockText(
        current,
        id,
        nextValue,
        `local-edit-${nextRevisionNumber.current++}`,
      );
    });
  };

  const handlePersistScriptBlockText = (blockId: string, text: string) => {
    void runScriptMutation(() =>
      updateScriptBlockAction({
        projectId: activeProject.id,
        blockId,
        text,
      }),
    );
  };

  const handleBlockKeyDown = (
    block: ScriptBlock,
    event: KeyboardEvent<BlockInputElement>,
  ) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    const nextTool = nextToolByBlockType[block.type];
    const nextType = toolToBlockType[nextTool];

    setActiveTool(nextTool);
    void runScriptMutation(
      () =>
        commitAndInsertScriptBlockAction({
          projectId: activeProject.id,
          scriptId: script.id,
          type: nextType,
          afterBlockId: block.id,
          text: block.text,
        }),
      { focusReturnedBlock: true },
    );
  };

  const focusBlockById = (blockId: string) => {
    const block = blocks.find((current) => current.id === blockId);

    setActivePage("Script");
    setEditorTab("script");
    setActiveBlockId(blockId);
    if (block?.type === "scene") {
      setActiveScene(`scene-${block.id}`);
    }
    setPendingFocusBlockId(blockId);
  };

  const handleDuplicateScriptBlock = (block: ScriptBlock) => {
    setActiveTool(blockTypeToTool[block.type]);

    void runScriptMutation(
      () =>
        duplicateScriptBlockAction({
          projectId: activeProject.id,
          blockId: block.id,
        }),
      { focusReturnedBlock: true },
    );
  };

  const handleDeleteScriptBlock = (block: ScriptBlock) => {
    void runScriptMutation(
      () =>
        deleteScriptBlockAction({
          projectId: activeProject.id,
          blockId: block.id,
        }),
      { focusReturnedBlock: true },
    );
  };

  const withBlockMenu = (block: ScriptBlock, children: ReactNode) => (
    <ContextMenu key={block.id}>
      <ContextMenuTrigger className="select-text">{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-[178px] border-[#dfe4e1] bg-[#fcfdfc] text-[#252522]">
        <ContextMenuGroup>
          <ContextMenuLabel className="max-w-[220px] truncate">
            {getBlockSummary(block)}
          </ContextMenuLabel>
        </ContextMenuGroup>
        <ContextMenuItem onClick={() => focusBlockById(block.id)}>
          <ExternalLink className="size-4" />
          Open
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleDuplicateScriptBlock(block)}>
          <Copy className="size-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => handleDeleteScriptBlock(block)}
        >
          <Trash2 className="size-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  const handleScenePartChange = (
    block: ScriptBlock,
    patch: Partial<SceneHeadingParts>,
    persist = false,
  ) => {
    const nextScene = {
      ...(sceneDrafts[block.id] ?? getSceneDraft(block.text)),
      ...patch,
    };
    const nextText = buildSceneHeading(nextScene);

    setSceneDrafts((current) => ({
      ...current,
      [block.id]: nextScene,
    }));
    handleUpdateScriptBlock(block.id, nextText);
    if (persist) {
      handlePersistScriptBlockText(block.id, nextText);
    }
    if (nextText) {
      setActiveScene(`scene-${block.id}`);
    }
  };

  const focusSourceBlock = (id: string) => {
    if (!id.startsWith("scene-")) return;

    setActiveScene(id);
    focusBlockById(id.slice("scene-".length));
  };

  const handleCreateBeat = () => {
    void runWorkbenchMutation(() =>
      createBeatAction({
        projectId: activeProject.id,
        scriptId: script.id,
      }),
    );
  };

  const handleCreateProp = () => {
    void runWorkbenchMutation(() =>
      createPropAction({
        projectId: activeProject.id,
        scriptId: script.id,
      }),
    );
  };

  const handleImportAsset = () => {
    void runWorkbenchMutation(() =>
      importAssetAction({
        projectId: activeProject.id,
        scriptId: script.id,
      }),
    );
  };

  const handleDeleteBeat = (beatId: string) => {
    void runWorkbenchMutation(() =>
      deleteBeatAction({
        projectId: activeProject.id,
        scriptId: script.id,
        beatId,
      }),
    );
  };

  const handleDeleteWorkbenchCard = (page: WorkbenchPageName, id: string) => {
    if (page === "Props") {
      void runWorkbenchMutation(() =>
        deletePropAction({
          projectId: activeProject.id,
          scriptId: script.id,
          propId: id,
        }),
      );
      return;
    }

    if (page === "Assets") {
      void runWorkbenchMutation(() =>
        deleteAssetAction({
          projectId: activeProject.id,
          scriptId: script.id,
          assetId: id,
        }),
      );
    }
  };

  const handleUpdateBeat = (beatId: string, title: string) => {
    void runWorkbenchMutation(() =>
      updateBeatAction({
        projectId: activeProject.id,
        scriptId: script.id,
        beatId,
        title,
      }),
    );
  };

  const handleUpdateWorkbenchCard = (
    page: WorkbenchPageName,
    id: string,
    title: string,
  ) => {
    if (page === "Props") {
      void runWorkbenchMutation(() =>
        updatePropAction({
          projectId: activeProject.id,
          scriptId: script.id,
          propId: id,
          name: title,
        }),
      );
      return;
    }

    if (page === "Assets") {
      void runWorkbenchMutation(() =>
        updateAssetAction({
          projectId: activeProject.id,
          scriptId: script.id,
          assetId: id,
          title,
        }),
      );
    }
  };

  const handleCreateProject = () => {
    void runProjectMutation(createProjectAction);
  };

  const handleOpenProject = (projectId: string) => {
    void runProjectMutation(() => openProjectAction(projectId));
  };

  const handleTrashProject = (projectId: string) => {
    void runProjectMutation(() => trashProjectAction(projectId));
  };

  const handleRestoreProject = (projectId: string) => {
    void runProjectMutation(() => restoreProjectAction(projectId));
  };

  const handleRenameProject = () => {
    const nextTitle = projectTitleValue.trim();

    if (!nextTitle) {
      setProjectTitleDraft({
        projectId: activeProject.id,
        title: activeProject.title,
      });
      return;
    }

    if (nextTitle === activeProject.title) return;

    void runProjectMutation(() =>
      renameProjectAction({
        projectId: activeProject.id,
        title: nextTitle,
      }),
    );
  };

  const handleWorkbenchAction = () => {
    if (!isWorkbenchPage(activePage)) return;

    if (activePage === "Scenes") {
      setWorkbenchMessage("Scene board tidied: cards sorted by screenplay order.");
      return;
    }

    if (activePage === "Props") {
      handleCreateProp();
      return;
    }

    if (activePage === "Assets") {
      handleImportAsset();
      return;
    }

    setMockAdditions((current) => ({
      ...current,
      [activePage]: current[activePage] + 1,
    }));

    setWorkbenchMessage(`${workbenchConfig[activePage].action} created as a local draft.`);
  };

  const handleExportScript = () => {
    const exportPackage = buildScriptExport(exportFormat, script.title, blocks);
    const blob = new Blob([exportPackage.content], {
      type: exportPackage.mimeType,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = exportPackage.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setLastExport(exportPackage.filename);
    setProductionMessage(
      exportFormat === "pdf"
        ? `Printable PDF package downloaded as ${exportPackage.filename}.`
        : `${exportLabels[exportFormat]} export downloaded as ${exportPackage.filename}.`,
    );
  };

  const handleCreateInvite = () => {
    void runCollaborationMutation(() => createInviteAction(activeProject.id));
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f4f6f5] text-[#242421]">
      <header className="flex h-12 items-center justify-between px-3">
        <div className="flex items-center gap-4">
            <IconChrome
              label="Home"
              icon={Home}
              onClick={() => setWorkspaceMode("projects")}
            />
            <IconChrome label="Outline" icon={Columns2} />
        </div>
        <Button
          variant="secondary"
          className="h-8 gap-1.5 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium text-[#171a19] shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] transition-[background-color,box-shadow,color,border-color] duration-150 hover:bg-[#f8faf9] active:translate-y-0"
          disabled={collaborationMutationPending}
          onClick={handleCreateInvite}
        >
          <Share2 className="size-[14px]" data-icon="inline-start" />
          {collaborationMutationPending ? "Inviting" : "Invite"}
        </Button>
      </header>

      {workspaceMode === "projects" ? (
        <ProjectLibrary
          activeProjectId={activeProjectId}
          activeProjects={activeProjects}
          persistenceLabel={persistenceLabel}
          projectMutationPending={projectMutationPending}
          trashedProjects={trashedProjects}
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
          onTrashProject={handleTrashProject}
          onRestoreProject={handleRestoreProject}
        />
      ) : (
      <div className="flex h-[calc(100%-48px)] min-h-0 gap-2 px-2 pb-2 max-[900px]:overflow-auto">
        <aside className="flex min-h-0 w-[230px] shrink-0 flex-col pb-0 pt-4 max-[900px]:hidden">
          <div className="ml-4 flex h-[30px] w-[150px] items-center overflow-hidden rounded-lg bg-[#e4e8e6] text-[13px] font-normal text-[#171a19] shadow-none transition-colors duration-300 focus-within:bg-[#dde2df] max-[1180px]:hidden">
            <label htmlFor="project-title" className="sr-only">
              Project title
            </label>
            <input
              id="project-title"
              name="project-title"
              aria-label="Project title"
              value={projectTitleValue}
              disabled={projectMutationPending}
              spellCheck={false}
              onChange={(event) =>
                setProjectTitleDraft({
                  projectId: activeProject.id,
                  title: event.target.value,
                })
              }
              onBlur={handleRenameProject}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
                if (event.key === "Escape") {
                  setProjectTitleDraft({
                    projectId: activeProject.id,
                    title: activeProject.title,
                  });
                  event.currentTarget.blur();
                }
              }}
              className="min-w-0 flex-1 bg-transparent px-2.5 outline-none placeholder:text-[#8a908d] disabled:opacity-60"
            />
            <button
              type="button"
              aria-label="Open projects"
              disabled={projectMutationPending}
              onClick={() => setWorkspaceMode("projects")}
              className="grid h-full w-8 shrink-0 place-items-center text-[#5d6561] transition-colors hover:bg-[#d7ddda] disabled:opacity-60"
            >
              <ChevronDown className="size-3.5" />
            </button>
          </div>

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
              {sidebarItems.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    if (activePage === "Script" || activePage === "Scenes") {
                      focusSourceBlock(scene.id);
                      return;
                    }

                    setActiveScene(scene.id);
                  }}
                  className={cn(
                    "flex h-[42px] w-[214px] items-center justify-between rounded-xl border border-[#e4e8e6] bg-[#fcfdfc] px-2.5 text-left text-[13px] font-normal text-[#55554f] shadow-[0_2px_4px_rgb(0_0_0/0.05),0_1px_2px_-1px_rgb(0_0_0/0.05)] transition-[background-color,border-color,box-shadow,color] duration-150 hover:bg-[#f8faf9]",
                    activeScene === scene.id &&
                      "border-[#dce2de] text-[#252522] shadow-[0_2px_4px_rgb(0_0_0/0.05),0_1px_2px_-1px_rgb(0_0_0/0.05)]",
                  )}
                >
                  <span className="truncate">
                    {scene.index}. {scene.title}
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
          <header className="pointer-events-none relative flex items-center justify-center border-b border-[#ebebe7] px-4 max-[900px]:min-h-[96px] max-[900px]:flex-col max-[900px]:gap-2 max-[900px]:py-3">
            <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[16px] font-normal max-[900px]:static max-[900px]:translate-y-0">
              {editorMode
                ? activePage
                : activePage === "Beats"
                  ? "Beats"
                  : activePage === "Storyboard"
                    ? "Storyboard"
                    : workbenchConfig[activePage].title}
              {!editorMode && activePage !== "Storyboard" ? (
                <span className="rounded-md bg-[#f3f3f0] px-2 py-1 text-[13px] font-normal">
                  {pageActionCount}
                </span>
              ) : null}
            </div>
            {editorMode ? (
              <Tabs
                value={editorTab}
                onValueChange={(value) => setEditorTab(value as EditorTab)}
                className="pointer-events-auto items-center"
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
            ) : activePage === "Beats" ? (
              <Badge variant="secondary" className="justify-self-center">
                Outline
              </Badge>
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
              <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 max-[900px]:hidden">
                <IconChrome label="Statistics" icon={BarChart3} />
              </div>
            ) : activePage === "Beats" ? (
              <Button
                className="pointer-events-auto absolute right-4 top-1/2 z-10 h-7 -translate-y-1/2 rounded-full bg-[#2e6248] px-3 text-[12px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#28583f] active:translate-y-0 max-[900px]:static max-[900px]:translate-y-0"
                disabled={workbenchMutationPending}
                onClick={handleCreateBeat}
              >
                <Plus className="size-[14px]" data-icon="inline-start" />
                {workbenchMutationPending ? "Saving" : "New Beat"}
              </Button>
            ) : activePage !== "Storyboard" ? (
              <Button
                className="pointer-events-auto absolute right-4 top-1/2 z-10 h-7 -translate-y-1/2 rounded-full bg-[#2e6248] px-3 text-[12px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#28583f] active:translate-y-0 max-[900px]:static max-[900px]:translate-y-0"
                disabled={workbenchMutationPending}
                onClick={handleWorkbenchAction}
              >
                {workbenchConfig[activePage].action === "Tidy" ? (
                  <MoreHorizontal className="size-[14px]" data-icon="inline-start" />
                ) : (
                  <Plus className="size-[14px]" data-icon="inline-start" />
                )}
                {workbenchMutationPending ? "Saving" : workbenchConfig[activePage].action}
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
            ) : activePage === "Beats" ? (
              <BeatsPage
                beats={beats}
                message={workbenchMessage}
                mutationPending={workbenchMutationPending}
                onDeleteBeat={handleDeleteBeat}
                onUpdateBeat={handleUpdateBeat}
              />
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
                cards={dynamicCards[activePage]}
                scenes={derived.scenes}
                mutationPending={workbenchMutationPending}
                onDeleteCard={(id) =>
                  handleDeleteWorkbenchCard(activePage as WorkbenchPageName, id)
                }
                onUpdateCard={(id, title) =>
                  handleUpdateWorkbenchCard(
                    activePage as WorkbenchPageName,
                    id,
                    title,
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
                      disabled={scriptMutationPending}
                      onClick={() => handleInsertScriptBlock(tool.label)}
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
                                  handleScenePartChange(block, { prefix }, true)
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
                            onFocus={() => {
                              setActiveBlockId(block.id);
                              setActiveTool("Scene");
                            }}
                            onChange={(event) =>
                              handleScenePartChange(block, {
                                locationName: event.target.value,
                              })
                            }
                            onBlur={() =>
                              handlePersistScriptBlockText(block.id, block.text)
                            }
                            onKeyDown={(event) => handleBlockKeyDown(block, event)}
                            className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[16px] uppercase leading-[1.8] text-[#242421] outline-none placeholder:text-[#aeb6b2] focus:bg-[#f9fbfa]"
                          />
                          <span className="text-[#a0a6a2]">-</span>
                          <div className="flex overflow-hidden rounded-md border border-[#e1e5e2] bg-[#f8faf9]">
                            {sceneTimeOptions.map((timeOfDay) => (
                              <button
                                key={timeOfDay}
                                type="button"
                                onClick={() =>
                                  handleScenePartChange(block, { timeOfDay }, true)
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
                        </div>
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
                            onFocus={() => {
                              setActiveBlockId(block.id);
                              setActiveTool("Character");
                            }}
                            onChange={(event) =>
                              handleUpdateScriptBlock(block.id, event.target.value)
                            }
                            onBlur={(event) =>
                              handlePersistScriptBlockText(block.id, event.target.value)
                            }
                            onKeyDown={(event) => handleBlockKeyDown(block, event)}
                            className="block w-full border-0 bg-transparent p-0 text-center font-mono text-[16px] uppercase leading-[1.8] text-[#242421] outline-none placeholder:text-[#aeb6b2] focus:bg-[#f9fbfa]"
                          />
                          <datalist id={listId}>
                            {derived.characters.map((character) => (
                              <option
                                key={character.id}
                                value={character.displayName}
                              />
                            ))}
                          </datalist>
                        </div>
                      );
                    }

                    const blockFieldId = `${block.type}-${block.id}`;

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
                          placeholder={getDefaultBlockText(blockTypeToTool[block.type])}
                          spellCheck={false}
                          onFocus={() => {
                            setActiveBlockId(block.id);
                            setActiveTool(blockTypeToTool[block.type]);
                          }}
                          onChange={(event) => {
                            handleUpdateScriptBlock(block.id, event.target.value);
                            resizeBlockInput(event.target);
                          }}
                          onBlur={(event) =>
                            handlePersistScriptBlockText(block.id, event.target.value)
                          }
                          onInput={(event) => resizeBlockInput(event.currentTarget)}
                          onKeyDown={(event) => handleBlockKeyDown(block, event)}
                          className={cn(
                            "block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-mono text-[16px] leading-[1.8] text-[#242421] outline-none placeholder:text-[#aeb6b2] focus:bg-[#f9fbfa]",
                            "mb-[15px] whitespace-pre-wrap",
                            block.type === "paren" &&
                              "m-0 text-center italic text-[#74746f]",
                            block.type === "dialogue" &&
                              "mx-auto max-w-[470px]",
                            block.type === "transition" && "mb-5",
                          )}
                        />
                      </>
                    );
                  })}
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
                    onClick={handleExportScript}
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
                  <CollaborationPanel
                    collaboration={collaboration}
                    message={collaborationMessage}
                  />
                )}

                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Writer mode</Badge>
                  <div className="flex items-center gap-1 text-xs text-[#8a8982]">
                    <Users className="size-3.5" />
                    {collaboration.collaborators.length} collaborators
                  </div>
                </div>
              </div>
            </ScrollArea>
          </section>
        </aside>
        ) : null}
        </div>
      </div>
      )}
    </div>
  );
}

function ProjectLibrary({
  activeProjectId,
  activeProjects,
  persistenceLabel,
  projectMutationPending,
  trashedProjects,
  onCreateProject,
  onOpenProject,
  onTrashProject,
  onRestoreProject,
}: {
  activeProjectId: string;
  activeProjects: Project[];
  persistenceLabel: string;
  projectMutationPending: boolean;
  trashedProjects: Project[];
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
  onTrashProject: (projectId: string) => void;
  onRestoreProject: (projectId: string) => void;
}) {
  return (
    <div className="h-[calc(100%-48px)] min-h-0 px-2 pb-2">
      <section className="grid h-full min-h-0 grid-rows-[56px_1fr] overflow-hidden rounded-[24px] border border-[#ddddda] bg-[#fcfdfc] shadow-sm">
        <header className="flex items-center justify-between border-b border-[#ebebe7] px-5">
          <div>
            <h1 className="text-[16px] font-normal text-[#242421]">Recents</h1>
            <p className="text-[12px] text-[#7d837f]">
              {persistenceLabel}
            </p>
          </div>
          <Button
            className="h-8 rounded-full bg-[#2e6248] px-3 text-[12px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#28583f] active:translate-y-0"
            disabled={projectMutationPending}
            onClick={onCreateProject}
          >
            <Plus className="size-[14px]" data-icon="inline-start" />
            {projectMutationPending ? "Saving" : "New Project"}
          </Button>
        </header>

        <ScrollArea className="min-h-0 bg-[radial-gradient(rgb(188_194_187/0.38)_1px,transparent_1px)] [background-size:30px_30px]">
          <div className="mx-auto grid max-w-[1120px] gap-6 px-6 py-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-medium text-[#6f7772]">Active Projects</h2>
                <Badge variant="secondary">{activeProjects.length}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    active={project.id === activeProjectId}
                    disabled={projectMutationPending}
                    statusLabel={project.id === activeProjectId ? "Open now" : "Active"}
                    onOpen={() => onOpenProject(project.id)}
                    onTrash={() => onTrashProject(project.id)}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-medium text-[#6f7772]">Trash</h2>
                <Badge variant="secondary">{trashedProjects.length}</Badge>
              </div>
              {trashedProjects.length ? (
                <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
                  {trashedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      active={false}
                      disabled={projectMutationPending}
                      statusLabel="In Trash"
                      onRestore={() => onRestoreProject(project.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#cfd8d2] bg-[#f8faf8] p-4 text-[13px] text-[#6f7772]">
                  Trash is empty.
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </section>
    </div>
  );
}

function ProjectCard({
  project,
  active,
  disabled = false,
  statusLabel,
  onOpen,
  onTrash,
  onRestore,
}: {
  project: Project;
  active: boolean;
  disabled?: boolean;
  statusLabel: string;
  onOpen?: () => void;
  onTrash?: () => void;
  onRestore?: () => void;
}) {
  const card = (
    <div
      data-testid={`project-card-${project.id}`}
      className={cn(
        "min-h-[160px] rounded-xl border border-[#deded8] bg-[#fcfdfc] p-4 shadow-[0_8px_24px_rgb(42_42_37/0.07)]",
        active && "border-[#b8d2bf] bg-[#f6fbf7]",
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="grid size-9 place-items-center rounded-lg bg-[#eef3ef] text-[#2e6248]">
          <FileText className="size-5" />
        </div>
        <Badge variant="secondary">{statusLabel}</Badge>
      </div>
      <h3 className="truncate text-[16px] font-medium leading-6">{project.title}</h3>
      <p className="mt-2 text-[13px] leading-5 text-[#777771]">
        Updated {project.updatedAt}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {onOpen ? (
          <Button
            variant="secondary"
            className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
            disabled={disabled}
            onClick={onOpen}
          >
            <ExternalLink className="size-[14px]" data-icon="inline-start" />
            Open
          </Button>
        ) : null}
        {onTrash ? (
          <Button
            variant="secondary"
            className="h-8 rounded-full border border-[#efd2d2] bg-[#fffafa] px-3 text-[12px] font-medium text-[#a04444] shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:bg-[#fff5f5] active:translate-y-0"
            disabled={disabled}
            onClick={onTrash}
          >
            <Trash2 className="size-[14px]" data-icon="inline-start" />
            Delete
          </Button>
        ) : null}
        {onRestore ? (
          <Button
            variant="secondary"
            className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
            disabled={disabled}
            onClick={onRestore}
          >
            <RefreshCcw className="size-[14px]" data-icon="inline-start" />
            Restore
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">{card}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-[178px] border-[#dfe4e1] bg-[#fcfdfc] text-[#252522]">
        <ContextMenuGroup>
          <ContextMenuLabel className="max-w-[220px] truncate">
            {project.title}
          </ContextMenuLabel>
        </ContextMenuGroup>
        {onOpen ? (
          <ContextMenuItem disabled={disabled} onClick={onOpen}>
            <ExternalLink className="size-4" />
            Open
          </ContextMenuItem>
        ) : null}
        {onRestore ? (
          <ContextMenuItem disabled={disabled} onClick={onRestore}>
            <RefreshCcw className="size-4" />
            Restore
          </ContextMenuItem>
        ) : null}
        {onTrash ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={disabled}
              variant="destructive"
              onClick={onTrash}
            >
              <Trash2 className="size-4" />
              Delete to Trash
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function IconChrome({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={label}
        onClick={onClick}
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

function BeatsPage({
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

function WorkbenchPage({
  page,
  activeTab,
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
  const extraCards = Array.from({ length: additions }, (_, index) =>
    ({
      id: `draft-${page}-${index + 1}`,
      title:
        page === "Assets"
          ? `Imported reference ${index + 1}`
          : `${config.action} draft ${index + 1}`,
      persisted: false,
    }),
  );
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
          <div className="overflow-hidden rounded-xl border border-[#deded8] bg-[#fcfdfc] shadow-[0_8px_24px_rgb(42_42_37/0.08)]">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className="grid grid-cols-[44px_minmax(0,1fr)_88px_120px] items-center gap-3 border-b border-[#eeeeea] px-4 py-3 text-[13px] last:border-b-0"
              >
                <span className="text-[#8b8b84]">#{index + 1}</span>
                <strong className="truncate font-medium">
                  {scene.heading}
                </strong>
                <span className="text-[#777771]">
                  {scene.characterIds.length} chars
                </span>
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
        )
      ) : activeTab === "Overview" || page === "Assets" ? (
        <div className="grid grid-cols-3 gap-4 max-[1200px]:grid-cols-2">
          {filteredCards.map((card) => (
            <div
              key={card.id}
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

function CollaborationPanel({
  collaboration,
  message,
}: {
  collaboration: CollaborationState;
  message: string;
}) {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-xl border border-[#dce7dd] bg-[#f4faf5] p-3">
        <div className="text-[13px] font-semibold text-[#2e6e45]">
          Share link
        </div>
        <div className="mt-2 break-all rounded-md bg-[#fcfdfc]/90 px-2.5 py-2 text-[12px] leading-5 text-[#58635e]">
          {collaboration.shareUrl ?? "No share link yet"}
        </div>
      </div>

      {collaboration.collaborators.map((reviewer) => (
        <div
          key={reviewer.id}
          className="rounded-xl border border-[#e4e8e6] bg-[#fcfdfc] p-3"
        >
          <div className="flex items-center gap-2">
            <Avatar className="size-8 bg-[#eef3ef]">
              <AvatarFallback className="bg-transparent text-[11px] font-semibold text-[#2e6248]">
                {reviewer.initials}
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
        {message}
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
