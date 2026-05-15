"use server";

import { revalidatePath } from "next/cache";

import { createInviteSnapshot } from "@/lib/db/workspace";

export async function createInviteAction(projectId: string) {
  const snapshot = await createInviteSnapshot({ projectId });
  revalidatePath("/");
  return snapshot;
}
