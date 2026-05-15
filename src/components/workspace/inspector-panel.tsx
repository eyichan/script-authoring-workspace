"use client";

import {
  BadgeCheck,
  Clapperboard,
  FileText,
  Play,
  ScrollText,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CollaborationPanel } from "@/components/workspace/collaboration-panel";
import type { ToolLabel } from "@/components/workspace/script-editor-canvas";
import type { ScriptExportFormat } from "@/lib/domain/exports";
import type { CollaborationState } from "@/lib/domain/types";

export type InspectorTab = "info" | "collab";
export type PaginationMode = "minimal" | "studio" | "fast";
export type ExportFormat = ScriptExportFormat;

type StatItem = {
  label: string;
  value: string | number;
};

type InspectorPanelProps = {
  activeTool: ToolLabel;
  collaboration: CollaborationState;
  collaborationMessage: string;
  collaborationMutationPending: boolean;
  exportFormat: ExportFormat;
  inspectorTab: InspectorTab;
  lastExport: string;
  paginationMode: PaginationMode;
  productionMessage: string;
  stats: StatItem[];
  onCreateBreakdown: () => void;
  onCreateShotList: () => void;
  onExportScript: () => void;
  onRemoveCollaborator: (collaboratorId: string) => void;
  onRevokeShare: () => void;
  onSetExportFormat: (format: ExportFormat) => void;
  onSetInspectorTab: (tab: InspectorTab) => void;
  onSetPaginationMode: (mode: PaginationMode) => void;
  onUpdateCollaborator: (
    collaboratorId: string,
    role: string,
    status: string,
  ) => void;
};

const exportLabels: Record<ExportFormat, string> = {
  fdx: "Final Draft",
  fountain: "Fountain",
  pdf: "PDF",
};

export function InspectorPanel({
  activeTool,
  collaboration,
  collaborationMessage,
  collaborationMutationPending,
  exportFormat,
  inspectorTab,
  lastExport,
  paginationMode,
  productionMessage,
  stats,
  onCreateBreakdown,
  onCreateShotList,
  onExportScript,
  onRemoveCollaborator,
  onRevokeShare,
  onSetExportFormat,
  onSetInspectorTab,
  onSetPaginationMode,
  onUpdateCollaborator,
}: InspectorPanelProps) {
  return (
    <aside className="min-h-0 w-[260px] shrink-0 max-[900px]:hidden">
      <section className="h-full min-h-0 overflow-hidden rounded-[24px] border border-[#ddddda] bg-[#fcfdfc] shadow-sm">
        <div className="flex h-12 items-center border-b border-[#ebebe7] px-[18px] text-[16px] font-normal">
          Writing
        </div>
        <ScrollArea className="h-[calc(100%-48px)]">
          <div className="p-3">
            <Tabs
              value={inspectorTab}
              onValueChange={(value) => onSetInspectorTab(value as InspectorTab)}
            >
              <TabsList className="grid h-9 w-full grid-cols-2 rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]">
                <TabsTrigger value="info" className="h-7 rounded-lg border-0 bg-transparent text-[12px] font-medium text-[#6b7370] opacity-60 shadow-none transition-[background-color,box-shadow,color,opacity] duration-200 data-active:bg-[#fcfdfc] data-active:text-[#171a19] data-active:opacity-100 data-active:!shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                  Info
                </TabsTrigger>
                <TabsTrigger value="collab" className="h-7 rounded-lg border-0 bg-transparent text-[12px] font-medium text-[#6b7370] opacity-60 shadow-none transition-[background-color,box-shadow,color,opacity] duration-200 data-active:bg-[#fcfdfc] data-active:text-[#171a19] data-active:opacity-100 data-active:!shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                  Collaboration
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {inspectorTab === "info" ? (
              <>
                <InspectorGroup label="Pagination">
                  <ToggleGroup
                    value={[paginationMode]}
                    onValueChange={(value) => {
                      if (value[0]) onSetPaginationMode(value[0] as PaginationMode);
                    }}
                    className="grid h-10 w-full grid-cols-[1.35fr_0.8fr_0.8fr] rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]"
                  >
                    <ToggleGroupItem value="minimal" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      <FileText data-icon="inline-start" />
                      Minimal
                    </ToggleGroupItem>
                    <ToggleGroupItem value="studio" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      <ScrollText data-icon="inline-start" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="fast" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      <Zap data-icon="inline-start" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <p className="mt-2 text-[12px] leading-5 text-[#8a928e]">
                    {paginationMode === "minimal"
                      ? "Minimal pagination keeps the page clean while writing."
                      : paginationMode === "studio"
                        ? "Studio pagination exposes page breaks for production review."
                        : "Fast mode reduces visual chrome for quick drafting."}
                  </p>
                </InspectorGroup>

                <InspectorGroup label="Export format">
                  <ToggleGroup
                    value={[exportFormat]}
                    onValueChange={(value) => {
                      if (value[0]) onSetExportFormat(value[0] as ExportFormat);
                    }}
                    className="grid h-10 w-full grid-cols-3 rounded-[10px] border border-[#dfe4e1] bg-[#f4f6f5] p-[3px]"
                  >
                    <ToggleGroupItem value="fdx" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      FDX
                    </ToggleGroupItem>
                    <ToggleGroupItem value="fountain" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      Fountain
                    </ToggleGroupItem>
                    <ToggleGroupItem value="pdf" className="h-8 rounded-lg text-[12px] font-medium text-[#6b7370] hover:bg-[#eef2f0] aria-pressed:bg-[#fcfdfc] aria-pressed:text-[#171a19] aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)] data-[state=on]:bg-[#fcfdfc] data-[state=on]:text-[#171a19] data-[state=on]:shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]">
                      PDF
                    </ToggleGroupItem>
                  </ToggleGroup>
                </InspectorGroup>

                <div className="mt-5">
                  <div className="mb-2 text-[14px] font-medium text-[#9a9993]">
                    Statistics
                  </div>
                  <div>
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex min-h-10 items-center justify-between border-b border-[#eeeeea] text-[13px] text-[#72726c]"
                      >
                        <span>{stat.label}</span>
                        <strong className="font-semibold text-[#282825]">
                          {stat.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-[#dce7dd] bg-[#f4faf5] p-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#2e6e45]">
                    <BadgeCheck className="size-[18px]" />
                    Hollywood screenplay active
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-[#657065]">
                    Scene headings, action, character, parenthetical, dialogue,
                    and transitions are normalized for FDX/Fountain export.
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-[#657065]">
                    Current block type: {activeTool}
                  </p>
                </div>

                <div className="debug-hatch mt-7 grid gap-2 overflow-hidden border border-dashed border-[#d2d2cc] p-3">
                  <span className="text-[13px] text-[#8a8982]">
                    Production tools
                  </span>
                  <Button
                    variant="secondary"
                    className="h-8 justify-start bg-white/70 text-[#666660] shadow-none"
                    onClick={onCreateBreakdown}
                  >
                    <WandSparkles data-icon="inline-start" />
                    Generate breakdown
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 justify-start bg-white/70 text-[#666660] shadow-none"
                    onClick={onCreateShotList}
                  >
                    <Clapperboard data-icon="inline-start" />
                    Create shot list
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 justify-start bg-white/70 text-[#666660] shadow-none"
                    onClick={onExportScript}
                  >
                    <Play data-icon="inline-start" />
                    Export {exportLabels[exportFormat]}
                  </Button>
                  <div className="rounded-md bg-[#fcfdfc]/80 px-2.5 py-2 text-[12px] leading-5 text-[#666660]">
                    {productionMessage}
                    <br />
                    Last export: {lastExport}
                  </div>
                </div>
              </>
            ) : (
              <CollaborationPanel
                collaboration={collaboration}
                message={collaborationMessage}
                mutationPending={collaborationMutationPending}
                onRemoveCollaborator={onRemoveCollaborator}
                onUpdateCollaborator={onUpdateCollaborator}
                onRevokeShare={onRevokeShare}
              />
            )}

            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Writer mode</Badge>
              <div className="flex items-center gap-1 text-xs text-[#8a8982]">
                <Users className="size-3.5" />
                {collaboration.collaborators.length} collaborators
              </div>
            </div>
          </div>
        </ScrollArea>
      </section>
    </aside>
  );
}

function InspectorGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5">
      <label className="mb-2 block text-[14px] font-medium text-[#9a9993]">
        {label}
      </label>
      {children}
    </div>
  );
}
