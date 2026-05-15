# Reference Workbench Routes And Functional Map

Source evidence:

- `C:/MyTemplates/laper-workspace-reference/notes/script-authoring-interaction-spec.md`
- `C:/MyTemplates/laper-workspace-reference/notes/laper-workspace-design-and-feature-breakdown.md`
- `C:/MyTemplates/laper-workspace-reference/notes/laper-workspace-function-implementation-analysis.md`

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
- Structured scene selector controls for `INT./EXT.`, `LOCATION`, and `DAY/NIGHT`.
- Character selector dropdown/create flow.
- Dashboard routes for Recents, Projects, and Trash.
- Project settings, version history, publish, and soft-delete menus.
