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
  Script,
  ScriptBlock,
  WorkspaceView,
} from "@/lib/domain/types";

import { prisma } from "./prisma";

export type WorkspaceSnapshot = {
  projects: Project[];
  workspace: WorkspaceView;
  activeProjectId: string;
};

const projectInclude = {
  scripts: {
    orderBy: { createdAt: "asc" },
    take: 1,
    include: {
      blocks: { orderBy: { position: "asc" } },
      beats: { orderBy: { createdAt: "asc" } },
      props: { orderBy: { createdAt: "asc" } },
      assetTasks: { orderBy: { createdAt: "asc" } },
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
    })),
    props: scriptRecord.props.map((prop) => ({
      id: prop.id,
      scriptId: prop.scriptId,
      name: prop.name,
      category: prop.category,
      description: prop.description,
      imageNote: prop.imageNote,
    })),
    assetTasks: scriptRecord.assetTasks.map(mapAssetTask),
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
