import { LibrarianSuggestion } from "./useLibrarian";

/**
 * Curated list of high-value MOOSE and DML boilerplate snippets.
 * These are injected at the top of the suggestion list when the user types
 * matching keywords (like SPAWN, ZONE, MESSAGE).
 */
export const LIBRARIAN_SNIPPETS: LibrarianSuggestion[] = [
  {
    label: "SPAWN (Standard Group)",
    description: "Initialize a standard late-activated group spawner",
    framework: "MOOSE",
    type: "snippet",
    template: `local \${1:MySpawner} = SPAWN:New("\${2:GroupAlias}")\n  :InitLimit(\${3:10}, \${4:50})\n  :SpawnScheduled(\${5:30}, \${6:0.5})`
  },
  {
    label: "SPAWN (With Alias)",
    description: "Initialize a spawner that renames groups upon spawning",
    framework: "MOOSE",
    type: "snippet",
    template: `local \${1:MySpawner} = SPAWN:NewWithAlias("\${2:GroupAlias}", "\${3:NewPrefix}")\n  :InitKeepUnitNames(true)\n  :Spawn()`
  },
  {
    label: "cfxZones (Get Zone)",
    description: "Safely retrieve a DML zone by name",
    framework: "DML",
    type: "snippet",
    template: `local \${1:myZone} = cfxZones.getZoneByName("\${2:ZoneName}")\nif \${1:myZone} then\n  -- logic\nend`
  },
  {
    label: "MESSAGE (To All)",
    description: "Broadcast a text message to all players",
    framework: "MOOSE",
    type: "snippet",
    template: `MESSAGE:New("\${1:Message Text}", \${2:15}):ToAll()`
  },
  {
    label: "SCHEDULER (Recurring)",
    description: "Create a recurring time-based scheduler",
    framework: "MOOSE",
    type: "snippet",
    template: `SCHEDULER:New(nil, \n  function()\n    -- task logic\n  end, \n{}, \${1:10}, \${2:30})`
  }
];
