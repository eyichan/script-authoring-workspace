import type {
  DerivedCharacter,
  DerivedLocation,
  DerivedScene,
  SceneHeadingParts,
  ScriptBlock,
} from "./types";

export const scenePrefixOptions = [
  { value: "INT", label: "INT.", description: "Interior" },
  { value: "EXT", label: "EXT.", description: "Exterior" },
  { value: "INT./EXT", label: "INT./EXT.", description: "Interior to exterior" },
  { value: "EXT./INT", label: "EXT./INT.", description: "Exterior to interior" },
  { value: "I/E", label: "I/E.", description: "Interior/exterior" },
  { value: "EST", label: "EST.", description: "Establishing" },
] as const;

export const sceneTimeOptions = [
  { value: "DAY", description: "Daytime" },
  { value: "NIGHT", description: "Nighttime" },
  { value: "DAY/NIGHT", description: "Day into night" },
  { value: "MORNING", description: "Morning" },
  { value: "AFTERNOON", description: "Afternoon" },
  { value: "EVENING", description: "Evening" },
  { value: "NOON", description: "Noon" },
  { value: "DAWN", description: "Dawn" },
  { value: "DUSK", description: "Dusk" },
  { value: "SUNRISE", description: "Sunrise" },
  { value: "SUNSET", description: "Sunset" },
  { value: "LATER", description: "Later" },
  { value: "CONTINUOUS", description: "Continuous" },
  { value: "MOMENTS LATER", description: "Moments later" },
  { value: "SAME TIME", description: "Same time" },
] as const;

export const commonTransitionOptions = [
  "CUT TO:",
  "SMASH CUT TO:",
  "JUMP CUT TO:",
  "MATCH CUT TO:",
  "HARD CUT TO:",
  "FLASH CUT TO:",
  "DISSOLVE TO:",
  "FADE TO:",
  "FADE IN:",
  "FADE OUT.",
  "FADE TO BLACK.",
  "WIPE TO:",
  "IRIS IN:",
  "IRIS OUT:",
  "BACK TO:",
] as const;

export type ScenePrefixOption = (typeof scenePrefixOptions)[number]["value"];

const SCENE_PREFIX_PATTERN = /^(INT\.?\/EXT\.?|EXT\.?\/INT\.?|INT\/EXT\.?|EXT\/INT\.?|INT\.?|EXT\.?|I\/E\.?|EST\.?)\s+(.+?)(?:\s+-\s+(.+))?$/i;

export function canonicalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function makeEntityId(prefix: string, canonicalName: string): string {
  return `${prefix}-${canonicalName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function normalizeScenePrefix(value: string): ScenePrefixOption {
  const prefix = value.trim().toUpperCase().replace(/\.$/, "");

  if (/^INT\.?\/EXT$/.test(prefix) || prefix === "INT/EXT") {
    return "INT./EXT";
  }

  if (/^EXT\.?\/INT$/.test(prefix) || prefix === "EXT/INT") {
    return "EXT./INT";
  }

  if (prefix === "EXT") return "EXT";
  if (prefix === "I/E") return "I/E";
  if (prefix === "EST") return "EST";

  return "INT";
}

export function formatScenePrefix(prefix: string): string {
  const normalized = normalizeScenePrefix(prefix);

  return normalized.endsWith(".") ? normalized : `${normalized}.`;
}

export function parseSceneHeading(text: string): SceneHeadingParts | null {
  const normalized = text.trim().replace(/\s+/g, " ");
  const match = normalized.match(SCENE_PREFIX_PATTERN);

  if (!match) return null;

  return {
    prefix: normalizeScenePrefix(match[1]),
    locationName: canonicalizeName(match[2]),
    timeOfDay: canonicalizeName(match[3] ?? "DAY"),
  };
}

export function formatSceneHeading(parts: SceneHeadingParts): string {
  return `${formatScenePrefix(parts.prefix)} ${parts.locationName} - ${parts.timeOfDay}`;
}

export function deriveScriptEntities(scriptId: string, blocks: ScriptBlock[]) {
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);
  const scenes: DerivedScene[] = [];
  const characterMap = new Map<string, DerivedCharacter>();
  const locationMap = new Map<string, DerivedLocation>();
  let activeScene: DerivedScene | undefined;
  let activeCharacter: DerivedCharacter | undefined;

  for (const block of sortedBlocks) {
    if (block.type === "scene") {
      const parsed = parseSceneHeading(block.text);
      if (!parsed) {
        activeScene = undefined;
        activeCharacter = undefined;
        continue;
      }

      const headingParts = parsed;
      const heading = formatSceneHeading(headingParts);

      activeScene = {
        id: `scene-${block.id}`,
        scriptId,
        sourceBlockId: block.id,
        heading,
        prefix: headingParts.prefix,
        locationName: headingParts.locationName,
        timeOfDay: headingParts.timeOfDay,
        position: block.position,
        characterIds: [],
        dialogueLineCount: 0,
        blockCount: 1,
      };
      scenes.push(activeScene);

      const locationId = makeEntityId("location", headingParts.locationName);
      const location =
        locationMap.get(locationId) ??
        ({
          id: locationId,
          scriptId,
          canonicalName: headingParts.locationName,
          displayName: headingParts.locationName,
          sceneIds: [],
          characterIds: [],
        } satisfies DerivedLocation);

      if (!location.sceneIds.includes(activeScene.id)) {
        location.sceneIds.push(activeScene.id);
      }

      locationMap.set(locationId, location);
      activeCharacter = undefined;
      continue;
    }

    if (activeScene) {
      activeScene.blockCount += 1;
    }

    if (block.type === "character") {
      const canonicalName = canonicalizeName(block.text);
      if (!canonicalName) {
        activeCharacter = undefined;
        continue;
      }

      const characterId = makeEntityId("character", canonicalName);
      const character =
        characterMap.get(characterId) ??
        ({
          id: characterId,
          scriptId,
          canonicalName,
          displayName: canonicalName,
          sourceBlockIds: [],
          sceneIds: [],
          dialogueLineCount: 0,
        } satisfies DerivedCharacter);

      if (!character.sourceBlockIds.includes(block.id)) {
        character.sourceBlockIds.push(block.id);
      }

      if (activeScene) {
        if (!character.sceneIds.includes(activeScene.id)) {
          character.sceneIds.push(activeScene.id);
        }
        if (!activeScene.characterIds.includes(character.id)) {
          activeScene.characterIds.push(character.id);
        }

        const location = locationMap.get(makeEntityId("location", activeScene.locationName));
        if (location && !location.characterIds.includes(character.id)) {
          location.characterIds.push(character.id);
        }
      }

      characterMap.set(characterId, character);
      activeCharacter = character;
      continue;
    }

    if (block.type === "dialogue" && activeCharacter) {
      activeCharacter.dialogueLineCount += 1;
      if (activeScene) {
        activeScene.dialogueLineCount += 1;
      }
    }
  }

  return {
    scenes,
    characters: [...characterMap.values()],
    locations: [...locationMap.values()],
  };
}
