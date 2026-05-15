# Script Authoring Workspace Architecture

## Current Baseline

The project starts as a copied Next.js + shadcn visual demo from:

```text
C:/MyProjects/script-format-demo-next
```

The first implementation goal is to preserve the existing Laper-like layout while replacing mock screenplay data with a real workspace model.

## Main Boundaries

### Domain

Domain code owns screenplay concepts and pure transformations:

- project
- script
- script block
- scene
- character
- location
- beat
- prop
- asset task
- trash / project lifecycle
- collaboration state

Domain code should not import React, Prisma, Next.js, or UI components.

Planned path:

```text
src/lib/domain/
```

Current files:

```text
src/lib/domain/types.ts
src/lib/domain/screenplay.ts
src/lib/domain/script-blocks.ts
src/lib/domain/projects.ts
src/lib/domain/seed.ts
```

Current domain behavior:

- `parseSceneHeading` parses `INT./EXT.` style headings into prefix, location, and time of day.
- `deriveScriptEntities` derives scenes, characters, locations, character references, scene dialogue counts, and location character references from ordered script blocks.
- `script-blocks.ts` owns pure insert, update, duplicate, delete, and position resequencing operations for script blocks.
- `projects.ts` owns pure local project creation, trash, restore, and active/trashed filtering operations.
- `exports.ts` owns pure FDX, Fountain, and printable HTML export package formatting from ordered script blocks.
- `seedWorkspace` provides a deterministic local workspace for the first functional integration pass.

### Persistence

Persistence owns database schema and data loading/saving.

Current stack:

- Docker Postgres
- Prisma 7
- `@prisma/adapter-pg`

Planned stack:

- Next.js server actions or route handlers

Current paths:

```text
.env.example
prisma/schema.prisma
prisma/migrations/
prisma/seed.ts
prisma.config.ts
docker-compose.yml
src/lib/db/prisma.ts
src/lib/db/workspace.ts
src/app/actions/projects.ts
src/app/actions/script-blocks.ts
src/app/actions/workbench.ts
```

Planned paths:

```text
src/lib/db/
src/app/actions/
```

Current persistence behavior:

- `docker-compose.yml` runs local Postgres 17 on host port `54329`.
- `.env.example` uses `127.0.0.1` instead of `localhost` because Prisma could not reach the Docker-published port through `localhost` on this host.
- `prisma/schema.prisma` defines durable tables for projects, scripts, script blocks, beats, props, and asset generation tasks.
- `prisma.config.ts` keeps the database URL in Prisma config, following Prisma 7 conventions.
- `src/lib/db/prisma.ts` initializes Prisma through `PrismaPg` and keeps a development singleton.
- `prisma/seed.ts` upserts the deterministic local seed workspace into Postgres without deleting existing records.
- `src/lib/db/workspace.ts` maps Prisma records into the domain `WorkspaceView` shape and derives scenes, characters, and locations from persisted script blocks.
- `src/app/actions/projects.ts` persists project create, open, trash, and restore flows through server actions.
- `src/app/actions/script-blocks.ts` persists script block insert, text update, duplicate, delete, and resequencing flows through server actions.
- `src/app/actions/workbench.ts` persists manual Beats, Props, and Assets creation/import flows through server actions.
- `src/app/actions/collaboration.ts` persists invite link creation and collaborator records through server actions.

### UI

UI owns the workspace shell and user interactions.

Existing main file:

```text
src/components/script-forge-demo.tsx
```

This file should be split as functionality grows:

```text
src/components/workspace/app-shell.tsx
src/components/workspace/script-editor.tsx
src/components/workspace/sidebar.tsx
src/components/workspace/inspector.tsx
src/components/workspace/workbench-pages.tsx
src/components/workspace/dialogs/
```

Current UI behavior:

- The Script page renders ordered `ScriptBlock` records instead of static screenplay lines.
- The floating script toolbar directly appends an editable screenplay block to the script canvas.
- Script block textarea edits update the source block text in local state.
- Scene blocks render as structured canvas controls for `INT./EXT.`, location input, and `DAY/NIGHT`.
- Adding a valid scene block creates a derived scene and makes it the active sidebar scene.
- Empty or invalid scene selector rows do not create placeholder scene/location entities.
- Character blocks render as editable create/select inputs backed by current derived character names.
- Adding or editing a character block creates or reuses the derived character.
- Adding dialogue after a character increases the derived character and scene dialogue counts.
- Script blocks expose a right-click context menu with `Open`, `Duplicate`, and `Delete`.
- Duplicate and Delete mutate the source block list, then derived Scenes, Characters, and Locations recalculate from the remaining ordered blocks.
- Workbench pages receive derived cards instead of static mock cards.
- Beats is a manual outline page with local `Beat` creation, sidebar sync, and card/list rendering.
- Props is a manual production-memory page; `New Prop` creates local `Prop` records instead of mock counters.
- Assets is a generated/imported task page; `Import` creates local `AssetTask` records and supports still/video tab filtering by title.
- Storyboard remains a locked module and reuses the unavailable-module visual pattern.
- Home opens a local Recents project library with Active and Trash sections.
- Projects support local create, open, delete-to-trash, restore, and right-click project actions.
- The inspector export action downloads a real script package from current persisted script blocks. FDX and Fountain are file exports; PDF currently downloads a printable HTML package that can be printed to PDF by the browser.
- The top-level Invite action creates a persisted project share link and reviewer record, then opens the Collaboration inspector tab.
- The Collaboration inspector tab renders persisted collaborators and the current share link instead of local mock reviewers.

### State

M1 uses local React state for fast functional validation.

M3 moves durable state to Postgres while keeping a normalized workspace view model for rendering.

## Source Of Truth

Script blocks are the source of truth for:

- scenes
- characters
- locations
- scene statistics

Manual modules:

- beats
- props
- assets imported/generated task records

Generated/local-only modules:

- scene still generation UI state

Locked module:

- storyboard

## Core Data Flow

```text
User action
  -> create/update/delete ScriptBlock
  -> recalculate derived workspace view
  -> render Sidebar / Script / Scenes / Characters / Locations
```

Project lifecycle flow:

```text
Home / project selector
  -> Recents project library
  -> server action
  -> Prisma Project/Script mutation or load
  -> return WorkspaceSnapshot
  -> selected Project title and workspace shell update
```

Implemented local flow:

```text
Floating toolbar click
  -> append editable ScriptBlock in React state
  -> focus inserted canvas block
  -> user edits source text or structured scene/character controls
  -> deriveScriptEntities(scriptId, blocks)
  -> update Script / Sidebar / Statistics / Workbench pages
```

For persistence:

```text
Client interaction
  -> server action
  -> Prisma transaction
  -> script block mutation
  -> derived view recalculation from persisted ScriptBlock rows
  -> return WorkspaceSnapshot
```

Implemented persisted script block flow:

```text
Floating toolbar click / context menu action / input blur
  -> server action
  -> Prisma mutation
  -> script block position resequencing when needed
  -> return WorkspaceSnapshot plus activeBlockId
  -> client refreshes local render state and focuses the returned block
```

Implemented persisted workbench flow:

```text
Beats / Props / Assets action
  -> server action
  -> Prisma create Beat / Prop / AssetTask
  -> return WorkspaceSnapshot plus status message
  -> client refreshes cards, sidebar counts, and inspector statistics
```

Implemented persisted collaboration flow:

```text
Invite click
  -> server action
  -> Prisma upsert ProjectShare and create ProjectCollaborator
  -> return WorkspaceSnapshot plus status message
  -> client refreshes Collaboration panel and collaborator count
```

## Verification Gates

Baseline:

- `npm install`
- `npm run lint`
- `npm run build`
- `npm test`

Functional:

- browser smoke tests for authoring workflow
- Playwright E2E tests for persisted project, script block, and workbench flows
- derived entity assertions, either unit tests or deterministic script checks
- current deterministic tests live in `src/lib/domain/*.test.ts` and cover scene heading parsing, block insertion, text editing, duplicate/delete, empty scene rows, derived scene/character/location sync, and project lifecycle trash/restore behavior.
- current E2E tests live in `tests/e2e/*.spec.ts` and run against a production `next start` server on port `3100`.
- export formatter tests cover ordered Fountain text, Final Draft XML escaping, and generated package metadata.

Persistence:

- Docker Postgres starts
- Prisma migration succeeds
- Prisma schema validates
- Prisma Client generates
- Seed writes deterministic workspace records
- refresh preserves data
- E2E tests assert Postgres rows after browser interactions
- E2E tests assert invite link and collaborator rows after browser interactions

## Open Risks

- The current visual demo is a large single component. It should be split once functional state grows.
- Next.js 16 behavior may differ from older examples. Read local Next docs before adding server-side APIs.
- Characters page in the reference showed inconsistent counters. Our implementation should use one derived calculation instead of reproducing that inconsistency.
- Domain behavior is currently verified by TypeScript build only. Add unit tests or deterministic assertion scripts before the sync logic becomes more complex.
- PDF export is currently a printable HTML package, not a native binary PDF. Native PDF output should be added through a server-side renderer if required.
