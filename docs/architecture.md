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

Domain code should not import React, Prisma, Next.js, or UI components.

Planned path:

```text
src/lib/domain/
```

Current files:

```text
src/lib/domain/types.ts
src/lib/domain/screenplay.ts
src/lib/domain/seed.ts
```

Current domain behavior:

- `parseSceneHeading` parses `INT./EXT.` style headings into prefix, location, and time of day.
- `deriveScriptEntities` derives scenes, characters, locations, character references, scene dialogue counts, and location character references from ordered script blocks.
- `seedWorkspace` provides a deterministic local workspace for the first functional integration pass.

### Persistence

Persistence owns database schema and data loading/saving.

Planned stack:

- Docker Postgres
- Prisma
- Next.js server actions or route handlers

Planned paths:

```text
prisma/schema.prisma
src/lib/db/
src/app/actions/
```

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
- The floating script toolbar directly appends the clicked screenplay element to the script canvas.
- Adding a scene block creates a derived scene and makes it the active sidebar scene.
- Adding a character block creates or reuses the derived character.
- Adding dialogue after a character increases the derived character and scene dialogue counts.
- Workbench pages receive derived cards instead of static mock cards.

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

Generated/mock modules:

- assets
- generation tasks

Locked module:

- storyboard

## Core Data Flow

```text
User action
  -> create/update/delete ScriptBlock
  -> recalculate derived workspace view
  -> render Sidebar / Script / Scenes / Characters / Locations
```

Implemented local flow:

```text
Floating toolbar click
  -> append ScriptBlock in React state
  -> deriveScriptEntities(scriptId, blocks)
  -> update Script / Sidebar / Statistics / Workbench pages
```

For persistence:

```text
Client interaction
  -> server action
  -> Prisma transaction
  -> script block mutation
  -> derived sync or view recalculation
  -> return WorkspaceView
```

## Verification Gates

Baseline:

- `npm install`
- `npm run lint`
- `npm run build`

Functional:

- browser smoke tests for authoring workflow
- derived entity assertions, either unit tests or deterministic script checks

Persistence:

- Docker Postgres starts
- Prisma migration succeeds
- refresh preserves data

## Open Risks

- The current visual demo is a large single component. It should be split once functional state grows.
- Next.js 16 behavior may differ from older examples. Read local Next docs before adding server-side APIs.
- Characters page in the reference showed inconsistent counters. Our implementation should use one derived calculation instead of reproducing that inconsistency.
- Domain behavior is currently verified by TypeScript build only. Add unit tests or deterministic assertion scripts before the sync logic becomes more complex.
