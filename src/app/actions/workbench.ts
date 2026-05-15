"use server";

import { revalidatePath } from "next/cache";

import {
  createBeatSnapshot,
  createPropSnapshot,
  deleteAssetSnapshot,
  deleteBeatSnapshot,
  deletePropSnapshot,
  importAssetSnapshot,
  updateAssetSnapshot,
  updateBeatSnapshot,
  updatePropSnapshot,
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

export async function deleteBeatAction(input: {
  projectId: string;
  scriptId: string;
  beatId: string;
}) {
  const snapshot = await deleteBeatSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function deletePropAction(input: {
  projectId: string;
  scriptId: string;
  propId: string;
}) {
  const snapshot = await deletePropSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function deleteAssetAction(input: {
  projectId: string;
  scriptId: string;
  assetId: string;
}) {
  const snapshot = await deleteAssetSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function updateBeatAction(input: {
  projectId: string;
  scriptId: string;
  beatId: string;
  title: string;
}) {
  const snapshot = await updateBeatSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function updatePropAction(input: {
  projectId: string;
  scriptId: string;
  propId: string;
  name: string;
}) {
  const snapshot = await updatePropSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function updateAssetAction(input: {
  projectId: string;
  scriptId: string;
  assetId: string;
  title: string;
}) {
  const snapshot = await updateAssetSnapshot(input);
  revalidatePath("/");
  return snapshot;
}
