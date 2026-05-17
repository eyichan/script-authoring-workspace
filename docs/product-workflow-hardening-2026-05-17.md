# Product Workflow Hardening Report

Date: 2026-05-17

## Goal

Harden the public script-authoring template so the Script page can support a writer workflow from sidebar-created scenes and characters through a downloadable final script, while closing the previously deferred metadata and cover gaps.

## Evidence Used

- Local implementation review of `src/components/script-forge-demo.tsx`, `workspace-sidebar.tsx`, `workbench-pages.tsx`, `entity-detail-dialog.tsx`, server actions, and Prisma schema.
- Existing reference plan in `docs/entity-workbench-detail-plan.md`.
- Browser-level Playwright coverage in `tests/e2e/workspace-persistence.spec.ts`.
- Local Next.js 16 bundled docs after dependency install: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`.

## Product Gap Analysis

Required writer path:

1. Start from the Script page.
2. Add a Scene from the sidebar.
3. Add a Character from the sidebar.
4. Continue into Dialogue and produce a valid screenplay sequence.
5. Add production metadata from workbench detail pages.
6. Edit the Script Cover.
7. Export the final script package.

Gaps found:

- Sidebar actions only selected existing scene items; they could not create screenplay source blocks.
- Script sidebar showed scene source links only; character source links were not selectable from the Script page.
- Sidebar insertion raced with current-line blur persistence. A click could start a blur save and drop the insert because script mutations are guarded against overlapping requests.
- Detail dialogs saved metadata but did not provide a guarded delete path.
- Character, Scene, and Location metadata deletion needed to remove only metadata and preserve screenplay source blocks.
- Workbench overview cards and tables did not surface enough of the saved metadata, so detail edits were hard to see without reopening dialogs.
- Cover tab displayed fixed sample text and had no persistent fields.

## Implementation Decisions

- Keep screenplay source canonical in `ScriptBlock` rows.
- Keep Character, Scene, and Location metadata as production overlays keyed by derived entity ids.
- Add `ScriptCover` as one row per script because cover data is script-level metadata, not screenplay body text.
- Add optional inserted text to the commit-and-insert transaction so sidebar insertion can commit the current unblurred line and create the next block atomically.
- Prevent sidebar quick-action mouse down from triggering blur before the combined insert action runs.
- Confirm destructive detail-dialog actions in the dialog itself. For derived entities, delete only metadata. For manual Beat/Prop records, delete the persisted record.
- Leave global confirmation for direct card/list delete icons as a follow-up because the requested hardening item was detail metadata delete confirmation.

## Implemented Capabilities

- Editable Script Cover fields:
  - Title
  - Written By
  - Draft Date
  - Contact
  - Notes
- Script sidebar quick actions:
  - Add Scene
  - Add Character
- Script sidebar entity selection:
  - Scene item focuses its source scene block.
  - Character item focuses its first source character block.
- Metadata delete confirmation:
  - Beat detail delete removes the manual beat record.
  - Prop detail delete removes the manual prop record.
  - Character metadata delete keeps character/dialogue script lines.
  - Scene metadata delete keeps the scene heading and linked blocks.
  - Location metadata delete keeps scene headings.
- Richer previews:
  - Character cards use profile name, role, gender, age, bio, and line counts.
  - Character Casting table uses profile role and notes.
  - Location cards and Scout Sheet use scouting/contact/cost/availability metadata.
  - Scene cards show production description, art requirements, still status, and video status.
  - Prop cards show category, description, theme color, and image note state.
  - Asset cards include status, type, and created date.

## Verification

Commands run successfully:

- `npm run lint`
- `npm test`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate deploy`
- `npm run build`
- `npm run test:e2e`

E2E result:

- 11 Playwright tests passed.
- Added coverage for sidebar-created Scene and Character blocks, Cover persistence, FDX export content, and metadata delete confirmation preserving source script lines.

## Remaining Hardening

- Confirm direct destructive icon buttons in Beat/Prop/Asset list and card surfaces, or route them through the same confirmation component.
- Decide whether cover fields should also feed export title pages for FDX/PDF. Current exports still use `script.title` as the package title.
- Add explicit UI copy or affordance for "delete metadata only" on derived entity cards if delete becomes available outside the detail dialog.
- Add source-rename flows for Character and Scene if users expect metadata display-name edits to rewrite script text.
