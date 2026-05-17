"use server";

import { revalidatePath } from "next/cache";

import {
  commitAndInsertScriptBlockSnapshot,
  deleteScriptBlockSnapshot,
  duplicateScriptBlockSnapshot,
  insertScriptBlockSnapshot,
  updateScriptBlockSnapshot,
} from "@/lib/db/workspace";
import type { ScriptBlockType } from "@/lib/domain/types";

export async function insertScriptBlockAction(input: {
  projectId: string;
  scriptId: string;
  type: ScriptBlockType;
  text?: string;
  afterBlockId?: string;
}) {
  const snapshot = await insertScriptBlockSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function commitAndInsertScriptBlockAction(input: {
  projectId: string;
  scriptId: string;
  type: ScriptBlockType;
  afterBlockId: string;
  text: string;
  insertedText?: string;
}) {
  const snapshot = await commitAndInsertScriptBlockSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function updateScriptBlockAction(input: {
  projectId: string;
  blockId: string;
  text: string;
}) {
  const snapshot = await updateScriptBlockSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function duplicateScriptBlockAction(input: {
  projectId: string;
  blockId: string;
}) {
  const snapshot = await duplicateScriptBlockSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function deleteScriptBlockAction(input: {
  projectId: string;
  blockId: string;
}) {
  const snapshot = await deleteScriptBlockSnapshot(input);
  revalidatePath("/");
  return snapshot;
}
