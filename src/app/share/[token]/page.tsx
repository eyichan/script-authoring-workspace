import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, LockKeyhole, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getSharedWorkspaceByToken } from "@/lib/db/workspace";
import type { ScriptBlock, ScriptBlockType, WorkspaceView } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

const blockStyles: Record<ScriptBlockType, string> = {
  scene: "font-bold uppercase tracking-[0.02em]",
  action: "max-w-[58ch]",
  character: "mx-auto w-[28ch] text-center uppercase",
  paren: "mx-auto w-[32ch] text-center italic text-neutral-500",
  dialogue: "mx-auto w-[42ch]",
  transition: "ml-auto w-[28ch] text-right uppercase",
  comment: "max-w-[58ch] text-neutral-500",
  subtitle: "mx-auto w-[46ch] text-center text-neutral-600",
};

const blockLabels: Record<ScriptBlockType, string> = {
  scene: "Scene",
  action: "Action",
  character: "Character",
  paren: "Paren",
  dialogue: "Dialogue",
  transition: "Transition",
  comment: "Comment",
  subtitle: "Subtitle",
};

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const workspace = await getSharedWorkspaceByToken(token);

  if (!workspace) {
    return {
      title: "Shared script not found",
    };
  }

  return {
    title: `${workspace.project.title} - Shared Script`,
    description: `Read-only screenplay review for ${workspace.project.title}.`,
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const workspace = await getSharedWorkspaceByToken(token);

  if (!workspace) {
    notFound();
  }

  return <ReadOnlyShare workspace={workspace} />;
}

function ReadOnlyShare({ workspace }: { workspace: WorkspaceView }) {
  const statistics = [
    { label: "Scenes", value: workspace.scenes.length },
    { label: "Characters", value: workspace.characters.length },
    { label: "Locations", value: workspace.locations.length },
    { label: "Reviewers", value: workspace.collaboration.collaborators.length },
  ];

  return (
    <main className="min-h-screen bg-[#f4f4f2] text-neutral-950">
      <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-[#f4f4f2]/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{workspace.project.title}</p>
              <p className="text-xs text-neutral-500">
                Updated {formatUpdated(workspace.project.updatedAt)}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="h-8 gap-2 rounded-full border-neutral-200 bg-white px-3 text-neutral-700"
          >
            <LockKeyhole className="size-3.5" aria-hidden="true" />
            Read-only review link
          </Badge>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] grid-cols-[220px_minmax(0,1fr)_280px] gap-4 px-6 py-5">
        <aside className="min-h-[calc(100vh-92px)] rounded-[10px] border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <p className="mb-4 text-sm font-semibold">Scenes</p>
          <div className="space-y-2">
            {workspace.scenes.length ? (
              workspace.scenes.map((scene, index) => (
                <a
                  key={scene.id}
                  href={`#block-${scene.sourceBlockId}`}
                  className="block rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs leading-5 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <span className="mr-1 text-neutral-400">{index + 1}.</span>
                  <span className="font-medium">{scene.heading}</span>
                </a>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-neutral-200 px-3 py-2 text-xs leading-5 text-neutral-500">
                No scenes in this shared script yet.
              </p>
            )}
          </div>
        </aside>

        <section className="rounded-[12px] border border-neutral-200 bg-white shadow-sm">
          <div className="flex h-14 items-center justify-center border-b border-neutral-200">
            <div className="inline-flex h-9 items-center rounded-[10px] border border-neutral-200 bg-neutral-100 p-1">
              <span className="flex h-7 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold shadow-sm">
                <FileText className="size-4" aria-hidden="true" />
                Script
              </span>
              <span className="px-4 text-sm text-neutral-400">Cover</span>
            </div>
          </div>
          <div className="flex justify-center px-8 py-9">
            <article className="script-paper min-h-[980px] w-full max-w-[850px] px-[96px] py-[86px] font-mono text-[15px] leading-[1.85] text-neutral-900 shadow-[0_1px_12px_rgb(0_0_0/0.06)]">
              {workspace.blocks.length ? (
                <div className="space-y-3">
                  {workspace.blocks.map((block) => (
                    <ScriptLine key={block.id} block={block} />
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500">This script has no shared pages yet.</p>
              )}
            </article>
          </div>
        </section>

        <aside className="min-h-[calc(100vh-92px)] rounded-[10px] border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Review Info</p>
            <UsersRound className="size-4 text-neutral-500" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            {statistics.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>

          <Separator className="my-5" />

          <p className="mb-3 text-sm font-semibold">Collaborators</p>
          <div className="space-y-2">
            {workspace.collaboration.collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold">
                  {collaborator.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{collaborator.role}</p>
                  <p className="text-xs text-neutral-500">{collaborator.status}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

function ScriptLine({ block }: { block: ScriptBlock }) {
  return (
    <p
      id={`block-${block.id}`}
      className={cn("scroll-mt-24 whitespace-pre-wrap", blockStyles[block.type])}
      aria-label={`${blockLabels[block.type]} line ${block.position}`}
    >
      {block.text || titleCase(block.type)}
    </p>
  );
}
