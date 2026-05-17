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
- script cover
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
- `exports.ts` owns pure FDX, Fountain, and lightweight native PDF export package formatting from ordered script blocks.
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
- `prisma/schema.prisma` defines durable tables for projects, scripts, script blocks, beats, props, asset generation tasks, and workbench entity metadata.
- `prisma.config.ts` keeps the database URL in Prisma config, following Prisma 7 conventions.
- `src/lib/db/prisma.ts` initializes Prisma through `PrismaPg` and keeps a development singleton.
- `prisma/seed.ts` upserts the deterministic local seed workspace into Postgres without deleting existing records.
- `src/lib/db/workspace.ts` maps Prisma records into the domain `WorkspaceView` shape and derives scenes, characters, and locations from persisted script blocks.
- `src/app/actions/projects.ts` persists project create, open, trash, and restore flows through server actions.
- `src/app/actions/script-blocks.ts` persists script block insert, text update, duplicate, delete, and resequencing flows through server actions.
- `src/app/actions/workbench.ts` persists manual Beats, Props, Assets, Character profile metadata, Scene production notes, Location scout metadata, and Script outline text through server actions.
- `src/app/actions/workbench.ts` also persists Script Cover fields and metadata-only deletes for script-derived Character, Scene, and Location detail records.
- `src/app/actions/collaboration.ts` persists invite link creation and collaborator records through server actions.

### UI

UI owns the workspace shell and user interactions.

Existing main file:

```text
src/components/script-forge-demo.tsx
```

Extracted workspace component:

```text
src/components/workspace/collaboration-panel.tsx
src/components/workspace/inspector-panel.tsx
src/components/workspace/project-library.tsx
src/components/workspace/script-editor-canvas.tsx
src/components/workspace/workspace-sidebar.tsx
src/components/workspace/workspace-headers.tsx
src/components/workspace/workbench-pages.tsx
```

This file should continue to be split as functionality grows:

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
- The Script sidebar can add Scene and Character blocks directly into the screenplay source, then focus the inserted block.
- Sidebar Scene/Character insertion commits the current active source block and inserts the new block in one transaction so unblurred edits are not lost.
- Script block textarea edits update the source block text in local state.
- Scene blocks render as structured canvas controls with shared prefix and time-of-day dropdown options plus a location input.
- Adding a valid scene block creates a derived scene and makes it the active sidebar scene.
- Empty or invalid scene selector rows do not create placeholder scene/location entities.
- Character blocks render as editable create/select inputs backed by current derived character names and use screenplay-style cue indentation.
- Dialogue, Parenthetical, and Transition blocks use screenplay-style canvas indentation, with Transition rendered as a right-aligned common-transition dropdown.
- Adding or editing a character block creates or reuses the derived character.
- Adding dialogue after a character increases the derived character and scene dialogue counts.
- Script blocks expose a right-click context menu with `Open`, `Duplicate`, and `Delete`.
- Script block `Open` is routed by the top-level workspace shell: scene blocks navigate to the Scenes workbench and select the derived scene, while character, dialogue, and parenthetical blocks navigate to the Characters workbench and select the linked character cue.
- Duplicate and Delete mutate the source block list, then derived Scenes, Characters, and Locations recalculate from the remaining ordered blocks.
- Workbench pages receive derived cards instead of static mock cards.
- Workbench pages receive the active derived item id from the shell and render selected row/card highlighting so cross-page navigation can reveal the target entity.
- Beats is a manual outline page with local `Beat` creation, sidebar sync, and Arrangement, Beats, and Outline tabs.
- Characters expose Overview, Relationships, and Casting tabs from derived character and scene data.
- Props is a manual production-memory page; `New Prop` creates local `Prop` records instead of mock counters.
- Props expose Overview and List tabs from persisted prop records.
- Locations expose Overview, Relationships, and Scout Sheet tabs from derived location and scene data.
- Scenes expose Cards and Scene List tabs from derived scene data.
- Assets is a generated/imported task page; `Import` creates local `AssetTask` records and Assets expose Generate and Tasks tabs.
- `src/components/workspace/entity-detail-dialog.tsx` owns the shared detail editor overlay for Beat, Character, Scene, Location, and Prop metadata.
- Entity detail saves update production metadata only; script-derived heading and character cue source text remains owned by Script blocks.
- Entity detail delete actions are confirmed. Character, Scene, and Location deletes remove only metadata and preserve source screenplay blocks.
- Script Cover renders editable title, writer, draft date, contact, and notes fields backed by persisted `ScriptCover` data.
- Workbench cards and tables merge profile, production note, scout, prop, and asset metadata into previews instead of only showing derived names and counts.
- Storyboard remains a locked module and reuses the unavailable-module visual pattern.
- Home opens a local Recents project library with Active and Trash sections.
- Projects support local create, open, delete-to-trash, restore, and right-click project actions.
- The inspector export action downloads a real script package from current persisted script blocks. FDX, Fountain, and PDF exports are generated from the same ordered script block source.
- The top-level Invite action creates a persisted project share link and reviewer record, then opens the Collaboration inspector tab.
- The Collaboration inspector tab renders persisted collaborators and the current share link instead of local mock reviewers.
- The Collaboration panel is extracted from the main workspace component; the shell owns state and handlers, while the panel owns share/reviewer controls.

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
  -> create / open / rename / trash / restore server action
  -> Prisma Project/Script mutation or load
  -> return WorkspaceSnapshot
  -> selected Project title and workspace shell update
```

Project rename keeps the first script title synchronized with the project title so exports,
share pages, and the project library present the same workspace name.

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

Implemented Enter-to-next-block flow:

```text
Canvas input Enter
  -> commit current block text and insert next typed block in one server action
  -> Prisma transaction updates current ScriptBlock and creates next ScriptBlock
  -> resequence persisted blocks
  -> return WorkspaceSnapshot plus inserted activeBlockId
  -> client focuses the inserted block without dropping unblurred text
```

Implemented sidebar source insertion flow:

```text
Script sidebar Add Scene / Add Character
  -> prevent quick action from forcing a blur-only save first
  -> commit current active ScriptBlock text and insert preset Scene/Character text in one server action
  -> Prisma transaction updates current ScriptBlock, creates inserted ScriptBlock, and resequences blocks
  -> return WorkspaceSnapshot plus inserted activeBlockId
  -> client focuses the inserted block and recalculates derived entities
```

Implemented persisted workbench flow:

```text
Beats / Props / Assets action
  -> server action
  -> Prisma create Beat / Prop / AssetTask
  -> return WorkspaceSnapshot plus status message
  -> client refreshes cards, sidebar counts, and inspector statistics
```

Implemented persisted workbench delete flow:

```text
Beat row / Prop card / Asset card delete
  -> server action with projectId, scriptId, and record id
  -> Prisma deleteMany constrained to the current script
  -> return WorkspaceSnapshot plus status message
  -> client refreshes workbench records, sidebar counts, and inspector statistics
```

Implemented persisted workbench edit flow:

```text
Beat title / Prop title / Asset title blur or Enter
  -> server action with projectId, scriptId, record id, and edited title
  -> Prisma updateMany constrained to the current script
  -> return WorkspaceSnapshot plus status message
  -> client refreshes workbench records, sidebar counts, and inspector statistics
```

Implemented persisted entity metadata flow:

```text
Character / Scene / Location / Outline detail save
  -> server action with projectId, scriptId, derived entity id, and metadata payload
  -> Prisma upsert constrained by scriptId plus derived entity id
  -> return WorkspaceSnapshot plus status message
  -> client can merge persisted metadata with script-derived entity cards and dialogs
```

Implemented metadata-only delete flow:

```text
Character / Scene / Location detail delete confirmation
  -> server action with projectId, scriptId, and derived entity id
  -> Prisma deleteMany constrained to the metadata table and current script
  -> source ScriptBlock rows remain unchanged
  -> return WorkspaceSnapshot plus status message
```

Implemented persisted cover flow:

```text
Script Cover form save
  -> server action with projectId, scriptId, and cover fields
  -> Prisma upsert ScriptCover by scriptId
  -> return WorkspaceSnapshot plus status message
  -> client rerenders the cover preview from persisted cover fields
```

Implemented persisted collaboration flow:

```text
Invite click
  -> server action
  -> Prisma upsert ProjectShare and create ProjectCollaborator
  -> return WorkspaceSnapshot plus status message
  -> client refreshes Collaboration panel and collaborator count
  -> /share/<token> server route reads ProjectShare
  -> render read-only script, scenes, review stats, and collaborator state
```

Implemented persisted collaboration management flow:

```text
Edit reviewer / Remove reviewer / Revoke share
  -> server action with projectId and collaborator id or share target
  -> Prisma updateMany/deleteMany constrained to the current project
  -> return WorkspaceSnapshot plus status message
  -> client refreshes Collaboration panel and collaborator count
  -> revoked /share/<token> route returns not found
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
- export formatter tests cover ordered Fountain text, Final Draft XML escaping, native PDF structure, and generated package metadata.
- E2E tests assert pressing Enter commits the current unblurred script line before inserting the next block.
- E2E tests assert the Character -> Dialogue -> Character writing sequence persists ordered blocks and updates the Characters page from derived script state.
- E2E tests assert sidebar Scene/Character creation can produce a final exported script with scene, character, and dialogue content.
- E2E tests assert Script Cover fields persist to Postgres.
- E2E tests assert metadata delete confirmation removes character metadata while preserving source script lines.

Persistence:

- Docker Postgres starts
- Prisma migration succeeds
- Prisma schema validates
- Prisma Client generates
- Seed writes deterministic workspace records
- refresh preserves data
- E2E tests assert Postgres rows after browser interactions
- E2E tests assert Beat, Prop, and Asset records can be deleted from the UI and removed from Postgres.
- E2E tests assert Beat, Prop, and Asset titles can be edited from the UI and persisted to Postgres.
- E2E tests assert invite link and collaborator rows after browser interactions
- E2E tests open the generated `/share/<token>` route and assert shared script content and reviewer state render from persisted records
- E2E tests assert reviewer role/status can be edited, reviewers can be removed, and revoked share links return 404.
- E2E tests assert project rename updates both `Project.title` and the first `Script.title`, then survives refresh.

## Open Risks

- The current workspace shell still owns broad state and page orchestration. Continue splitting orchestration boundaries when future changes touch those areas.
- Next.js 16 behavior may differ from older examples. Read local Next docs before adding server-side APIs.
- Characters page in the reference showed inconsistent counters. Our implementation should use one derived calculation instead of reproducing that inconsistency.
- Domain behavior is covered by deterministic tests for screenplay parsing, block operations, project lifecycle, and export formatting. Add targeted tests with future domain expansions.
- PDF export uses a lightweight native PDF generator in the domain layer. Rich screenplay pagination and multi-page layout remain future product hardening work.
