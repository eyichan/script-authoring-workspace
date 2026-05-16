# Reference Workbench Routes And Functional Map

Source evidence:

- `C:/MyTemplates/laper-workspace-reference/notes/script-authoring-interaction-spec.md`
- `C:/MyTemplates/laper-workspace-reference/notes/laper-workspace-design-and-feature-breakdown.md`
- `C:/MyTemplates/laper-workspace-reference/notes/laper-workspace-function-implementation-analysis.md`
- `C:/MyTemplates/laper-workspace-reference/notes/laper-entity-detail-crud-research-2026-05-16.md`

Remote debugging note:

- On 2026-05-15, local Chrome owned port `127.0.0.1:9222`, but `http://127.0.0.1:9222/json/version` and `http://127.0.0.1:9222/json/list` returned `404`.
- Current implementation uses the archived rendered research as the reference baseline until the active Chrome debugging endpoint is reachable again.

## Observed Application Route Shape

The verified script workspace route shape is:

```text
/app/project/<projectId>/ep_1/script
```

Example observed route:

```text
/app/project/3079e539-5a76-41bd-8f29-a30939ff9924/ep_1/script
```

The visible workspace pages are modeled as page states inside the project workspace shell:

- `Script`
- `Beats`
- `Characters`
- `Props`
- `Locations`
- `Storyboard`
- `Scenes`
- `Assets`
- `Design` unavailable state

Project lifecycle pages observed from dashboard research:

- `Recents`
- `Projects`
- `Trash`

## Script Page Behavior

The reference Script page is not a static paper preview.

Observed behavior:

- The lower left contextual section title is `Scenes`.
- A blank script starts with no derived scenes and a canvas scene selector row.
- The floating toolbar inserts typed screenplay blocks into the main canvas.
- Scene blocks are structured around `INT./EXT.`, `LOCATION`, and `DAY/NIGHT`.
- Character blocks use a selector-style row.
- Transition blocks use a selector-style row with common transition values.
- After the user enters a valid scene heading, the script canvas, left scene list, right statistics, Locations page, and Scenes page update.
- After the user enters a character name, the script canvas, right statistics, Characters page list, and character card grid update.
- Dialogue after a character updates scene line statistics.

Implementation implication:

- Toolbar clicks must create editable canvas blocks, not fixed text and not a separate form card.
- Script blocks are the source of truth for Scenes, Characters, and Locations.

## Workbench Page Ownership

Derived from script blocks:

- `Scenes`
- `Characters`
- `Locations`

Manual modules:

- `Beats`
- `Props`

Locked or simulated modules:

- `Storyboard` remains locked for Junior.
- `Assets` exposes generation templates and mock task state first.
- `Design` remains visibly unavailable until implemented.

## Entity Detail Editing

Verified on 2026-05-16 in the authenticated Laper browser session. The session displayed `Offline · editing locally`, so this section describes visible client behavior and UI contracts, not proven server persistence.

### Characters

Characters page:

- tabs: `Overview`, `Relationships`, `Casting`
- primary action: `New Character`
- card contents: generated image placeholder, name, scene count, line count, bio preview, `Generate`, `Edit`
- `New Character` / `Edit Character` fields: Name, Color, Gender, Age, Role/Identity, Bio, Appearance Notes
- `Edit Character` exposes `Delete` and `Save`

### Scenes

Scenes page:

- title: `Scene Board`
- tabs: `Cards`, `Scene List`
- primary action: `Tidy`
- card contents: scene number, still placeholder, heading/title, character count, dialogue line count, page/progress fraction, description preview, `Generate Still`, `Edit`, `Generate Video`
- `Scene List` table columns: Scene, Scene Title, Characters, Count, Lines
- `Edit Scene` fields: read-only Scene number, Pages, Characters, Dialogues, plus Scene Description and Art Requirements
- no Scene delete control was observed in the edit modal

### Locations

Locations page:

- tabs: `Overview`, `Relationships`, `Scout Sheet`
- primary action: `Add`
- card contents: generated image placeholder, location name, scene count, character count, description preview, `Generate`, `Edit`
- `Edit Location` fields: Location Name, Address, Description, Scouting Status, Owner / Site Manager, Phone, Email, Daily Rental, Deposit, Currency, Available From, Available Until, Shooting Hours, Notes
- `Edit Location` exposes `Delete` and `Save`

### Props

Props page:

- tabs: `Overview`, `List`
- primary action: `New Prop`
- card contents: icon/placeholder, name, category, description preview, `Generate`, `Edit`
- `Edit Prop` fields: Name, Theme Color, Category, Description, Image Note
- `Edit Prop` exposes `Delete` and `Save`

## Current Local Implementation Alignment

Implemented:

- Local route `/` renders the project workspace shell.
- Script page uses typed `ScriptBlock` records.
- Floating toolbar inserts editable canvas blocks.
- Editing a scene block updates derived scenes and locations.
- Editing a character block updates derived characters.
- Scenes, Characters, and Locations pages render from derived data.

Not implemented yet:

- Dedicated `/app/project/<projectId>/ep_1/script` route.
- Character selector dropdown/create flow.
- Workbench detail dialogs for Character, Scene, Location, and Prop metadata.
- Script context-menu `Open` routing to corresponding entity pages.
- Dashboard routes for Recents, Projects, and Trash.
- Project settings, version history, publish, and soft-delete menus.
