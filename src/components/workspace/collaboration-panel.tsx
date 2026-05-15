"use client";

import { Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { CollaborationState } from "@/lib/domain/types";

const collaboratorStatuses = ["Invited", "Reviewing", "Commenting", "Approved"];

type CollaborationPanelProps = {
  collaboration: CollaborationState;
  message: string;
  mutationPending: boolean;
  onRemoveCollaborator: (collaboratorId: string) => void;
  onUpdateCollaborator: (
    collaboratorId: string,
    role: string,
    status: string,
  ) => void;
  onRevokeShare: () => void;
};

export function CollaborationPanel({
  collaboration,
  message,
  mutationPending,
  onRemoveCollaborator,
  onUpdateCollaborator,
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
              {reviewer.role === "Owner" ? (
                <>
                  <div className="text-[13px] font-medium text-[#252522]">
                    {reviewer.role}
                  </div>
                  <div className="text-[12px] text-[#7b827e]">
                    {reviewer.status}
                  </div>
                </>
              ) : (
                <div className="grid gap-1.5">
                  <label htmlFor={`collaborator-role-${reviewer.id}`} className="sr-only">
                    Collaborator role {reviewer.role}
                  </label>
                  <input
                    id={`collaborator-role-${reviewer.id}`}
                    name={`collaborator-role-${reviewer.id}`}
                    aria-label={`Collaborator role ${reviewer.role}`}
                    defaultValue={reviewer.role}
                    disabled={mutationPending}
                    spellCheck={false}
                    onBlur={(event) => {
                      const nextRole = event.target.value.trim();
                      if (nextRole && nextRole !== reviewer.role) {
                        onUpdateCollaborator(
                          reviewer.id,
                          nextRole,
                          reviewer.status,
                        );
                      } else {
                        event.target.value = reviewer.role;
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                      if (event.key === "Escape") {
                        event.currentTarget.value = reviewer.role;
                        event.currentTarget.blur();
                      }
                    }}
                    className="w-full border-0 bg-transparent p-0 text-[13px] font-medium text-[#252522] outline-none focus:bg-[#f8faf9] disabled:opacity-60"
                  />
                  <label
                    htmlFor={`collaborator-status-${reviewer.id}`}
                    className="sr-only"
                  >
                    Collaborator status {reviewer.role}
                  </label>
                  <select
                    id={`collaborator-status-${reviewer.id}`}
                    name={`collaborator-status-${reviewer.id}`}
                    aria-label={`Collaborator status ${reviewer.role}`}
                    value={reviewer.status}
                    disabled={mutationPending}
                    onChange={(event) =>
                      onUpdateCollaborator(
                        reviewer.id,
                        reviewer.role,
                        event.target.value,
                      )
                    }
                    className="w-fit border-0 bg-transparent p-0 text-[12px] text-[#7b827e] outline-none focus:bg-[#f8faf9] disabled:opacity-60"
                  >
                    {collaboratorStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
