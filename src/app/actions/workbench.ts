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
  updateBeatDetailSnapshot,
  updateBeatSnapshot,
  updatePropDetailSnapshot,
  updatePropSnapshot,
  updateScriptOutlineSnapshot,
  upsertCharacterProfileSnapshot,
  upsertLocationProfileSnapshot,
  upsertSceneProductionNoteSnapshot,
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

export async function updateBeatDetailAction(input: {
  projectId: string;
  scriptId: string;
  beatId: string;
  title: string;
  description: string;
  color: string;
  durationMinutes: number;
}) {
  const snapshot = await updateBeatDetailSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function updatePropDetailAction(input: {
  projectId: string;
  scriptId: string;
  propId: string;
  name: string;
  themeColor: string;
  category: string;
  description: string;
  imageNote: string;
}) {
  const snapshot = await updatePropDetailSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function upsertCharacterProfileAction(input: {
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
}) {
  const snapshot = await upsertCharacterProfileSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function upsertSceneProductionNoteAction(input: {
  projectId: string;
  scriptId: string;
  sceneId: string;
  description: string;
  artRequirements: string;
  stillStatus: string;
  videoStatus: string;
}) {
  const snapshot = await upsertSceneProductionNoteSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function upsertLocationProfileAction(input: {
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
}) {
  const snapshot = await upsertLocationProfileSnapshot(input);
  revalidatePath("/");
  return snapshot;
}

export async function updateScriptOutlineAction(input: {
  projectId: string;
  scriptId: string;
  text: string;
}) {
  const snapshot = await updateScriptOutlineSnapshot(input);
  revalidatePath("/");
  return snapshot;
}
