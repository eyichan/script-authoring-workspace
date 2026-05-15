export type ScriptBlockType =
  | "scene"
  | "action"
  | "character"
  | "paren"
  | "dialogue"
  | "transition"
  | "comment"
  | "subtitle";

export type ProjectStatus = "active" | "trashed";

export type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  trashedAt?: string;
};

export type Script = {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ScriptBlock = {
  id: string;
  scriptId: string;
  type: ScriptBlockType;
  text: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type SceneHeadingParts = {
  prefix: string;
  locationName: string;
  timeOfDay: string;
};

export type DerivedScene = {
  id: string;
  scriptId: string;
  sourceBlockId: string;
  heading: string;
  prefix: string;
  locationName: string;
  timeOfDay: string;
  position: number;
  characterIds: string[];
  dialogueLineCount: number;
  blockCount: number;
};

export type DerivedCharacter = {
  id: string;
  scriptId: string;
  canonicalName: string;
  displayName: string;
  sourceBlockIds: string[];
  sceneIds: string[];
  dialogueLineCount: number;
};

export type DerivedLocation = {
  id: string;
  scriptId: string;
  canonicalName: string;
  displayName: string;
  sceneIds: string[];
  characterIds: string[];
};

export type Beat = {
  id: string;
  scriptId: string;
  title: string;
  description: string;
  color: string;
  durationMinutes: number;
};

export type Prop = {
  id: string;
  scriptId: string;
  name: string;
  category: string;
  description: string;
  imageNote: string;
};

export type AssetTaskKind =
  | "movie-poster"
  | "casting-poster"
  | "concept-trailer"
  | "scene-dramatization"
  | "director-roundtable"
  | "script-table-read";

export type AssetTaskStatus = "queued" | "running" | "done" | "failed";

export type AssetTask = {
  id: string;
  scriptId: string;
  kind: AssetTaskKind;
  title: string;
  status: AssetTaskStatus;
  createdAt: string;
};

export type WorkspaceView = {
  project: Project;
  script: Script;
  blocks: ScriptBlock[];
  scenes: DerivedScene[];
  characters: DerivedCharacter[];
  locations: DerivedLocation[];
  beats: Beat[];
  props: Prop[];
  assetTasks: AssetTask[];
};
