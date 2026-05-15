# Script Authoring Workspace Implementation Plan

## Objective

Build a usable screenplay authoring workspace inspired by the Laper workflow research, not a static visual demo.

The product should let a writer create a project, write structured screenplay blocks, and have scenes, characters, and locations update from the script as the source of truth.

## Source References

- `C:/MyTemplates/laper-workspace-reference/notes/script-authoring-interaction-spec.md`
- `C:/MyTemplates/laper-workspace-reference/notes/laper-workspace-design-and-feature-breakdown.md`
- `C:/MyTemplates/laper-workspace-reference/notes/laper-workspace-function-implementation-analysis.md`
- Visual baseline: `C:/MyProjects/script-format-demo-next`

## Problem Frame

Current state:

- The copied project preserves a Laper-like shell and visual layout.
- The editor is still mostly static mock content.
- There is no durable screenplay data model, project lifecycle, or persistence.

Target state:

- A user can create and edit a screenplay project.
- Script blocks are typed entities: scene, action, character, paren, dialogue, transition, comment, subtitle.
- Scenes, characters, and locations derive from script blocks.
- Beats and props are manually authored modules in the MVP.
- Storyboard remains visibly locked.
- Assets expose generation templates and task state without real credit-consuming AI generation.
- Data persists in Postgres.

Gap:

- Need to replace static UI state with a block-backed workspace model, then persist it.

Success criteria:

- User can create scene `INT. MOON BASE - NIGHT`.
- Left Script sidebar and Scenes page update from that scene block.
- User can create character `COMMANDER LIN`.
- Characters page updates from the character block.
- User can add dialogue linked to active character and active scene.
- Locations page updates from scene headings.
- Beats and props can be manually created.
- Refresh preserves the workspace after persistence is added.
- Soft-delete moves projects to Trash and allows restore.

## Reuse-First Architecture

Reuse targets:

- Next.js App Router for app shell, route handlers, and server actions.
- React for interactive editor state.
- shadcn/ui source components for UI primitives and overlays.
- Prisma for schema, migrations, and type-safe Postgres access.
- Postgres in Docker for local persistence.
- Zod can be added later if route payload validation becomes necessary.

Glue boundary:

- Keep screenplay domain types and derived sync logic independent from Prisma and React.
- Keep UI components reading a normalized workspace view model.
- Keep persistence adapters behind server actions or route handlers.

Custom scope:

- Screenplay block model.
- Scene heading parser and canonical name normalization.
- Derived entity recalculation.
- Laper-like workspace UI interactions.
- Project soft-delete lifecycle.

## Milestones

### M0. Project Baseline

Goal: establish an owned project that can run independently from the visual reference demo.

Tasks:

1. Copy the visual demo into `C:/MyProjects/script-authoring-workspace`.
2. Rename package and README to the new project.
3. Add implementation/progress/architecture docs.
4. Install dependencies.
5. Run lint and build.
6. Commit baseline.

Acceptance:

- `npm install` succeeds.
- `npm run lint` succeeds.
- `npm run build` succeeds.
- Git history starts from an owned baseline.

### M1. Local Functional Workspace

Goal: make the app usable without a database first.

Tasks:

1. Add domain types for projects, scripts, blocks, scenes, characters, locations, props, beats, and assets.
2. Add seed workspace state.
3. Add pure derived sync functions:
   - parse scene heading
   - derive scenes
   - derive characters
   - derive locations
   - calculate scene stats
4. Replace static screenplay array with mutable block state.
5. Implement toolbar insertion:
   - Scene selector
   - Action input
   - Character selector
   - Dialogue input
6. Update left Script sidebar from derived scenes.
7. Update Scenes, Characters, and Locations pages from derived entities.

Acceptance:

- Browser workflow can create a scene, character, and dialogue.
- Derived sidebars/cards update immediately.
- No page reload persistence yet.
- Lint passes.

### M2. Manual Modules

Goal: model non-derived production modules.

Tasks:

1. Implement manual Beats creation.
2. Implement manual Props creation.
3. Preserve Storyboard locked state.
4. Implement Assets generation template dialogs with mock task creation.
5. Add local task list and status display.

Acceptance:

- Beats and props are created manually.
- Assets can create mock tasks without external AI.
- Storyboard shows locked/paywall state.
- Lint passes.

### M3. Persistence

Goal: persist the workspace in Postgres.

Tasks:

1. Add Docker Compose Postgres.
2. Add Prisma.
3. Define schema and migrations.
4. Add seed script.
5. Add server actions or route handlers for:
   - list projects
   - create project
   - get workspace
   - create/update/delete block
   - create/update manual beat
   - create/update manual prop
   - create asset task
6. Recalculate derived entities after block mutations.

Acceptance:

- Refresh preserves data.
- `npx prisma migrate dev` succeeds.
- `npm run lint` and `npm run build` succeed.

### M4. Project Lifecycle

Goal: support dashboard project management.

Tasks:

1. Add dashboard pages: Recents, Projects, Trash.
2. Add new script creation.
3. Add project card context menu.
4. Implement soft delete.
5. Implement restore.
6. Implement permanent delete behind explicit confirmation.

Acceptance:

- Project can move to Trash.
- Trash shows deletion countdown metadata.
- Project can be restored.
- Permanent delete is separate and guarded.

### M5. Verification Pass

Goal: verify the workflow as a product.

Tasks:

1. Run lint/build.
2. Run browser smoke test for:
   - blank project creation
   - scene creation
   - character creation
   - dialogue creation
   - derived pages
   - manual beats/props
   - asset task mock
   - soft delete/restore
3. Capture final screenshots only if useful.
4. Update docs with final architecture and gaps.

Acceptance:

- The app is usable as a local screenplay authoring workspace.
- Remaining limitations are documented.

