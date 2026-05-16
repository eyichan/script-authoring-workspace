import "server-only";

import { randomUUID } from "node:crypto";

import {
  AssetTaskKind as PrismaAssetTaskKind,
  Prisma,
} from "@prisma/client";

import { deriveScriptEntities } from "@/lib/domain/screenplay";
import type {
  AssetTask,
  AssetTaskKind,
  Project,
  ProjectCollaborator,
  Script,
  ScriptBlock,
  ScriptBlockType,
  WorkspaceView,
} from "@/lib/domain/types";

import { prisma } from "./prisma";

export type WorkspaceSnapshot = {
  projects: Project[];
  workspace: WorkspaceView;
  activeProjectId: string;
};

export type ScriptMutationSnapshot = WorkspaceSnapshot & {
  activeBlockId?: string;
};

export type WorkbenchMutationSnapshot = WorkspaceSnapshot & {
  message: string;
};

export type CollaborationMutationSnapshot = WorkspaceSnapshot & {
  message: string;
};

const projectInclude = {
  share: true,
  collaborators: { orderBy: { createdAt: "asc" } },
  scripts: {
    orderBy: { createdAt: "asc" },
    take: 1,
    include: {
      blocks: { orderBy: { position: "asc" } },
      beats: { orderBy: { createdAt: "asc" } },
      props: { orderBy: { createdAt: "asc" } },
      assetTasks: { orderBy: { createdAt: "asc" } },
      characterProfiles: { orderBy: { createdAt: "asc" } },
      sceneProductionNotes: { orderBy: { createdAt: "asc" } },
      locationProfiles: { orderBy: { createdAt: "asc" } },
      outline: true,
    },
  },
} satisfies Prisma.ProjectInclude;

type ProjectWithWorkspace = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

const assetTaskKindToDomain: Record<PrismaAssetTaskKind, AssetTaskKind> = {
  movie_poster: "movie-poster",
  casting_poster: "casting-poster",
  concept_trailer: "concept-trailer",
  scene_dramatization: "scene-dramatization",
  director_roundtable: "director-roundtable",
  script_table_read: "script-table-read",
};

const assetTaskKindToPrisma: Record<AssetTaskKind, PrismaAssetTaskKind> = {
  "movie-poster": PrismaAssetTaskKind.movie_poster,
  "casting-poster": PrismaAssetTaskKind.casting_poster,
  "concept-trailer": PrismaAssetTaskKind.concept_trailer,
  "scene-dramatization": PrismaAssetTaskKind.scene_dramatization,
  "director-roundtable": PrismaAssetTaskKind.director_roundtable,
  "script-table-read": PrismaAssetTaskKind.script_table_read,
};

function serializeDate(date: Date): string {
  return date.toISOString();
}

function mapProject(project: ProjectWithWorkspace | ProjectRecord): Project {
  return {
    id: project.id,
    title: project.title,
    status: project.status,
    createdAt: serializeDate(project.createdAt),
    updatedAt: serializeDate(project.updatedAt),
    trashedAt: project.trashedAt ? serializeDate(project.trashedAt) : undefined,
  };
}

type ProjectRecord = Awaited<ReturnType<typeof listProjectRecords>>[number];

async function listProjectRecords() {
  return prisma.project.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
}

function mapScript(script: ProjectWithWorkspace["scripts"][number]): Script {
  return {
    id: script.id,
    projectId: script.projectId,
    title: script.title,
    createdAt: serializeDate(script.createdAt),
    updatedAt: serializeDate(script.updatedAt),
  };
}

function mapBlock(block: ProjectWithWorkspace["scripts"][number]["blocks"][number]): ScriptBlock {
  return {
    id: block.id,
    scriptId: block.scriptId,
    type: block.type,
    text: block.text,
    position: block.position,
    createdAt: serializeDate(block.createdAt),
    updatedAt: serializeDate(block.updatedAt),
  };
}

function mapAssetTask(
  task: ProjectWithWorkspace["scripts"][number]["assetTasks"][number],
): AssetTask {
  return {
    id: task.id,
    scriptId: task.scriptId,
    kind: assetTaskKindToDomain[task.kind],
    title: task.title,
    status: task.status,
    createdAt: serializeDate(task.createdAt),
  };
}

function mapCollaborator(
  collaborator: ProjectWithWorkspace["collaborators"][number],
): ProjectCollaborator {
  return {
    id: collaborator.id,
    projectId: collaborator.projectId,
    initials: collaborator.initials,
    role: collaborator.role,
    status: collaborator.status,
    createdAt: serializeDate(collaborator.createdAt),
  };
}

function mapWorkspace(project: ProjectWithWorkspace): WorkspaceView {
  const scriptRecord = project.scripts[0];

  if (!scriptRecord) {
    throw new Error(`Project ${project.id} does not have a script.`);
  }

  const script = mapScript(scriptRecord);
  const blocks = scriptRecord.blocks.map(mapBlock);
  const derived = deriveScriptEntities(script.id, blocks);

  return {
    project: mapProject(project),
    script,
    blocks,
    scenes: derived.scenes,
    characters: derived.characters,
    locations: derived.locations,
    beats: scriptRecord.beats.map((beat) => ({
      id: beat.id,
      scriptId: beat.scriptId,
      title: beat.title,
      description: beat.description,
      color: beat.color,
      durationMinutes: beat.durationMinutes,
      sortOrder: beat.sortOrder,
    })),
    props: scriptRecord.props.map((prop) => ({
      id: prop.id,
      scriptId: prop.scriptId,
      name: prop.name,
      themeColor: prop.themeColor,
      category: prop.category,
      description: prop.description,
      imageNote: prop.imageNote,
    })),
    assetTasks: scriptRecord.assetTasks.map(mapAssetTask),
    characterProfiles: scriptRecord.characterProfiles.map((profile) => ({
      id: profile.id,
      scriptId: profile.scriptId,
      characterId: profile.characterId,
      displayName: profile.displayName,
      color: profile.color,
      gender: profile.gender,
      age: profile.age,
      role: profile.role,
      bio: profile.bio,
      appearanceNotes: profile.appearanceNotes,
    })),
    sceneProductionNotes: scriptRecord.sceneProductionNotes.map((note) => ({
      id: note.id,
      scriptId: note.scriptId,
      sceneId: note.sceneId,
      description: note.description,
      artRequirements: note.artRequirements,
      stillStatus: note.stillStatus,
      videoStatus: note.videoStatus,
    })),
    locationProfiles: scriptRecord.locationProfiles.map((profile) => ({
      id: profile.id,
      scriptId: profile.scriptId,
      locationId: profile.locationId,
      displayName: profile.displayName,
      address: profile.address,
      description: profile.description,
      scoutingStatus: profile.scoutingStatus,
      ownerName: profile.ownerName,
      phone: profile.phone,
      email: profile.email,
      dailyRental: profile.dailyRental,
      deposit: profile.deposit,
      currency: profile.currency,
      availableFrom: profile.availableFrom,
      availableUntil: profile.availableUntil,
      shootingHours: profile.shootingHours,
      notes: profile.notes,
    })),
    outline: scriptRecord.outline
      ? {
          scriptId: scriptRecord.outline.scriptId,
          text: scriptRecord.outline.text,
        }
      : undefined,
    collaboration: {
      shareToken: project.share?.token,
      shareUrl: project.share ? `/share/${project.share.token}` : undefined,
      collaborators: project.collaborators.map(mapCollaborator),
    },
  };
}

async function getProjectWithWorkspace(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  });

  if (!project) {
    throw new Error(`Project ${projectId} was not found.`);
  }

  if (project.scripts.length > 0) {
    return project;
  }

  await prisma.script.create({
    data: {
      id: `script-${randomUUID()}`,
      projectId: project.id,
      title: project.title,
    },
  });

  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: projectInclude,
  });
}

async function createWorkspaceProject(title: string) {
  const projectId = `project-${randomUUID()}`;
  const scriptId = `script-${randomUUID()}`;

  await prisma.project.create({
    data: {
      id: projectId,
      title,
      collaborators: {
        create: {
          id: `collaborator-${randomUUID()}`,
          initials: "YI",
          role: "Owner",
          status: "Editing",
        },
      },
      scripts: {
        create: {
          id: scriptId,
          title,
        },
      },
    },
  });

  return projectId;
}

async function resequenceScriptBlocks(
  tx: Prisma.TransactionClient,
  blockIds: string[],
) {
  for (const [index, id] of blockIds.entries()) {
    await tx.scriptBlock.update({
      where: { id },
      data: { position: -(index + 1) },
    });
  }

  for (const [index, id] of blockIds.entries()) {
    await tx.scriptBlock.update({
      where: { id },
      data: { position: index + 1 },
    });
  }
}

async function ensureActiveProjectId(preferredProjectId?: string) {
  if (preferredProjectId) {
    const preferred = await prisma.project.findFirst({
      where: { id: preferredProjectId, status: "active" },
      select: { id: true },
    });

    if (preferred) return preferred.id;
  }

  const firstActive = await prisma.project.findFirst({
    where: { status: "active" },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (firstActive) return firstActive.id;

  return createWorkspaceProject("Untitled Script 1");
}

export async function getWorkspaceSnapshot(
  preferredProjectId?: string,
): Promise<WorkspaceSnapshot> {
  const activeProjectId = await ensureActiveProjectId(preferredProjectId);
  const [projects, project] = await Promise.all([
    listProjectRecords(),
    getProjectWithWorkspace(activeProjectId),
  ]);

  return {
    projects: projects.map(mapProject),
    workspace: mapWorkspace(project),
    activeProjectId,
  };
}

export async function getWorkspaceByProjectId(projectId: string): Promise<WorkspaceSnapshot> {
  return getWorkspaceSnapshot(projectId);
}

export async function getSharedWorkspaceByToken(
  token: string,
): Promise<WorkspaceView | null> {
  const share = await prisma.projectShare.findUnique({
    where: { token },
    include: {
      project: {
        include: projectInclude,
      },
    },
  });

  if (!share) {
    return null;
  }

  return mapWorkspace(share.project);
}

export async function createProjectSnapshot(): Promise<WorkspaceSnapshot> {
  const count = await prisma.project.count();
  const projectId = await createWorkspaceProject(`Untitled Script ${count + 1}`);

  return getWorkspaceSnapshot(projectId);
}

export async function trashProjectSnapshot(
  projectId: string,
): Promise<WorkspaceSnapshot> {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "trashed",
      trashedAt: new Date(),
    },
  });

  return getWorkspaceSnapshot();
}

export async function restoreProjectSnapshot(
  projectId: string,
): Promise<WorkspaceSnapshot> {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "active",
      trashedAt: null,
    },
  });

  return getWorkspaceSnapshot(projectId);
}

export async function renameProjectSnapshot({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}): Promise<WorkspaceSnapshot> {
  const nextTitle = title.trim();

  if (!nextTitle) {
    throw new Error("Project title cannot be empty.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: { title: nextTitle },
    });

    const script = await tx.script.findFirst({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (script) {
      await tx.script.update({
        where: { id: script.id },
        data: { title: nextTitle },
      });
    }
  });

  return getWorkspaceSnapshot(projectId);
}

export async function insertScriptBlockSnapshot({
  projectId,
  scriptId,
  type,
  afterBlockId,
}: {
  projectId: string;
  scriptId: string;
  type: ScriptBlockType;
  afterBlockId?: string;
}): Promise<ScriptMutationSnapshot> {
  const blockId = `block-${randomUUID()}`;

  await prisma.$transaction(async (tx) => {
    const blocks = await tx.scriptBlock.findMany({
      where: { scriptId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const afterIndex = afterBlockId
      ? blocks.findIndex((block) => block.id === afterBlockId)
      : blocks.length - 1;
    const insertIndex = afterIndex >= 0 ? afterIndex + 1 : blocks.length;

    await tx.scriptBlock.create({
      data: {
        id: blockId,
        scriptId,
        type,
        text: "",
        position: blocks.length + 1,
      },
    });

    const orderedIds = blocks.map((block) => block.id);
    orderedIds.splice(insertIndex, 0, blockId);
    await resequenceScriptBlocks(tx, orderedIds);
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    activeBlockId: blockId,
  };
}

export async function commitAndInsertScriptBlockSnapshot({
  projectId,
  scriptId,
  type,
  afterBlockId,
  text,
}: {
  projectId: string;
  scriptId: string;
  type: ScriptBlockType;
  afterBlockId: string;
  text: string;
}): Promise<ScriptMutationSnapshot> {
  const blockId = `block-${randomUUID()}`;

  await prisma.$transaction(async (tx) => {
    const source = await tx.scriptBlock.findUniqueOrThrow({
      where: { id: afterBlockId },
      select: { scriptId: true },
    });

    if (source.scriptId !== scriptId) {
      throw new Error(`Block ${afterBlockId} does not belong to script ${scriptId}.`);
    }

    await tx.scriptBlock.update({
      where: { id: afterBlockId },
      data: { text },
    });

    const blocks = await tx.scriptBlock.findMany({
      where: { scriptId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const afterIndex = blocks.findIndex((block) => block.id === afterBlockId);
    const insertIndex = afterIndex >= 0 ? afterIndex + 1 : blocks.length;

    await tx.scriptBlock.create({
      data: {
        id: blockId,
        scriptId,
        type,
        text: "",
        position: blocks.length + 1,
      },
    });

    const orderedIds = blocks.map((block) => block.id);
    orderedIds.splice(insertIndex, 0, blockId);
    await resequenceScriptBlocks(tx, orderedIds);
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    activeBlockId: blockId,
  };
}

export async function updateScriptBlockSnapshot({
  projectId,
  blockId,
  text,
}: {
  projectId: string;
  blockId: string;
  text: string;
}): Promise<ScriptMutationSnapshot> {
  await prisma.scriptBlock.update({
    where: { id: blockId },
    data: { text },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    activeBlockId: blockId,
  };
}

export async function duplicateScriptBlockSnapshot({
  projectId,
  blockId,
}: {
  projectId: string;
  blockId: string;
}): Promise<ScriptMutationSnapshot> {
  const duplicateId = `block-${randomUUID()}`;

  await prisma.$transaction(async (tx) => {
    const source = await tx.scriptBlock.findUniqueOrThrow({
      where: { id: blockId },
    });
    const blocks = await tx.scriptBlock.findMany({
      where: { scriptId: source.scriptId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const sourceIndex = blocks.findIndex((block) => block.id === blockId);

    await tx.scriptBlock.create({
      data: {
        id: duplicateId,
        scriptId: source.scriptId,
        type: source.type,
        text: source.text,
        position: blocks.length + 1,
      },
    });

    const orderedIds = blocks.map((block) => block.id);
    orderedIds.splice(sourceIndex + 1, 0, duplicateId);
    await resequenceScriptBlocks(tx, orderedIds);
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    activeBlockId: duplicateId,
  };
}

export async function deleteScriptBlockSnapshot({
  projectId,
  blockId,
}: {
  projectId: string;
  blockId: string;
}): Promise<ScriptMutationSnapshot> {
  let fallbackBlockId: string | undefined;

  await prisma.$transaction(async (tx) => {
    const source = await tx.scriptBlock.findUniqueOrThrow({
      where: { id: blockId },
      select: { scriptId: true },
    });
    const blocks = await tx.scriptBlock.findMany({
      where: { scriptId: source.scriptId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const sourceIndex = blocks.findIndex((block) => block.id === blockId);
    const remainingIds = blocks
      .filter((block) => block.id !== blockId)
      .map((block) => block.id);
    fallbackBlockId =
      remainingIds[sourceIndex] ?? remainingIds[sourceIndex - 1] ?? undefined;

    await tx.scriptBlock.delete({ where: { id: blockId } });
    await resequenceScriptBlocks(tx, remainingIds);
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    activeBlockId: fallbackBlockId,
  };
}

export async function createBeatSnapshot({
  projectId,
  scriptId,
}: {
  projectId: string;
  scriptId: string;
}): Promise<WorkbenchMutationSnapshot> {
  const sequence = (await prisma.beat.count({ where: { scriptId } })) + 1;
  const title = `Beat ${sequence}: Pressure Turn`;

  await prisma.beat.create({
    data: {
      id: `beat-${randomUUID()}`,
      scriptId,
      title,
      description: "A persisted outline beat created from the Beats page.",
      color: "racing-green",
      durationMinutes: 8,
      sortOrder: sequence,
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: `${title} created as a persisted beat.`,
  };
}

export async function createPropSnapshot({
  projectId,
  scriptId,
}: {
  projectId: string;
  scriptId: string;
}): Promise<WorkbenchMutationSnapshot> {
  const sequence = (await prisma.prop.count({ where: { scriptId } })) + 1;
  const name = `Continuity Tag ${sequence}`;

  await prisma.prop.create({
    data: {
      id: `prop-${randomUUID()}`,
      scriptId,
      name,
      themeColor: "racing-green",
      category: "Continuity",
      description: "A persisted prop record created from the Props page.",
      imageNote: "Neutral table reference, labeled for continuity.",
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: `${name} added to the persisted prop book.`,
  };
}

export async function importAssetSnapshot({
  projectId,
  scriptId,
}: {
  projectId: string;
  scriptId: string;
}): Promise<WorkbenchMutationSnapshot> {
  const sequence = (await prisma.assetTask.count({ where: { scriptId } })) + 1;
  const isVideo = sequence % 2 === 0;
  const kind: AssetTaskKind = isVideo ? "concept-trailer" : "scene-dramatization";
  const title = isVideo
    ? `Imported video reference ${sequence}`
    : `Imported still reference ${sequence}`;

  await prisma.assetTask.create({
    data: {
      id: `asset-${randomUUID()}`,
      scriptId,
      kind: assetTaskKindToPrisma[kind],
      title,
      status: "done",
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: `${title} imported into the persisted asset library.`,
  };
}

export async function deleteBeatSnapshot({
  projectId,
  scriptId,
  beatId,
}: {
  projectId: string;
  scriptId: string;
  beatId: string;
}): Promise<WorkbenchMutationSnapshot> {
  const deleted = await prisma.beat.deleteMany({
    where: { id: beatId, scriptId },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: deleted.count
      ? "Beat removed from the persisted outline."
      : "Beat was already removed.",
  };
}

export async function deletePropSnapshot({
  projectId,
  scriptId,
  propId,
}: {
  projectId: string;
  scriptId: string;
  propId: string;
}): Promise<WorkbenchMutationSnapshot> {
  const deleted = await prisma.prop.deleteMany({
    where: { id: propId, scriptId },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: deleted.count
      ? "Prop removed from the persisted prop book."
      : "Prop was already removed.",
  };
}

export async function deleteAssetSnapshot({
  projectId,
  scriptId,
  assetId,
}: {
  projectId: string;
  scriptId: string;
  assetId: string;
}): Promise<WorkbenchMutationSnapshot> {
  const deleted = await prisma.assetTask.deleteMany({
    where: { id: assetId, scriptId },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: deleted.count
      ? "Asset reference removed from the persisted library."
      : "Asset reference was already removed.",
  };
}

export async function updateBeatSnapshot({
  projectId,
  scriptId,
  beatId,
  title,
}: {
  projectId: string;
  scriptId: string;
  beatId: string;
  title: string;
}): Promise<WorkbenchMutationSnapshot> {
  const nextTitle = title.trim();

  if (!nextTitle) {
    throw new Error("Beat title cannot be empty.");
  }

  const updated = await prisma.beat.updateMany({
    where: { id: beatId, scriptId },
    data: { title: nextTitle },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: updated.count
      ? `${nextTitle} saved in the persisted beat outline.`
      : "Beat was already removed.",
  };
}

export async function updatePropSnapshot({
  projectId,
  scriptId,
  propId,
  name,
}: {
  projectId: string;
  scriptId: string;
  propId: string;
  name: string;
}): Promise<WorkbenchMutationSnapshot> {
  const nextName = name.trim();

  if (!nextName) {
    throw new Error("Prop name cannot be empty.");
  }

  const updated = await prisma.prop.updateMany({
    where: { id: propId, scriptId },
    data: { name: nextName },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: updated.count
      ? `${nextName} saved in the persisted prop book.`
      : "Prop was already removed.",
  };
}

export async function updateAssetSnapshot({
  projectId,
  scriptId,
  assetId,
  title,
}: {
  projectId: string;
  scriptId: string;
  assetId: string;
  title: string;
}): Promise<WorkbenchMutationSnapshot> {
  const nextTitle = title.trim();

  if (!nextTitle) {
    throw new Error("Asset title cannot be empty.");
  }

  const updated = await prisma.assetTask.updateMany({
    where: { id: assetId, scriptId },
    data: { title: nextTitle },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: updated.count
      ? `${nextTitle} saved in the persisted asset library.`
      : "Asset reference was already removed.",
  };
}

export async function updateBeatDetailSnapshot({
  projectId,
  scriptId,
  beatId,
  title,
  description,
  color,
  durationMinutes,
}: {
  projectId: string;
  scriptId: string;
  beatId: string;
  title: string;
  description: string;
  color: string;
  durationMinutes: number;
}): Promise<WorkbenchMutationSnapshot> {
  const nextTitle = title.trim();

  if (!nextTitle) {
    throw new Error("Beat title cannot be empty.");
  }

  const updated = await prisma.beat.updateMany({
    where: { id: beatId, scriptId },
    data: {
      title: nextTitle,
      description,
      color,
      durationMinutes: Math.max(1, Math.round(durationMinutes)),
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: updated.count
      ? `${nextTitle} beat details saved.`
      : "Beat was already removed.",
  };
}

export async function updatePropDetailSnapshot({
  projectId,
  scriptId,
  propId,
  name,
  themeColor,
  category,
  description,
  imageNote,
}: {
  projectId: string;
  scriptId: string;
  propId: string;
  name: string;
  themeColor: string;
  category: string;
  description: string;
  imageNote: string;
}): Promise<WorkbenchMutationSnapshot> {
  const nextName = name.trim();

  if (!nextName) {
    throw new Error("Prop name cannot be empty.");
  }

  const updated = await prisma.prop.updateMany({
    where: { id: propId, scriptId },
    data: {
      name: nextName,
      themeColor,
      category,
      description,
      imageNote,
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: updated.count
      ? `${nextName} prop details saved.`
      : "Prop was already removed.",
  };
}

export async function upsertCharacterProfileSnapshot({
  projectId,
  scriptId,
  characterId,
  displayName,
  color,
  gender,
  age,
  role,
  bio,
  appearanceNotes,
}: {
  projectId: string;
  scriptId: string;
  characterId: string;
  displayName: string;
  color: string;
  gender: string;
  age: string;
  role: string;
  bio: string;
  appearanceNotes: string;
}): Promise<WorkbenchMutationSnapshot> {
  const nextName = displayName.trim();

  if (!nextName) {
    throw new Error("Character name cannot be empty.");
  }

  await prisma.characterProfile.upsert({
    where: { scriptId_characterId: { scriptId, characterId } },
    update: {
      displayName: nextName,
      color,
      gender,
      age,
      role,
      bio,
      appearanceNotes,
    },
    create: {
      id: `character-profile-${randomUUID()}`,
      scriptId,
      characterId,
      displayName: nextName,
      color,
      gender,
      age,
      role,
      bio,
      appearanceNotes,
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: `${nextName} profile saved.`,
  };
}

export async function upsertSceneProductionNoteSnapshot({
  projectId,
  scriptId,
  sceneId,
  description,
  artRequirements,
  stillStatus,
  videoStatus,
}: {
  projectId: string;
  scriptId: string;
  sceneId: string;
  description: string;
  artRequirements: string;
  stillStatus: string;
  videoStatus: string;
}): Promise<WorkbenchMutationSnapshot> {
  await prisma.sceneProductionNote.upsert({
    where: { scriptId_sceneId: { scriptId, sceneId } },
    update: {
      description,
      artRequirements,
      stillStatus,
      videoStatus,
    },
    create: {
      id: `scene-note-${randomUUID()}`,
      scriptId,
      sceneId,
      description,
      artRequirements,
      stillStatus,
      videoStatus,
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: "Scene production notes saved.",
  };
}

export async function upsertLocationProfileSnapshot({
  projectId,
  scriptId,
  locationId,
  displayName,
  address,
  description,
  scoutingStatus,
  ownerName,
  phone,
  email,
  dailyRental,
  deposit,
  currency,
  availableFrom,
  availableUntil,
  shootingHours,
  notes,
}: {
  projectId: string;
  scriptId: string;
  locationId: string;
  displayName: string;
  address: string;
  description: string;
  scoutingStatus: string;
  ownerName: string;
  phone: string;
  email: string;
  dailyRental: string;
  deposit: string;
  currency: string;
  availableFrom: string;
  availableUntil: string;
  shootingHours: string;
  notes: string;
}): Promise<WorkbenchMutationSnapshot> {
  const nextName = displayName.trim();

  if (!nextName) {
    throw new Error("Location name cannot be empty.");
  }

  await prisma.locationProfile.upsert({
    where: { scriptId_locationId: { scriptId, locationId } },
    update: {
      displayName: nextName,
      address,
      description,
      scoutingStatus,
      ownerName,
      phone,
      email,
      dailyRental,
      deposit,
      currency,
      availableFrom,
      availableUntil,
      shootingHours,
      notes,
    },
    create: {
      id: `location-profile-${randomUUID()}`,
      scriptId,
      locationId,
      displayName: nextName,
      address,
      description,
      scoutingStatus,
      ownerName,
      phone,
      email,
      dailyRental,
      deposit,
      currency,
      availableFrom,
      availableUntil,
      shootingHours,
      notes,
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: `${nextName} location profile saved.`,
  };
}

export async function updateScriptOutlineSnapshot({
  projectId,
  scriptId,
  text,
}: {
  projectId: string;
  scriptId: string;
  text: string;
}): Promise<WorkbenchMutationSnapshot> {
  await prisma.scriptOutline.upsert({
    where: { scriptId },
    update: { text },
    create: {
      scriptId,
      text,
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: "Script outline saved.",
  };
}

export async function createInviteSnapshot({
  projectId,
}: {
  projectId: string;
}): Promise<CollaborationMutationSnapshot> {
  const token = randomUUID().replace(/-/g, "");
  const collaboratorCount = await prisma.projectCollaborator.count({
    where: { projectId },
  });
  const reviewerNumber = collaboratorCount + 1;

  await prisma.$transaction(async (tx) => {
    await tx.projectShare.upsert({
      where: { projectId },
      update: {},
      create: {
        projectId,
        token,
      },
    });

    await tx.projectCollaborator.create({
      data: {
        id: `collaborator-${randomUUID()}`,
        projectId,
        initials: `R${Math.min(reviewerNumber, 9)}`,
        role: `Reviewer ${reviewerNumber}`,
        status: "Invited",
      },
    });
  });

  const snapshot = await getWorkspaceSnapshot(projectId);
  const shareUrl = snapshot.workspace.collaboration.shareUrl ?? "/share/pending";

  return {
    ...snapshot,
    message: `Invite link ready: ${shareUrl}`,
  };
}

export async function removeCollaboratorSnapshot({
  projectId,
  collaboratorId,
}: {
  projectId: string;
  collaboratorId: string;
}): Promise<CollaborationMutationSnapshot> {
  const deleted = await prisma.projectCollaborator.deleteMany({
    where: {
      id: collaboratorId,
      projectId,
      NOT: { role: "Owner" },
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: deleted.count
      ? "Reviewer removed from the collaboration list."
      : "Reviewer was already removed or cannot be removed.",
  };
}

export async function updateCollaboratorSnapshot({
  projectId,
  collaboratorId,
  role,
  status,
}: {
  projectId: string;
  collaboratorId: string;
  role: string;
  status: string;
}): Promise<CollaborationMutationSnapshot> {
  const nextRole = role.trim();
  const nextStatus = status.trim();

  if (!nextRole) {
    throw new Error("Collaborator role cannot be empty.");
  }

  if (!nextStatus) {
    throw new Error("Collaborator status cannot be empty.");
  }

  if (nextRole.toLowerCase() === "owner") {
    throw new Error("Owner role cannot be assigned from reviewer management.");
  }

  const updated = await prisma.projectCollaborator.updateMany({
    where: {
      id: collaboratorId,
      projectId,
      NOT: { role: "Owner" },
    },
    data: {
      role: nextRole,
      status: nextStatus,
    },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: updated.count
      ? `${nextRole} collaboration state saved.`
      : "Reviewer was already removed or cannot be edited.",
  };
}

export async function revokeProjectShareSnapshot({
  projectId,
}: {
  projectId: string;
}): Promise<CollaborationMutationSnapshot> {
  const deleted = await prisma.projectShare.deleteMany({
    where: { projectId },
  });

  return {
    ...(await getWorkspaceSnapshot(projectId)),
    message: deleted.count
      ? "Share link revoked. Existing review links now return not found."
      : "No active share link to revoke.",
  };
}
