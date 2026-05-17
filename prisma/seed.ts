import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  AssetTaskKind as PrismaAssetTaskKind,
  PrismaClient,
} from "@prisma/client";

import { seedWorkspace } from "../src/lib/domain/seed";
import type { AssetTaskKind as DomainAssetTaskKind } from "../src/lib/domain/types";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const assetTaskKindMap: Record<DomainAssetTaskKind, PrismaAssetTaskKind> = {
  "movie-poster": PrismaAssetTaskKind.movie_poster,
  "casting-poster": PrismaAssetTaskKind.casting_poster,
  "concept-trailer": PrismaAssetTaskKind.concept_trailer,
  "scene-dramatization": PrismaAssetTaskKind.scene_dramatization,
  "director-roundtable": PrismaAssetTaskKind.director_roundtable,
  "script-table-read": PrismaAssetTaskKind.script_table_read,
};

async function main() {
  const workspace = seedWorkspace;

  await prisma.project.upsert({
    where: { id: workspace.project.id },
    update: {
      title: workspace.project.title,
      status: workspace.project.status,
      trashedAt: workspace.project.trashedAt
        ? new Date(workspace.project.trashedAt)
        : null,
    },
    create: {
      id: workspace.project.id,
      title: workspace.project.title,
      status: workspace.project.status,
      createdAt: new Date(workspace.project.createdAt),
      updatedAt: new Date(workspace.project.updatedAt),
      trashedAt: workspace.project.trashedAt
        ? new Date(workspace.project.trashedAt)
        : null,
    },
  });

  await prisma.script.upsert({
    where: { id: workspace.script.id },
    update: {
      title: workspace.script.title,
      projectId: workspace.script.projectId,
    },
    create: {
      id: workspace.script.id,
      projectId: workspace.script.projectId,
      title: workspace.script.title,
      createdAt: new Date(workspace.script.createdAt),
      updatedAt: new Date(workspace.script.updatedAt),
    },
  });

  for (const block of workspace.blocks) {
    await prisma.scriptBlock.upsert({
      where: { id: block.id },
      update: {
        type: block.type,
        text: block.text,
        position: block.position,
      },
      create: {
        id: block.id,
        scriptId: block.scriptId,
        type: block.type,
        text: block.text,
        position: block.position,
        createdAt: new Date(block.createdAt),
        updatedAt: new Date(block.updatedAt),
      },
    });
  }

  for (const beat of workspace.beats) {
    await prisma.beat.upsert({
      where: { id: beat.id },
      update: {
        title: beat.title,
        description: beat.description,
        color: beat.color,
        durationMinutes: beat.durationMinutes,
        sortOrder: beat.sortOrder,
      },
      create: {
        id: beat.id,
        scriptId: beat.scriptId,
        title: beat.title,
        description: beat.description,
        color: beat.color,
        durationMinutes: beat.durationMinutes,
        sortOrder: beat.sortOrder,
      },
    });
  }

  for (const prop of workspace.props) {
    await prisma.prop.upsert({
      where: { id: prop.id },
      update: {
        name: prop.name,
        themeColor: prop.themeColor,
        category: prop.category,
        description: prop.description,
        imageNote: prop.imageNote,
      },
      create: {
        id: prop.id,
        scriptId: prop.scriptId,
        name: prop.name,
        themeColor: prop.themeColor,
        category: prop.category,
        description: prop.description,
        imageNote: prop.imageNote,
      },
    });
  }

  if (workspace.outline) {
    await prisma.scriptOutline.upsert({
      where: { scriptId: workspace.outline.scriptId },
      update: { text: workspace.outline.text },
      create: {
        scriptId: workspace.outline.scriptId,
        text: workspace.outline.text,
      },
    });
  }

  if (workspace.cover) {
    await prisma.scriptCover.upsert({
      where: { scriptId: workspace.cover.scriptId },
      update: {
        title: workspace.cover.title,
        writtenBy: workspace.cover.writtenBy,
        draftDate: workspace.cover.draftDate,
        contact: workspace.cover.contact,
        notes: workspace.cover.notes,
      },
      create: {
        scriptId: workspace.cover.scriptId,
        title: workspace.cover.title,
        writtenBy: workspace.cover.writtenBy,
        draftDate: workspace.cover.draftDate,
        contact: workspace.cover.contact,
        notes: workspace.cover.notes,
      },
    });
  }

  for (const task of workspace.assetTasks) {
    await prisma.assetTask.upsert({
      where: { id: task.id },
      update: {
        kind: assetTaskKindMap[task.kind],
        title: task.title,
        status: task.status,
      },
      create: {
        id: task.id,
        scriptId: task.scriptId,
        kind: assetTaskKindMap[task.kind],
        title: task.title,
        status: task.status,
        createdAt: new Date(task.createdAt),
      },
    });
  }

  for (const collaborator of workspace.collaboration.collaborators) {
    await prisma.projectCollaborator.upsert({
      where: { id: collaborator.id },
      update: {
        initials: collaborator.initials,
        role: collaborator.role,
        status: collaborator.status,
      },
      create: {
        id: collaborator.id,
        projectId: collaborator.projectId,
        initials: collaborator.initials,
        role: collaborator.role,
        status: collaborator.status,
        createdAt: new Date(collaborator.createdAt),
      },
    });
  }

  console.log(`Seeded workspace ${workspace.project.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
