# Script Authoring Workspace Progress

## Current Step

M1. Local functional workspace

## Completed

- Created `C:/MyProjects/script-authoring-workspace`.
- Copied the visual demo from `C:/MyProjects/script-format-demo-next`.
- Excluded `.git`, `.next`, `node_modules`, and `next-dev.log` from the copy.
- Initialized a new Git repository.
- Added implementation plan and architecture records.
- Renamed project metadata to `script-authoring-workspace`.
- Installed dependencies.
- Verified shadcn project context.
- Ran baseline lint and production build.
- Committed M0 baseline as `8d566e3`.
- Added domain types, screenplay parsing, derived entity sync, and seed workspace.
- Re-ran lint and build after domain code.
- Committed domain foundation as `e13cfd9`.
- Added `.gitignore` for local dev error logs as `53c610d`.
- Refactored the main workspace UI to read script blocks from `seedWorkspace`.
- Added local block insertion from the floating script toolbar.
- Linked script block changes to derived Scenes, Characters, Locations, sidebar items, statistics, and workbench cards.
- Corrected the insertion interaction so toolbar clicks append directly to the script canvas, matching the reference workflow.
- Replaced fixed inserted text with editable canvas blocks that focus immediately after toolbar insertion.
- Fixed derived scene sync so empty scene selector rows no longer create `UNTITLED LOCATION` entities.
- Added reference route and workbench ownership notes in `docs/reference-workbench-routes.md`.

## In Progress

- M1 local functional workspace.

## Next

1. Finish the local Script editor before database work:
   - structured Scene block with `INT./EXT.`, `LOCATION`, and `DAY/NIGHT` controls
   - structured Character block with create/select behavior
   - Enter-key next-block flow: Scene -> Action, Character -> Dialogue, Dialogue -> Character/Action
   - left scene item click focuses or scrolls to the source scene block
2. Add script block edit/delete and context menu actions.
3. Add deterministic domain/UI tests for insertion, editing, deletion, and derived entity sync.
4. Implement manual modules: Beats, Props, Assets mock tasks, Storyboard locked state.
5. Add local project creation/deletion flow.
6. Move local state to Postgres/Prisma persistence only after the local authoring workflow is verified.

## Verification Log

- `npm install`: succeeded. npm reported 2 moderate audit findings; not fixed in baseline because `npm audit fix --force` may introduce breaking dependency changes.
- `npm run lint`: succeeded.
- `npm run build`: succeeded.
- `npx shadcn@latest info`: succeeded; confirmed Next.js 16.2.6, Tailwind v4, shadcn base-nova, base primitives, lucide icons.
- After adding domain foundation:
  - `npm run lint`: succeeded.
  - `npm run build`: succeeded.
- After wiring local authoring interactions:
  - `npm run lint`: succeeded.
  - `npm run build`: succeeded.
- After replacing fixed inserts with editable canvas blocks:
  - `npm run lint`: succeeded.
  - `npm run build`: succeeded.
  - Browser smoke test succeeded: clicked `Scene`, typed `EXT. TEST RANGE - NIGHT` in the canvas block, verified left Scenes and Scene Board count/card updated to 2, and confirmed no console warning/error.

## Decisions

- Existing visual demo remains as a reference project.
- New project owns functional implementation.
- Use local state first, then Postgres/Prisma persistence.
- Script-derived entities and manual production modules remain separate by design.
- Track dependency audit separately from baseline setup.
- Keep domain sync pure and independent from React, Next.js, and Prisma.
- Keep the first functional pass local-state only so workflow behavior can be validated before introducing persistence.
- Do not start Postgres/Prisma until the local editable Script workflow can create custom Scene, Character, and Dialogue blocks and update derived pages from user-entered text.
