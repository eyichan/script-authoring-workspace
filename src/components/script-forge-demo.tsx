"use client";

import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import {
  createProjectAction,
  openProjectAction,
  renameProjectAction,
  restoreProjectAction,
  trashProjectAction,
} from "@/app/actions/projects";
import {
  createInviteAction,
  removeCollaboratorAction,
  revokeShareAction,
  updateCollaboratorAction,
} from "@/app/actions/collaboration";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  InspectorPanel,
  type ExportFormat,
  type InspectorTab,
  type PaginationMode,
} from "@/components/workspace/inspector-panel";
import { ProjectLibrary } from "@/components/workspace/project-library";
import {
  ScriptEditorCanvas,
  type BlockInputElement,
  type ToolLabel,
} from "@/components/workspace/script-editor-canvas";
import {
  BeatsPage,
  LockedStoryboard,
  WorkbenchPage,
  workbenchConfig,
  type WorkbenchCard,
  type WorkbenchPageName,
} from "@/components/workspace/workbench-pages";
import {
  WorkspaceMainHeader,
  WorkspaceTopBar,
  type EditorTab,
} from "@/components/workspace/workspace-headers";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { buildScriptExport } from "@/lib/domain/exports";
import {
  deriveScriptEntities,
  formatSceneHeading,
  scenePrefixOptions,
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
  Prop,
  Project,
  SceneHeadingParts,
  Script,
  ScriptBlock,
  ScriptBlockType,
  WorkspaceView,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

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

function isWorkbenchPage(page: PageName): page is WorkbenchPageName {
  return page !== "Script" && page !== "Beats" && page !== "Storyboard";
}

function normalizeBlockText(type: ScriptBlockType, value: string): string {
  if (type === "scene" || type === "character" || type === "transition") {
    return value.toUpperCase();
  }

  return value;
}

function getSceneDraft(text: string): SceneHeadingParts {
  const parsed = parseSceneHeading(text);
  const parsedPrefix = scenePrefixOptions.some(
    (option) => option.value === parsed?.prefix,
  )
    ? parsed?.prefix
    : undefined;

  return {
    prefix: parsedPrefix ?? "INT",
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
  const skipBlurPersistBlockIds = useRef<Set<string>>(new Set());
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

  const getCurrentBlockInputText = (
    block: ScriptBlock,
    input: BlockInputElement,
  ) => {
    if (block.type === "scene") {
      return buildSceneHeading({
        ...(sceneDrafts[block.id] ?? getSceneDraft(block.text)),
        locationName: input.value,
      });
    }

    return normalizeBlockText(block.type, input.value);
  };

  const handleBlockInputBlur = (block: ScriptBlock, input: BlockInputElement) => {
    const text = getCurrentBlockInputText(block, input);

    if (skipBlurPersistBlockIds.current.delete(block.id)) {
      return;
    }

    handlePersistScriptBlockText(block.id, text);
  };

  const handleBlockKeyDown = (
    block: ScriptBlock,
    event: KeyboardEvent<BlockInputElement>,
  ) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    const nextTool = nextToolByBlockType[block.type];
    const nextType = toolToBlockType[nextTool];
    const currentText = getCurrentBlockInputText(block, event.currentTarget);

    skipBlurPersistBlockIds.current.add(block.id);
    setActiveTool(nextTool);
    void runScriptMutation(
      () =>
        commitAndInsertScriptBlockAction({
          projectId: activeProject.id,
          scriptId: script.id,
          type: nextType,
          afterBlockId: block.id,
          text: currentText,
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
        ? `PDF export downloaded as ${exportPackage.filename}.`
        : `${exportLabels[exportFormat]} export downloaded as ${exportPackage.filename}.`,
    );
  };

  const handleCreateInvite = () => {
    void runCollaborationMutation(() => createInviteAction(activeProject.id));
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    void runCollaborationMutation(() =>
      removeCollaboratorAction({
        projectId: activeProject.id,
        collaboratorId,
      }),
    );
  };

  const handleUpdateCollaborator = (
    collaboratorId: string,
    role: string,
    status: string,
  ) => {
    void runCollaborationMutation(() =>
      updateCollaboratorAction({
        projectId: activeProject.id,
        collaboratorId,
        role,
        status,
      }),
    );
  };

  const handleRevokeShare = () => {
    void runCollaborationMutation(() => revokeShareAction(activeProject.id));
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f4f6f5] text-[#242421]">
      <WorkspaceTopBar
        collaborationMutationPending={collaborationMutationPending}
        onCreateInvite={handleCreateInvite}
        onOpenProjects={() => setWorkspaceMode("projects")}
      />

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
        <WorkspaceSidebar
          activePage={activePage}
          activeProject={activeProject}
          activeScene={activeScene}
          projectMutationPending={projectMutationPending}
          projectTitleValue={projectTitleValue}
          sectionTitle={sidebarSectionTitle}
          sidebarItems={sidebarItems}
          onOpenProjects={() => setWorkspaceMode("projects")}
          onRenameProject={handleRenameProject}
          onSelectPage={(page) => {
            setActivePage(page);
            if (page !== "Script") setEditorTab("script");
          }}
          onSelectSidebarItem={(itemId) => {
            if (activePage === "Script" || activePage === "Scenes") {
              focusSourceBlock(itemId);
              return;
            }

            setActiveScene(itemId);
          }}
          onSetProjectTitleDraft={setProjectTitleDraft}
        />

        <div className="flex min-w-0 flex-1 gap-2">
        <main
          className={cn(
            "grid min-h-0 min-w-0 flex-1 grid-rows-[48px_1fr] overflow-hidden rounded-[24px] border border-[#ddddda] bg-[#fcfdfc] shadow-sm max-[900px]:h-auto max-[900px]:grid-rows-[auto_1fr]",
          )}
        >
          <WorkspaceMainHeader
            activePage={activePage}
            editorMode={editorMode}
            editorTab={editorTab}
            pageActionCount={pageActionCount}
            workbenchActionLabel={
              isWorkbenchPage(activePage) ? workbenchConfig[activePage].action : ""
            }
            workbenchMutationPending={workbenchMutationPending}
            workbenchTab={
              isWorkbenchPage(activePage) ? workbenchTabs[activePage] : ""
            }
            onCreateBeat={handleCreateBeat}
            onSetEditorTab={setEditorTab}
            onSetWorkbenchTab={(tab) => {
              if (!isWorkbenchPage(activePage)) return;
              setWorkbenchTabs((current) => ({
                ...current,
                [activePage]: tab,
              }));
            }}
            onWorkbenchAction={handleWorkbenchAction}
          />

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
              <ScriptEditorCanvas
                activeTool={activeTool}
                blocks={blocks}
                characters={derived.characters}
                pendingFocusBlockId={pendingFocusBlockId}
                sceneDrafts={sceneDrafts}
                scriptMutationPending={scriptMutationPending}
                getSceneDraft={getSceneDraft}
                onBlockBlur={handleBlockInputBlur}
                onBlockChange={handleUpdateScriptBlock}
                onBlockFocus={(blockId, tool) => {
                  setActiveBlockId(blockId);
                  setActiveTool(tool);
                }}
                onBlockKeyDown={handleBlockKeyDown}
                onDeleteBlock={handleDeleteScriptBlock}
                onDuplicateBlock={handleDuplicateScriptBlock}
                onInsertBlock={handleInsertScriptBlock}
                onOpenBlock={focusBlockById}
                onPendingFocusHandled={() => setPendingFocusBlockId(null)}
                onScenePartChange={handleScenePartChange}
              />
            )}
          </ScrollArea>
        </main>

        {editorMode ? (
          <InspectorPanel
            activeTool={activeTool}
            collaboration={collaboration}
            collaborationMessage={collaborationMessage}
            collaborationMutationPending={collaborationMutationPending}
            exportFormat={exportFormat}
            inspectorTab={inspectorTab}
            lastExport={lastExport}
            paginationMode={paginationMode}
            productionMessage={productionMessage}
            stats={stats}
            onCreateBreakdown={() => {
              setBreakdownReady(true);
              setProductionMessage(
                "Breakdown generated: scenes, props, and references are ready.",
              );
            }}
            onCreateShotList={() => {
              setShotListReady(true);
              setProductionMessage(
                "Shot list created: 24 shot suggestions added to scene units.",
              );
            }}
            onExportScript={handleExportScript}
            onRemoveCollaborator={handleRemoveCollaborator}
            onRevokeShare={handleRevokeShare}
            onSetExportFormat={setExportFormat}
            onSetInspectorTab={setInspectorTab}
            onSetPaginationMode={setPaginationMode}
            onUpdateCollaborator={handleUpdateCollaborator}
          />
        ) : null}
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
