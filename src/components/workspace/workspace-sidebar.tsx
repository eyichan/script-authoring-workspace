"use client";

import type { ComponentType } from "react";
import {
  Box,
  ChevronDown,
  Clapperboard,
  FileText,
  Hourglass,
  ImageIcon,
  LayoutGrid,
  MapPin,
  PenLine,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export type PageName =
  | "Script"
  | "Beats"
  | "Characters"
  | "Props"
  | "Locations"
  | "Storyboard"
  | "Scenes"
  | "Assets";

type SidebarItem = {
  id: string;
  title: string;
  time: string;
  index: number;
};

type WorkspaceSidebarProps = {
  activePage: PageName;
  activeProject: Project;
  activeScene: string;
  projectMutationPending: boolean;
  projectTitleValue: string;
  sectionTitle: string;
  sidebarItems: SidebarItem[];
  onOpenProjects: () => void;
  onRenameProject: () => void;
  onSelectPage: (page: PageName) => void;
  onSelectSidebarItem: (itemId: string) => void;
  onSetProjectTitleDraft: (draft: { projectId: string; title: string }) => void;
};

const navItems = [
  { label: "Script", icon: FileText },
  { label: "Beats", icon: Hourglass },
  { label: "Characters", icon: User },
  { label: "Props", icon: Box },
  { label: "Locations", icon: MapPin },
  { label: "Storyboard", icon: Clapperboard },
  { label: "Scenes", icon: LayoutGrid },
  { label: "Assets", icon: ImageIcon },
] satisfies Array<{ label: PageName; icon: ComponentType<{ className?: string }> }>;

export function WorkspaceSidebar({
  activePage,
  activeProject,
  activeScene,
  projectMutationPending,
  projectTitleValue,
  sectionTitle,
  sidebarItems,
  onOpenProjects,
  onRenameProject,
  onSelectPage,
  onSelectSidebarItem,
  onSetProjectTitleDraft,
}: WorkspaceSidebarProps) {
  return (
    <aside className="flex min-h-0 w-[230px] shrink-0 flex-col pb-0 pt-4 max-[900px]:hidden">
      <div className="ml-4 flex h-[30px] w-[150px] items-center overflow-hidden rounded-lg bg-[#e4e8e6] text-[13px] font-normal text-[#171a19] shadow-none transition-colors duration-300 focus-within:bg-[#dde2df] max-[1180px]:hidden">
        <label htmlFor="project-title" className="sr-only">
          Project title
        </label>
        <input
          id="project-title"
          name="project-title"
          aria-label="Project title"
          value={projectTitleValue}
          disabled={projectMutationPending}
          spellCheck={false}
          onChange={(event) =>
            onSetProjectTitleDraft({
              projectId: activeProject.id,
              title: event.target.value,
            })
          }
          onBlur={onRenameProject}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              onSetProjectTitleDraft({
                projectId: activeProject.id,
                title: activeProject.title,
              });
              event.currentTarget.blur();
            }
          }}
          className="min-w-0 flex-1 bg-transparent px-2.5 outline-none placeholder:text-[#8a908d] disabled:opacity-60"
        />
        <button
          type="button"
          aria-label="Open projects"
          disabled={projectMutationPending}
          onClick={onOpenProjects}
          className="grid h-full w-8 shrink-0 place-items-center text-[#5d6561] transition-colors hover:bg-[#d7ddda] disabled:opacity-60"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-1 pl-4">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectPage(item.label)}
            className={cn(
              "inline-flex h-[30px] w-[214px] shrink-0 items-center justify-start gap-3 rounded-lg px-2.5 text-[13px] font-normal text-[#171a19] transition-[background-color,color] duration-300 hover:bg-[#e4e8e6] max-[1180px]:w-11 max-[1180px]:justify-center max-[1180px]:px-0",
              activePage === item.label && "bg-[#dfe4e1] hover:bg-[#dfe4e1]",
            )}
          >
            <item.icon className="size-[17px]" data-icon="inline-start" />
            <span className="max-[1180px]:hidden">{item.label}</span>
          </button>
        ))}
        <button
          type="button"
          disabled
          className="debug-hatch inline-flex h-[30px] w-[214px] shrink-0 items-center justify-start gap-3 rounded-none border border-dashed border-[#c9c9c2] px-2.5 text-[13px] font-normal opacity-100 disabled:cursor-default max-[1180px]:w-11 max-[1180px]:justify-center max-[1180px]:px-0"
        >
          <PenLine className="size-[17px]" data-icon="inline-start" />
          <span className="max-[1180px]:hidden">Design</span>
        </button>
      </nav>

      <section className="mt-5 pl-4 max-[1180px]:hidden">
        <h2 className="mb-4 text-[16px] font-normal">{sectionTitle}</h2>
        <div className="flex flex-col gap-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectSidebarItem(item.id)}
              className={cn(
                "flex h-[42px] w-[214px] items-center justify-between rounded-xl border border-[#e4e8e6] bg-[#fcfdfc] px-2.5 text-left text-[13px] font-normal text-[#55554f] shadow-[0_2px_4px_rgb(0_0_0/0.05),0_1px_2px_-1px_rgb(0_0_0/0.05)] transition-[background-color,border-color,box-shadow,color] duration-150 hover:bg-[#f8faf9]",
                activeScene === item.id &&
                  "border-[#dce2de] text-[#252522] shadow-[0_2px_4px_rgb(0_0_0/0.05),0_1px_2px_-1px_rgb(0_0_0/0.05)]",
              )}
            >
              <span className="truncate">
                {item.index}. {item.title}
              </span>
              <span className="shrink-0 pl-2 text-[#777771]">- {item.time}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mx-2 mt-auto rounded-lg border border-[#e5e5df] bg-white p-2 shadow-[0_4px_16px_rgb(32_32_28/0.08)] max-[1180px]:grid max-[1180px]:place-items-center">
        <div className="grid grid-cols-[44px_minmax(0,1fr)_12px] items-center gap-1.5 max-[1180px]:block">
          <Avatar className="size-11 bg-[radial-gradient(circle_at_30%_30%,#eef1bd,#d9e8df_48%,#f2f2ef)]">
            <AvatarFallback className="bg-transparent text-xs font-bold text-[#31543c]">
              SF
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 max-[1180px]:hidden">
            <div className="truncate text-sm font-medium">sonboy</div>
            <div className="truncate text-xs text-[#7d7d78]">Junior</div>
          </div>
          <ChevronDown className="size-3 max-[1180px]:hidden" />
        </div>
      </div>
      <Button className="mx-2 mt-2 h-7 rounded-full bg-[#32784d] text-[12px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#286640] active:translate-y-0 max-[1180px]:hidden">
        Upgrade
      </Button>
    </aside>
  );
}
