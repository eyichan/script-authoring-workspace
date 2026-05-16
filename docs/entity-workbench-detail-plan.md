# Entity Workbench Detail Plan

## Objective

Bring the local workbench closer to the verified Laper workflow by adding reference-aligned Beat planning and detail editing for Characters, Scenes, Locations, and Props while preserving script blocks as the source of truth.

## Evidence

Primary reference:

- `C:/MyTemplates/laper-workspace-reference/notes/laper-entity-detail-crud-research-2026-05-16.md`

Supporting references:

- `C:/MyTemplates/laper-workspace-reference/notes/script-authoring-interaction-spec.md`
- `C:/MyTemplates/laper-workspace-reference/notes/laper-workspace-design-and-feature-breakdown.md`
- `C:/MyTemplates/laper-workspace-reference/notes/laper-workspace-function-implementation-analysis.md`

## Current Local State

Implemented:

- Script blocks are persisted and typed.
- Scene, Character, and Location entities derive from script blocks.
- Props, Beats, and Assets have persisted manual records.
- Workbench pages render cards/lists from derived or persisted data.
- Scene format selectors and Transition selector now exist in the script canvas.

Missing:

- Workbench detail dialogs for Characters, Scenes, Locations, and Props.
- Reference-aligned Beat `Arrangement`, `Beats`, and `Outline` views.
- Metadata persistence for derived entity details.
- Script context-menu `Open` routing to the corresponding workbench entity.
- Selected workbench entity state and visible selected-card treatment.
- Guarded delete semantics for entity metadata.

## Product Rules

1. Script source remains canonical.
2. Workbench detail pages edit production metadata, not hidden copies of screenplay text.
3. Scene heading edits happen in the Script canvas.
4. Scene detail edits update scene description and art requirements.
5. Character detail edits update profile metadata. Renaming script mentions is a separate explicit action.
6. Location detail edits update scout/contact/cost/availability metadata.
7. Prop detail edits update manual prop metadata.
8. Beat editing remains manual and supports inline content editing plus modal color/delete controls.
9. Delete must name the affected record and require confirmation.

## Data Model Additions

Add persisted records keyed by script/project and stable derived ids:

- `CharacterProfile`
  - `scriptId`
  - `characterId`
  - `displayName`
  - `color`
  - `gender`
  - `age`
  - `role`
  - `bio`
  - `appearanceNotes`
- `SceneProductionNote`
  - `scriptId`
  - `sceneId`
  - `description`
  - `artRequirements`
  - `stillStatus`
  - `videoStatus`
- `LocationProfile`
  - `scriptId`
  - `locationId`
  - `displayName`
  - `address`
  - `description`
  - `scoutingStatus`
  - `ownerName`
  - `phone`
  - `email`
  - `dailyRental`
  - `deposit`
  - `currency`
  - `availableFrom`
  - `availableUntil`
  - `shootingHours`
  - `notes`
- Expand `Prop`
  - `themeColor`
  - `category`
  - `description`
  - `imageNote`
- Expand `Beat`
  - `color`
  - `order`
  - `durationMinutes`
  - `description`
- Add `ScriptOutline`
  - `scriptId`
  - `text`

## UI Plan

### Shared Foundation

Create a detail dialog pattern for workbench entities:

- Modal title and subtitle.
- Scrollable field groups.
- Save button.
- Delete button only where the reference shows deletion or where the entity is manual.
- Confirm dialog for destructive delete.

### Beats

Page should show:

- left contextual beat list
- draggable reorder affordance
- tabs: Arrangement, Beats, Outline
- `Add` primary action

`Beats` tab should include:

- selected beat number
- inline beat title input
- inline beat description textarea
- date/title treatment consistent with the reference

`Arrangement` tab should include:

- timeline scale
- beat card with title, description preview, duration, and `Edit beat`
- `Tidy` action

`Outline` tab should include:

- project title
- multiline outline editor

Dialog should include:

- Beat Name
- Color
- Description
- Delete and Save for edit

### Characters

Card should show:

- generated placeholder or portrait state
- character name
- scene count
- line count
- bio preview
- `Generate`
- `Edit`

Dialog should include:

- Name
- Color
- Gender: Not Set, Male, Female, Other
- Age
- Role/Identity
- Bio
- Appearance Notes

### Scenes

Card should show:

- scene number
- still placeholder
- heading/title
- character count
- dialogue line count
- page/progress fraction
- description preview
- `Generate Still`
- `Edit`
- `Generate Video`

Dialog should include:

- read-only scene number, page fraction, character count, dialogue count
- Scene Description
- Art Requirements

### Locations

Card should show:

- generated placeholder
- location name
- scene count
- character count
- description preview
- `Generate`
- `Edit`

Dialog should include:

- Location Name
- Address
- Description
- Scouting Status: Pending, Scouted, Approved, Rejected
- Owner / Site Manager
- Phone
- Email
- Daily Rental
- Deposit
- Currency
- Available From
- Available Until
- Shooting Hours
- Notes

### Props

Card should show:

- icon or generated placeholder
- prop name
- category
- description preview
- `Generate`
- `Edit`

Dialog should include:

- Name
- Theme Color
- Category
- Description
- Image Note

## Navigation Plan

Update script block context-menu `Open`:

- Scene block opens `Scenes` and selects the matching scene.
- Character block opens `Characters` and selects the matching character.
- Dialogue and Paren blocks open the nearest preceding character.
- Action, Transition, Comment, and Subtitle remain source-block focused unless a future linked entity exists.

Workbench sidebar selection:

- On Script page: selecting a scene focuses the source script block.
- On workbench pages: selecting an item selects the entity in that page and should not jump back to Script.

## Implementation Slices

### Slice 1: Navigation And Selection

- Add `openBlockDestination`.
- Add selected workbench entity state.
- Highlight selected cards/list rows.
- Fix Scenes sidebar selection so it does not return to Script when already in a workbench page.

Verification:

- Browser: right-click Scene `Open` opens Scenes and highlights the scene.
- Browser: right-click Character `Open` opens Characters and highlights the character.

### Slice 2: Scene Detail Metadata

- Add `SceneProductionNote` persistence.
- Add `Edit Scene` dialog.
- Show description preview on scene cards.

Verification:

- E2E: edit scene description, refresh, verify card preview persists.

### Slice 2A: Beat Planning Alignment

- Add Arrangement / Beats / Outline tab views.
- Add beat color and duration fields to persistence.
- Keep inline title/description editing for the selected beat.
- Add `New Beat` and `Edit Beat` dialogs with color and delete controls.
- Add outline persistence.

Verification:

- E2E: create a beat, edit title/description inline, edit color in modal, refresh, verify.
- E2E: switch Arrangement / Beats / Outline and verify each view renders.

### Slice 3: Character Profile Metadata

- Add `CharacterProfile` persistence.
- Add `New Character` and `Edit Character` dialogs.
- Merge profile metadata into derived character cards.

Verification:

- E2E: create/edit profile, refresh, verify card fields persist.
- E2E: script-derived character still appears without a profile.

### Slice 4: Location Scout Metadata

- Add `LocationProfile` persistence.
- Add `Edit Location` dialog.
- Add `Scout Sheet` table view.

Verification:

- E2E: edit scouting status/contact/cost fields, refresh, verify.

### Slice 5: Prop Detail Dialog Alignment

- Replace prop inline title-only editing with the full detail dialog.
- Keep existing persisted prop create/update/delete actions but expand payload fields.

Verification:

- E2E: create/edit/delete prop with category, description, and image note.

### Slice 6: Delete Semantics

- Add confirmation dialogs for profile/manual entity deletion.
- Do not delete script-derived source blocks from workbench detail dialogs.
- For derived entities, delete only metadata unless a separate script-source delete flow is explicitly chosen.

Verification:

- E2E: deleting character profile leaves source script character block intact.
- E2E: deleting prop removes the manual prop record.

## Acceptance Criteria

- Workbench cards expose reference-aligned internal data and actions.
- Beat page supports Arrangement, inline Beat editing, Outline, modal create/edit, and guarded delete.
- Entity detail dialogs persist metadata across refresh.
- Script-derived entity identity remains stable enough to retain metadata.
- Right-click `Open` routes to the corresponding entity page where a corresponding entity exists.
- Destructive actions are confirmed and scoped.
- `npm test`, `npm run lint`, `npm run build`, and targeted E2E pass.

## Risks

- Derived ids based only on display text can lose metadata if a scene heading or character name changes. Mitigation: keep `sourceBlockId` / `sourceBlockIds` and add migration logic for metadata reassignment.
- Character profile creation can conflict with script-derived characters. Mitigation: normalize by canonical name and merge profile metadata by id.
- Scene detail should not become a second screenplay editor. Mitigation: keep heading fields read-only in the Scene dialog.
