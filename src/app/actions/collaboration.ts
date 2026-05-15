"use server";

import { revalidatePath } from "next/cache";

import {
  createInviteSnapshot,
  removeCollaboratorSnapshot,
  revokeProjectShareSnapshot,
  updateCollaboratorSnapshot,
} from "@/lib/db/workspace";

export async function createInviteAction(projectId: string) {
  const snapshot = await createInviteSnapshot({ projectId });
  revalidatePath("/");
  return snapshot;
}

export async function removeCollaboratorAction(input: {
  projectId: string;
  collaboratorId: string;
}) {
  const snapshot = await removeCollaboratorSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function updateCollaboratorAction(input: {
  projectId: string;
  collaboratorId: string;
  role: string;
  status: string;
}) {
  const snapshot = await updateCollaboratorSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function revokeShareAction(projectId: string) {
  const snapshot = await revokeProjectShareSnapshot({ projectId });
  revalidatePath("/");
  return snapshot;
}
