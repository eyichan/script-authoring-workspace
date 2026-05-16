import type { ScriptBlock, WorkspaceView } from "./types";
import { deriveScriptEntities } from "./screenplay";

const createdAt = "2026-05-15T00:00:00.000Z";

const blocks: ScriptBlock[] = [
  {
    id: "block-1",
    scriptId: "script-demo",
    type: "transition",
    text: "FADE IN:",
    position: 1,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "block-2",
    scriptId: "script-demo",
    type: "scene",
    text: "INT. MOON BASE - NIGHT",
    position: 2,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "block-3",
    scriptId: "script-demo",
    type: "action",
    text: "Earth hangs blue above the cracked observation glass.",
    position: 3,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "block-4",
    scriptId: "script-demo",
    type: "character",
    text: "COMMANDER LIN",
    position: 4,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "block-5",
    scriptId: "script-demo",
    type: "dialogue",
    text: "We have one hour before sunrise hits the dome.",
    position: 5,
    createdAt,
    updatedAt: createdAt,
  },
];

const derived = deriveScriptEntities("script-demo", blocks);

export const seedWorkspace: WorkspaceView = {
  project: {
    id: "project-demo",
    title: "Codex Workflow Test",
    status: "active",
    createdAt,
    updatedAt: createdAt,
  },
  script: {
    id: "script-demo",
    projectId: "project-demo",
    title: "Codex Workflow Test",
    createdAt,
    updatedAt: createdAt,
  },
  blocks,
  scenes: derived.scenes,
  characters: derived.characters,
  locations: derived.locations,
  beats: [
    {
      id: "beat-1",
      scriptId: "script-demo",
      title: "Opening Signal",
      description: "The crew realizes sunrise will expose the Moon Base dome.",
      color: "racing-green",
      durationMinutes: 10,
      sortOrder: 1,
    },
  ],
  props: [
    {
      id: "prop-1",
      scriptId: "script-demo",
      name: "Cracked Observation Glass",
      themeColor: "racing-green",
      category: "Set Dressing",
      description: "A damaged transparent dome panel above the command deck.",
      imageNote: "Cold blue rim light, hairline fractures, moon dust.",
    },
  ],
  assetTasks: [],
  characterProfiles: [],
  sceneProductionNotes: [],
  locationProfiles: [],
  outline: {
    scriptId: "script-demo",
    text: "",
  },
  collaboration: {
    collaborators: [
      {
        id: "collaborator-owner-demo",
        projectId: "project-demo",
        initials: "YI",
        role: "Owner",
        status: "Editing",
        createdAt,
      },
    ],
  },
};
