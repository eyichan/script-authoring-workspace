import type { Project } from "./types";

export function createProject(
  projects: Project[],
  project: Project,
): Project[] {
  return [...projects, project];
}

export function moveProjectToTrash(
  projects: Project[],
  projectId: string,
  trashedAt: string,
): Project[] {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          status: "trashed",
          updatedAt: trashedAt,
          trashedAt,
        }
      : project,
  );
}

export function restoreProject(
  projects: Project[],
  projectId: string,
  restoredAt: string,
): Project[] {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          status: "active",
          updatedAt: restoredAt,
          trashedAt: undefined,
        }
      : project,
  );
}

export function getActiveProjects(projects: Project[]): Project[] {
  return projects.filter((project) => project.status === "active");
}

export function getTrashedProjects(projects: Project[]): Project[] {
  return projects.filter((project) => project.status === "trashed");
}
