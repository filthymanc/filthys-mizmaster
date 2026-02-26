/*
 * filthy's MizMaster
 * Copyright (C) 2026 the filthymanc
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * DCS Standard Scripting Engine (SSE) Hard Deck
 * Version: v2.6.1
 *
 * This file contains Functional Specifications (Type Definitions) for the core DCS classes.
 * It serves as a "Hard Deck" to prevent the AI from hallucinating methods that do not exist.
 *
 * ATTRIBUTION:
 * Knowledge derived from the community efforts at https://wiki.hoggitworld.com
 * Content is strictly limited to Functional Signatures (Input/Output) to comply with copyright protocols.
 */

export interface SSEDefinition {
  name: string;
  description: string;
  signatures: string[];
}

export const SSE_DEFINITIONS: Record<string, SSEDefinition[]> = {
  // --- CORE CLASSES ---
  Group: [
    {
      name: "Group.getByName",
      description:
        "Returns the Group object associated with the provided name string. Returns nil if not found.",
      signatures: ["Group.getByName(name: string): Group | nil"],
    },
    {
      name: "Group.getUnits",
      description: "Returns an array of Unit objects belonging to the group.",
      signatures: ["Group:getUnits(): Unit[]"],
    },
    {
      name: "Group.destroy",
      description: "Destroys the group and all of its units from the mission.",
      signatures: ["Group:destroy(): void"],
    },
    {
      name: "Group.activate",
      description:
        "Activates a group that was set to 'Late Activation' in the Mission Editor.",
      signatures: ["Group:activate(): void"],
    },
    {
      name: "Group.getID",
      description: "Returns the unique numeric ID of the group.",
      signatures: ["Group:getID(): number"],
    },
    {
      name: "Group.getName",
      description: "Returns the string name of the group.",
      signatures: ["Group:getName(): string"],
    },
    {
      name: "Group.getSize",
      description: "Returns the number of units currently alive in the group.",
      signatures: ["Group:getSize(): number"],
    },
    {
      name: "Group.getUnit",
      description: "Returns the Unit object at the specified index (1-based).",
      signatures: ["Group:getUnit(index: number): Unit | nil"],
    },
    {
      name: "Group.getController",
      description:
        "Returns the Controller object of the group, used for AI tasks.",
      signatures: ["Group:getController(): Controller"],
    },
    {
      name: "Group.getCoalition",
      description: "Returns the coalition ID of the group.",
      signatures: ["Group:getCoalition(): number"],
    },
  ],
  Unit: [
    {
      name: "Unit.getByName",
      description:
        "Returns the Unit object associated with the provided name string. Returns nil if not found.",
      signatures: ["Unit.getByName(name: string): Unit | nil"],
    },
    {
      name: "Unit.isActive",
      description:
        "Returns true if the unit is active (spawned and not destroyed).",
      signatures: ["Unit:isActive(): boolean"],
    },
    {
      name: "Unit.getPoint",
      description: "Returns the current 3D position (Vec3) of the unit.",
      signatures: ["Unit:getPoint(): Vec3"],
    },
    {
      name: "Unit.getGroup",
      description: "Returns the parent Group object of the unit.",
      signatures: ["Unit:getGroup(): Group"],
    },
    {
      name: "Unit.getLife",
      description: "Returns the current health of the unit.",
      signatures: ["Unit:getLife(): number"],
    },
    {
      name: "Unit.getFuel",
      description:
        "Returns the internal fuel amount as a percentage (0.0 to 1.0).",
      signatures: ["Unit:getFuel(): number"],
    },
    {
      name: "Unit.destroy",
      description: "Destroys the unit instance.",
      signatures: ["Unit:destroy(): void"],
    },
    {
      name: "Unit.getTypeName",
      description: "Returns the type name of the unit (e.g. 'F-16C_50').",
      signatures: ["Unit:getTypeName(): string"],
    },
    {
      name: "Unit.getPlayerName",
      description:
        "Returns the name of the player controlling the unit, or nil if AI.",
      signatures: ["Unit:getPlayerName(): string | nil"],
    },
    {
      name: "Unit.inAir",
      description: "Returns true if the unit is in the air.",
      signatures: ["Unit:inAir(): boolean"],
    },
  ],
  StaticObject: [
    {
      name: "StaticObject.getByName",
      description:
        "Returns the StaticObject associated with the name. Returns nil if not found.",
      signatures: ["StaticObject.getByName(name: string): StaticObject | nil"],
    },
    {
      name: "StaticObject.getPoint",
      description: "Returns the 3D position (Vec3) of the object.",
      signatures: ["StaticObject:getPoint(): Vec3"],
    },
    {
      name: "StaticObject.destroy",
      description: "Destroys the static object.",
      signatures: ["StaticObject:destroy(): void"],
    },
    {
      name: "StaticObject.getCoalition",
      description: "Returns the coalition ID of the object.",
      signatures: ["StaticObject:getCoalition(): number"],
    },
  ],
  Controller: [
    {
      name: "Controller.setOption",
      description: "Sets an option for the AI controller.",
      signatures: [
        "Controller:setOption(optionId: number, value: number | boolean): void",
      ],
    },
    {
      name: "Controller.setCommand",
      description: "Sets a command for the AI controller to execute immediately.",
      signatures: ["Controller:setCommand(command: table): void"],
    },
    {
      name: "Controller.setTask",
      description: "Resets the AI task queue and sets a single task.",
      signatures: ["Controller:setTask(task: table): void"],
    },
    {
      name: "Controller.pushTask",
      description: "Adds a task to the end of the AI task queue.",
      signatures: ["Controller:pushTask(task: table): void"],
    },
    {
      name: "Controller.setOnOff",
      description: "Enables or disables the AI controller.",
      signatures: ["Controller:setOnOff(value: boolean): void"],
    },
  ],

  // --- SINGLETONS / MODULES ---
  coalition: [
    {
      name: "coalition.addGroup",
      description:
        "Dynamically spawns a group into the mission. Country ID is required.",
      signatures: [
        "coalition.addGroup(countryId: number, groupCategory: number, groupData: table): Group",
      ],
    },
    {
      name: "coalition.getGroups",
      description:
        "Returns an array of Group objects for a specific coalition. Optional category filter.",
      signatures: [
        "coalition.getGroups(coalitionId: number, groupCategory?: number): Group[]",
      ],
    },
    {
      name: "coalition.getPlayers",
      description:
        "Returns an array of Unit objects currently controlled by players.",
      signatures: ["coalition.getPlayers(coalitionId: number): Unit[]"],
    },
    {
      name: "coalition.getStaticObjects",
      description: "Returns an array of StaticObjects for a coalition.",
      signatures: [
        "coalition.getStaticObjects(coalitionId: number): StaticObject[]",
      ],
    },
    {
      name: "coalition.getAirbases",
      description: "Returns an array of Airbase objects for a coalition.",
      signatures: ["coalition.getAirbases(coalitionId: number): Airbase[]"],
    },
  ],
  trigger: [
    {
      name: "trigger.action.outText",
      description: "Displays a text message on screen to all players.",
      signatures: [
        "trigger.action.outText(text: string, delay: number, clearView?: boolean): void",
      ],
    },
    {
      name: "trigger.action.outTextForCoalition",
      description: "Displays a text message to a specific coalition.",
      signatures: [
        "trigger.action.outTextForCoalition(coalitionId: number, text: string, delay: number, clearView?: boolean): void",
      ],
    },
    {
      name: "trigger.action.outTextForGroup",
      description: "Displays a text message to a specific group.",
      signatures: [
        "trigger.action.outTextForGroup(groupId: number, text: string, delay: number, clearView?: boolean): void",
      ],
    },
    {
      name: "trigger.action.outSound",
      description: "Plays a sound file to all players.",
      signatures: ["trigger.action.outSound(soundFile: string): void"],
    },
    {
      name: "trigger.misc.getUserFlag",
      description: "Returns the value of a user flag.",
      signatures: ["trigger.misc.getUserFlag(flagName: string): number"],
    },
    {
      name: "trigger.action.setUserFlag",
      description: "Sets the value of a user flag.",
      signatures: [
        "trigger.action.setUserFlag(flagName: string, value: number | boolean): void",
      ],
    },
    {
      name: "trigger.action.smoke",
      description: "Spawns colored smoke at a point.",
      signatures: [
        "trigger.action.smoke(point: Vec3, color: number): void",
      ],
    },
  ],
  timer: [
    {
      name: "timer.scheduleFunction",
      description:
        "Schedules a function to run at a specific future time. Crucial for loops.",
      signatures: [
        "timer.scheduleFunction(functionToCall, functionArg, time: number): number",
      ],
    },
    {
      name: "timer.getTime",
      description:
        "Returns the current mission time in seconds relative to mission start.",
      signatures: ["timer.getTime(): number"],
    },
    {
      name: "timer.getAbsTime",
      description:
        "Returns the absolute time in seconds (including day/month offsets).",
      signatures: ["timer.getAbsTime(): number"],
    },
    {
      name: "timer.removeFunction",
      description: "Removes a scheduled function by its ID.",
      signatures: ["timer.removeFunction(functionId: number): void"],
    },
  ],
  coord: [
    {
      name: "coord.LOtoLL",
      description:
        "Converts Local Coordinates (Vec3) to Latitude/Longitude/Altitude. RETURNS 3 VALUES.",
      signatures: ["coord.LOtoLL(point: Vec3): (lat: number, long: number, alt: number)"],
    },
    {
      name: "coord.LLtoLO",
      description:
        "Converts Latitude/Longitude/Altitude to Local Coordinates (Vec3).",
      signatures: ["coord.LLtoLO(lat: number, long: number, alt: number): Vec3"],
    },
  ],
  world: [
    {
      name: "world.addEventHandler",
      description: "Adds a global event handler.",
      signatures: ["world.addEventHandler(handler: table): void"],
    },
    {
      name: "world.removeEventHandler",
      description: "Removes a global event handler.",
      signatures: ["world.removeEventHandler(handler: table): void"],
    },
    {
      name: "world.searchObjects",
      description: "Searches for objects within a volume.",
      signatures: [
        "world.searchObjects(searchCategory: number, volume: table, handler: function, data?: any): void",
      ],
    },
    {
      name: "world.getMarkPanels",
      description: "Returns a list of mark panels currently in the world.",
      signatures: ["world.getMarkPanels(): table"],
    },
  ],
  env: [
    {
      name: "env.info",
      description: "Logs an INFO level message to dcs.log.",
      signatures: ["env.info(message: string, showMsgBox?: boolean): void"],
    },
    {
      name: "env.warning",
      description: "Logs a WARNING level message to dcs.log.",
      signatures: ["env.warning(message: string, showMsgBox?: boolean): void"],
    },
    {
      name: "env.error",
      description: "Logs an ERROR level message to dcs.log.",
      signatures: ["env.error(message: string, showMsgBox?: boolean): void"],
    },
  ],
  land: [
    {
      name: "land.getHeight",
      description: "Returns the height of the terrain at a 2D point.",
      signatures: ["land.getHeight(point: Vec2): number"],
    },
    {
      name: "land.getSurfaceType",
      description: "Returns the surface type at a 2D point (Land, Sea, Road, Runway).",
      signatures: ["land.getSurfaceType(point: Vec2): number"],
    },
  ],
};
