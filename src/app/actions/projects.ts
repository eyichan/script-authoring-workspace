"use server";

import { revalidatePath } from "next/cache";

import {
  createProjectSnapshot,
  getWorkspaceByProjectId,
  restoreProjectSnapshot,
  trashProjectSnapshot,
} from "@/lib/db/workspace";

export async function createProjectAction() {
  const snapshot = await createProjectSnapshot();
  revalidatePath("/");
  return snapshot;
}

export async function openProjectAction(projectId: string) {
  return getWorkspaceByProjectId(projectId);
}

export async function trashProjectAction(projectId: string) {
  const snapshot = await trashProjectSnapshot(projectId);
  revalidatePath("/");
  return snapshot;
}

export async function restoreProjectAction(projectId: string) {
  const snapshot = await restoreProjectSnapshot(projectId);
  revalidatePath("/");
  return snapshot;
}
