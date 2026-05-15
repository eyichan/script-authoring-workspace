import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  deriveScriptEntities,
  formatSceneHeading,
  parseSceneHeading,
} from "./screenplay";
import {
  deleteScriptBlock,
  duplicateScriptBlock,
  insertScriptBlockAfter,
  updateScriptBlockText,
} from "./script-blocks";
import type { ScriptBlock, ScriptBlockType } from "./types";

const scriptId = "script-test";
const timestamp = "2026-05-15T00:00:00.000Z";

function makeBlock(
  id: string,
  type: ScriptBlockType,
  text: string,
  position: number,
): ScriptBlock {
  return {
    id,
    scriptId,
    type,
    text,
    position,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function makeDraftBlock(
  id: string,
  type: ScriptBlockType,
  text = "",
): ScriptBlock {
  return makeBlock(id, type, text, 0);
}

function positions(blocks: ScriptBlock[]) {
  return blocks.map((block) => block.position);
}

function ids(blocks: ScriptBlock[]) {
  return blocks.map((block) => block.id);
}

describe("screenplay domain", () => {
  it("parses and formats foreign screenplay scene headings", () => {
    assert.deepEqual(parseSceneHeading(" ext. desert road - night "), {
      prefix: "EXT",
      locationName: "DESERT ROAD",
      timeOfDay: "NIGHT",
    });

    assert.deepEqual(parseSceneHeading("INT/EXT. TRAIN CAR"), {
      prefix: "INT/EXT",
      locationName: "TRAIN CAR",
      timeOfDay: "DAY",
    });

    assert.equal(
      formatSceneHeading({
        prefix: "INT",
        locationName: "MOON BASE",
        timeOfDay: "NIGHT",
      }),
      "INT. MOON BASE - NIGHT",
    );
  });

  it("inserts editable blocks and derives scenes, characters, and locations", () => {
    let blocks = [
      makeBlock("block-2", "action", "Earth hangs blue.", 2),
      makeBlock("block-1", "scene", "INT. MOON BASE - NIGHT", 1),
      makeBlock("block-3", "character", "COMMANDER LIN", 3),
      makeBlock("block-4", "dialogue", "We have one hour.", 4),
    ];

    blocks = insertScriptBlockAfter(
      blocks,
      makeDraftBlock("block-5", "scene"),
      "block-4",
    );
    blocks = updateScriptBlockText(
      blocks,
      "block-5",
      "EXT. DESERT ROAD - NIGHT",
      "local-edit-1",
    );
    blocks = insertScriptBlockAfter(
      blocks,
      makeDraftBlock("block-6", "character", "qa bot"),
      "block-5",
    );
    blocks = insertScriptBlockAfter(
      blocks,
      makeDraftBlock("block-7", "dialogue", "Systems online."),
      "block-6",
    );

    const derived = deriveScriptEntities(scriptId, blocks);

    assert.deepEqual(positions(blocks), [1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(
      derived.scenes.map((scene) => scene.heading),
      ["INT. MOON BASE - NIGHT", "EXT. DESERT ROAD - NIGHT"],
    );
    assert.deepEqual(
      derived.characters.map((character) => character.displayName),
      ["COMMANDER LIN", "QA BOT"],
    );
    assert.deepEqual(
      derived.locations.map((location) => location.displayName),
      ["MOON BASE", "DESERT ROAD"],
    );
    assert.equal(derived.scenes[1].dialogueLineCount, 1);
    assert.equal(derived.characters[1].dialogueLineCount, 1);
  });

  it("duplicates and deletes source blocks while recalculating derived entities", () => {
    let blocks = [
      makeBlock("block-1", "scene", "INT. MOON BASE - NIGHT", 1),
      makeBlock("block-2", "action", "Earth hangs blue.", 2),
      makeBlock("block-3", "character", "COMMANDER LIN", 3),
      makeBlock("block-4", "dialogue", "We have one hour.", 4),
    ];

    blocks = duplicateScriptBlock(
      blocks,
      "block-1",
      makeDraftBlock("block-5", "scene", "INT. MOON BASE - NIGHT"),
    );

    let derived = deriveScriptEntities(scriptId, blocks);

    assert.deepEqual(positions(blocks), [1, 2, 3, 4, 5]);
    assert.deepEqual(ids(blocks), ["block-1", "block-5", "block-2", "block-3", "block-4"]);
    assert.equal(derived.scenes.length, 2);
    assert.equal(derived.locations[0].sceneIds.length, 2);

    blocks = deleteScriptBlock(blocks, "block-5");
    derived = deriveScriptEntities(scriptId, blocks);

    assert.deepEqual(positions(blocks), [1, 2, 3, 4]);
    assert.equal(derived.scenes.length, 1);
    assert.equal(derived.locations[0].sceneIds.length, 1);

    blocks = deleteScriptBlock(blocks, "block-3");
    derived = deriveScriptEntities(scriptId, blocks);

    assert.equal(derived.characters.length, 0);
    assert.equal(derived.scenes[0].dialogueLineCount, 0);
    assert.deepEqual(derived.locations[0].characterIds, []);
  });

  it("ignores empty scene rows until the writer enters a valid heading", () => {
    let blocks = [
      makeBlock("block-1", "scene", "INT. MOON BASE - NIGHT", 1),
      makeBlock("block-2", "action", "Earth hangs blue.", 2),
    ];

    blocks = insertScriptBlockAfter(
      blocks,
      makeDraftBlock("block-3", "scene"),
      "block-2",
    );

    let derived = deriveScriptEntities(scriptId, blocks);

    assert.equal(derived.scenes.length, 1);
    assert.deepEqual(
      derived.locations.map((location) => location.displayName),
      ["MOON BASE"],
    );

    blocks = updateScriptBlockText(
      blocks,
      "block-3",
      "EXT. CLIFF EDGE - DAWN",
      "local-edit-2",
    );
    derived = deriveScriptEntities(scriptId, blocks);

    assert.deepEqual(
      derived.scenes.map((scene) => scene.heading),
      ["INT. MOON BASE - NIGHT", "EXT. CLIFF EDGE - DAWN"],
    );
    assert.deepEqual(
      derived.locations.map((location) => location.displayName),
      ["MOON BASE", "CLIFF EDGE"],
    );
  });
});
