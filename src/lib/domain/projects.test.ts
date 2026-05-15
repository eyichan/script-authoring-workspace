import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createProject,
  getActiveProjects,
  getTrashedProjects,
  moveProjectToTrash,
  restoreProject,
} from "./projects";
import type { Project } from "./types";

const createdAt = "2026-05-15T00:00:00.000Z";

function makeProject(id: string, title: string): Project {
  return {
    id,
    title,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  };
}

describe("project lifecycle domain", () => {
  it("creates active projects and preserves existing records", () => {
    const projects = [makeProject("project-1", "Pilot")];
    const nextProject = makeProject("project-2", "Second Draft");

    const result = createProject(projects, nextProject);

    assert.equal(result.length, 2);
    assert.equal(result[1].title, "Second Draft");
    assert.equal(projects.length, 1);
  });

  it("moves projects to trash and restores them", () => {
    const trashedAt = "2026-05-15T01:00:00.000Z";
    const restoredAt = "2026-05-15T02:00:00.000Z";
    const projects = [
      makeProject("project-1", "Pilot"),
      makeProject("project-2", "Second Draft"),
    ];

    const trashed = moveProjectToTrash(projects, "project-2", trashedAt);

    assert.deepEqual(
      getActiveProjects(trashed).map((project) => project.id),
      ["project-1"],
    );
    assert.deepEqual(
      getTrashedProjects(trashed).map((project) => project.id),
      ["project-2"],
    );
    assert.equal(trashed[1].trashedAt, trashedAt);

    const restored = restoreProject(trashed, "project-2", restoredAt);

    assert.deepEqual(
      getActiveProjects(restored).map((project) => project.id),
      ["project-1", "project-2"],
    );
    assert.equal(restored[1].trashedAt, undefined);
    assert.equal(restored[1].updatedAt, restoredAt);
  });
});
