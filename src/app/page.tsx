import { ScriptForgeDemo } from "@/components/script-forge-demo";
import { getWorkspaceSnapshot } from "@/lib/db/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const snapshot = await getWorkspaceSnapshot();

  return (
    <ScriptForgeDemo
      initialActiveProjectId={snapshot.activeProjectId}
      initialProjects={snapshot.projects}
      initialWorkspace={snapshot.workspace}
      persistenceLabel="Database-backed project lifecycle."
    />
  );
}
