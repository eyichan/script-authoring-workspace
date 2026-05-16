"use client";

import type { ComponentType } from "react";
import {
  BarChart3,
  Columns2,
  Home,
  ImageIcon,
  MoreHorizontal,
  Plus,
  ScrollText,
  Share2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  WorkbenchTabs,
  beatTabs,
  workbenchConfig,
  type WorkbenchPageName,
} from "@/components/workspace/workbench-pages";

export type EditorTab = "script" | "cover";
export type HeaderPageName =
  | "Script"
  | "Beats"
  | "Characters"
  | "Props"
  | "Locations"
  | "Storyboard"
  | "Scenes"
  | "Assets";

function isWorkbenchPage(page: HeaderPageName): page is WorkbenchPageName {
  return page !== "Script" && page !== "Beats" && page !== "Storyboard";
}

type WorkspaceTopBarProps = {
  collaborationMutationPending: boolean;
  onCreateInvite: () => void;
  onOpenProjects: () => void;
};

type WorkspaceMainHeaderProps = {
  activePage: HeaderPageName;
  beatTab: string;
  editorMode: boolean;
  editorTab: EditorTab;
  pageActionCount: number;
  workbenchActionLabel: string;
  workbenchMutationPending: boolean;
  workbenchTab: string;
  onCreateBeat: () => void;
  onSetBeatTab: (tab: string) => void;
  onSetEditorTab: (tab: EditorTab) => void;
  onSetWorkbenchTab: (tab: string) => void;
  onWorkbenchAction: () => void;
};

export function WorkspaceTopBar({
  collaborationMutationPending,
  onCreateInvite,
  onOpenProjects,
}: WorkspaceTopBarProps) {
  return (
    <header className="flex h-12 items-center justify-between px-3">
      <div className="flex items-center gap-4">
        <IconChrome label="Home" icon={Home} onClick={onOpenProjects} />
        <IconChrome label="Outline" icon={Columns2} />
      </div>
      <Button
        variant="secondary"
        className="h-8 gap-1.5 rounded-full border border-[#dfe4e1]/60 bg-[#fcfdfc] px-3 text-[12px] font-medium text-[#171a19] shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] transition-[background-color,box-shadow,color,border-color] duration-150 hover:bg-[#f8faf9] active:translate-y-0"
        disabled={collaborationMutationPending}
        onClick={onCreateInvite}
      >
        <Share2 className="size-[14px]" data-icon="inline-start" />
        {collaborationMutationPending ? "Inviting" : "Invite"}
      </Button>
    </header>
  );
}

export function WorkspaceMainHeader({
  activePage,
  beatTab,
  editorMode,
  editorTab,
  pageActionCount,
  workbenchActionLabel,
  workbenchMutationPending,
  workbenchTab,
  onCreateBeat,
  onSetBeatTab,
  onSetEditorTab,
  onSetWorkbenchTab,
  onWorkbenchAction,
}: WorkspaceMainHeaderProps) {
  const title = editorMode
    ? activePage
    : activePage === "Beats"
      ? "Beats"
      : activePage === "Storyboard"
        ? "Storyboard"
        : isWorkbenchPage(activePage)
          ? workbenchConfig[activePage].title
          : activePage;

  return (
    <header className="pointer-events-none relative flex items-center justify-center border-b border-[#ebebe7] px-4 max-[900px]:min-h-[96px] max-[900px]:flex-col max-[900px]:gap-2 max-[900px]:py-3">
      <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[16px] font-normal max-[900px]:static max-[900px]:translate-y-0">
        {title}
        {!editorMode && activePage !== "Storyboard" ? (
          <span className="rounded-md bg-[#f3f3f0] px-2 py-1 text-[13px] font-normal">
            {pageActionCount}
          </span>
        ) : null}
      </div>
      {editorMode ? (
        <Tabs
          value={editorTab}
          onValueChange={(value) => onSetEditorTab(value as EditorTab)}
          className="pointer-events-auto items-center"
        >
          <TabsList className="h-9 rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]">
            <TabsTrigger value="script" className="h-7 min-w-20 rounded-lg border-0 bg-transparent text-[12px] font-medium text-[#6b7370] opacity-60 shadow-none transition-[background-color,box-shadow,color,opacity] duration-200 data-active:bg-[#fcfdfc] data-active:text-[#171a19] data-active:opacity-100 data-active:!shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
              <ScrollText className="size-[15px]" data-icon="inline-start" />
              Script
            </TabsTrigger>
            <TabsTrigger value="cover" className="h-7 min-w-20 rounded-lg border-0 bg-transparent text-[12px] font-medium text-[#6b7370] opacity-60 shadow-none transition-[background-color,box-shadow,color,opacity] duration-200 data-active:bg-[#fcfdfc] data-active:text-[#171a19] data-active:opacity-100 data-active:!shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
              <ImageIcon className="size-[15px]" data-icon="inline-start" />
              Cover
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : activePage === "Beats" ? (
        <WorkbenchTabs
          tabs={beatTabs}
          activeTab={beatTab}
          onChange={onSetBeatTab}
        />
      ) : activePage === "Storyboard" ? (
        <Badge variant="secondary" className="justify-self-center">
          Master feature
        </Badge>
      ) : isWorkbenchPage(activePage) ? (
        <WorkbenchTabs
          tabs={workbenchConfig[activePage].tabs}
          activeTab={workbenchTab}
          onChange={onSetWorkbenchTab}
        />
      ) : null}
      {editorMode ? (
        <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 max-[900px]:hidden">
          <IconChrome label="Statistics" icon={BarChart3} />
        </div>
      ) : activePage === "Beats" ? (
        <Button
          className="pointer-events-auto absolute right-4 top-1/2 z-10 h-7 -translate-y-1/2 rounded-full bg-[#2e6248] px-3 text-[12px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#28583f] active:translate-y-0 max-[900px]:static max-[900px]:translate-y-0"
          disabled={workbenchMutationPending}
          onClick={onCreateBeat}
        >
          <Plus className="size-[14px]" data-icon="inline-start" />
          {workbenchMutationPending ? "Saving" : "New Beat"}
        </Button>
      ) : activePage !== "Storyboard" ? (
        <Button
          className="pointer-events-auto absolute right-4 top-1/2 z-10 h-7 -translate-y-1/2 rounded-full bg-[#2e6248] px-3 text-[12px] font-medium text-white shadow-none transition-[background-color,box-shadow,transform,color,border-color] duration-200 hover:bg-[#28583f] active:translate-y-0 max-[900px]:static max-[900px]:translate-y-0"
          disabled={workbenchMutationPending}
          onClick={onWorkbenchAction}
        >
          {workbenchActionLabel === "Tidy" ? (
            <MoreHorizontal className="size-[14px]" data-icon="inline-start" />
          ) : (
            <Plus className="size-[14px]" data-icon="inline-start" />
          )}
          {workbenchMutationPending ? "Saving" : workbenchActionLabel}
        </Button>
      ) : null}
    </header>
  );
}

function IconChrome({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={label}
        onClick={onClick}
        className="inline-flex size-8 items-center justify-center rounded-lg bg-transparent hover:bg-[#e9e9e5]"
      >
        <Icon className="size-[18px]" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
