"use server";

import { revalidatePath } from "next/cache";

import {
  createBeatSnapshot,
  createPropSnapshot,
  importAssetSnapshot,
} from "@/lib/db/workspace";

export async function createBeatAction(input: {
  projectId: string;
  scriptId: string;
}) {
  const snapshot = await createBeatSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function createPropAction(input: {
  projectId: string;
  scriptId: string;
}) {
  const snapshot = await createPropSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function importAssetAction(input: {
  projectId: string;
  scriptId: string;
}) {
  const snapshot = await importAssetSnapshot(input);
  revalidatePath("/");
  return snapshot;
}
