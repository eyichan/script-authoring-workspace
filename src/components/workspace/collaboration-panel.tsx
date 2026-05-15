"use client";

import { Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { CollaborationState } from "@/lib/domain/types";

type CollaborationPanelProps = {
  collaboration: CollaborationState;
  message: string;
  mutationPending: boolean;
  onRemoveCollaborator: (collaboratorId: string) => void;
  onRevokeShare: () => void;
};

export function CollaborationPanel({
  collaboration,
  message,
  mutationPending,
  onRemoveCollaborator,
  onRevokeShare,
}: CollaborationPanelProps) {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-xl border border-[#dce7dd] bg-[#f4faf5] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[13px] font-semibold text-[#2e6e45]">
            Share link
          </div>
          {collaboration.shareUrl ? (
            <Button
              type="button"
              variant="ghost"
              disabled={mutationPending}
              onClick={onRevokeShare}
              className="h-7 rounded-full px-2 text-[12px] text-[#b0473e] hover:bg-[#f2e8e6] active:translate-y-0"
            >
              Revoke
            </Button>
          ) : null}
        </div>
        <div className="mt-2 break-all rounded-md bg-[#fcfdfc]/90 px-2.5 py-2 text-[12px] leading-5 text-[#58635e]">
          {collaboration.shareUrl ?? "No share link yet"}
        </div>
      </div>

      {collaboration.collaborators.map((reviewer) => (
        <div
          key={reviewer.id}
          className="rounded-xl border border-[#e4e8e6] bg-[#fcfdfc] p-3"
        >
          <div className="flex items-center gap-2">
            <Avatar className="size-8 bg-[#eef3ef]">
              <AvatarFallback className="bg-transparent text-[11px] font-semibold text-[#2e6248]">
                {reviewer.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-[#252522]">
                {reviewer.role}
              </div>
              <div className="text-[12px] text-[#7b827e]">
                {reviewer.status}
              </div>
            </div>
            {reviewer.role !== "Owner" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={mutationPending}
                aria-label={`Remove ${reviewer.role}`}
                onClick={() => onRemoveCollaborator(reviewer.id)}
                className="rounded-full text-[#8d938f] hover:bg-[#f1f4f2] hover:text-[#b0473e] active:translate-y-0"
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
      ))}
      <div className="debug-hatch rounded-xl border border-dashed border-[#d2d2cc] p-3 text-[12px] leading-5 text-[#6f6f68]">
        {message}
      </div>
    </div>
  );
}
