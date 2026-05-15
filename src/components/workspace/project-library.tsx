"use client";

import {
  ExternalLink,
  FileText,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Project } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type ProjectLibraryProps = {
  activeProjectId: string;
  activeProjects: Project[];
  persistenceLabel: string;
  projectMutationPending: boolean;
  trashedProjects: Project[];
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
  onTrashProject: (projectId: string) => void;
  onRestoreProject: (projectId: string) => void;
};

type ProjectCardProps = {
  project: Project;
  active: boolean;
  disabled?: boolean;
  statusLabel: string;
  onOpen?: () => void;
  onTrash?: () => void;
  onRestore?: () => void;
};

export function ProjectLibrary({
  activeProjectId,
  activeProjects,
  persistenceLabel,
  projectMutationPending,
  trashedProjects,
  onCreateProject,
  onOpenProject,
  onTrashProject,
  onRestoreProject,
}: ProjectLibraryProps) {
  return (
    <div className="h-[calc(100%-48px)] min-h-0 px-2 pb-2">
      <section className="grid h-full min-h-0 grid-rows-[56px_1fr] overflow-hidden rounded-[24px] border border-[#ddddda] bg-[#fcfdfc] shadow-sm">
        <header className="flex items-center justify-between border-b border-[#ebebe7] px-5">
          <div>
            <h1 className="text-[16px] font-normal text-[#242421]">Recents</h1>
            <p className="text-[12px] text-[#7d837f]">{persistenceLabel}</p>
          </div>
          <Button
            className="h-8 rounded-full bg-[#2e6248] px-3 text-[12px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#28583f] active:translate-y-0"
            disabled={projectMutationPending}
            onClick={onCreateProject}
          >
            <Plus className="size-[14px]" data-icon="inline-start" />
            {projectMutationPending ? "Saving" : "New Project"}
          </Button>
        </header>

        <ScrollArea className="min-h-0 bg-[radial-gradient(rgb(188_194_187/0.38)_1px,transparent_1px)] [background-size:30px_30px]">
          <div className="mx-auto grid max-w-[1120px] gap-6 px-6 py-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-medium text-[#6f7772]">
                  Active Projects
                </h2>
                <Badge variant="secondary">{activeProjects.length}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    active={project.id === activeProjectId}
                    disabled={projectMutationPending}
                    statusLabel={
                      project.id === activeProjectId ? "Open now" : "Active"
                    }
                    onOpen={() => onOpenProject(project.id)}
                    onTrash={() => onTrashProject(project.id)}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-medium text-[#6f7772]">Trash</h2>
                <Badge variant="secondary">{trashedProjects.length}</Badge>
              </div>
              {trashedProjects.length ? (
                <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
                  {trashedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      active={false}
                      disabled={projectMutationPending}
                      statusLabel="In Trash"
                      onRestore={() => onRestoreProject(project.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#cfd8d2] bg-[#f8faf8] p-4 text-[13px] text-[#6f7772]">
                  Trash is empty.
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </section>
    </div>
  );
}

function ProjectCard({
  project,
  active,
  disabled = false,
  statusLabel,
  onOpen,
  onTrash,
  onRestore,
}: ProjectCardProps) {
  const card = (
    <div
      data-testid={`project-card-${project.id}`}
      className={cn(
        "min-h-[160px] rounded-xl border border-[#deded8] bg-[#fcfdfc] p-4 shadow-[0_8px_24px_rgb(42_42_37/0.07)]",
        active && "border-[#b8d2bf] bg-[#f6fbf7]",
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="grid size-9 place-items-center rounded-lg bg-[#eef3ef] text-[#2e6248]">
          <FileText className="size-5" />
        </div>
        <Badge variant="secondary">{statusLabel}</Badge>
      </div>
      <h3 className="truncate text-[16px] font-medium leading-6">
        {project.title}
      </h3>
      <p className="mt-2 text-[13px] leading-5 text-[#777771]">
        Updated {project.updatedAt}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {onOpen ? (
          <Button
            variant="secondary"
            className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
            disabled={disabled}
            onClick={onOpen}
          >
            <ExternalLink className="size-[14px]" data-icon="inline-start" />
            Open
          </Button>
        ) : null}
        {onTrash ? (
          <Button
            variant="secondary"
            className="h-8 rounded-full border border-[#efd2d2] bg-[#fffafa] px-3 text-[12px] font-medium text-[#a04444] shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:bg-[#fff5f5] active:translate-y-0"
            disabled={disabled}
            onClick={onTrash}
          >
            <Trash2 className="size-[14px]" data-icon="inline-start" />
            Delete
          </Button>
        ) : null}
        {onRestore ? (
          <Button
            variant="secondary"
            className="h-8 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] hover:bg-[#f8faf9] active:translate-y-0"
            disabled={disabled}
            onClick={onRestore}
          >
            <RefreshCcw className="size-[14px]" data-icon="inline-start" />
            Restore
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">{card}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-[178px] border-[#dfe4e1] bg-[#fcfdfc] text-[#252522]">
        <ContextMenuGroup>
          <ContextMenuLabel className="max-w-[220px] truncate">
            {project.title}
          </ContextMenuLabel>
        </ContextMenuGroup>
        {onOpen ? (
          <ContextMenuItem disabled={disabled} onClick={onOpen}>
            <ExternalLink className="size-4" />
            Open
          </ContextMenuItem>
        ) : null}
        {onRestore ? (
          <ContextMenuItem disabled={disabled} onClick={onRestore}>
            <RefreshCcw className="size-4" />
            Restore
          </ContextMenuItem>
        ) : null}
        {onTrash ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={disabled}
              variant="destructive"
              onClick={onTrash}
            >
              <Trash2 className="size-4" />
              Delete to Trash
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
