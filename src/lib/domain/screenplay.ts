import type {
  DerivedCharacter,
  DerivedLocation,
  DerivedScene,
  SceneHeadingParts,
  ScriptBlock,
} from "./types";

const SCENE_PREFIX_PATTERN = /^(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?)\s+(.+?)(?:\s+-\s+(.+))?$/i;

export function canonicalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function makeEntityId(prefix: string, canonicalName: string): string {
  return `${prefix}-${canonicalName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function parseSceneHeading(text: string): SceneHeadingParts | null {
  const normalized = text.trim().replace(/\s+/g, " ");
  const match = normalized.match(SCENE_PREFIX_PATTERN);

  if (!match) return null;

  return {
    prefix: match[1].replace(/\.$/, "").toUpperCase(),
    locationName: canonicalizeName(match[2]),
    timeOfDay: canonicalizeName(match[3] ?? "DAY"),
  };
}

export function formatSceneHeading(parts: SceneHeadingParts): string {
  return `${parts.prefix}. ${parts.locationName} - ${parts.timeOfDay}`;
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
