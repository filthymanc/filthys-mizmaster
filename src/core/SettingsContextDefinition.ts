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

import { createContext } from "react";
import { ApiStatus, AppSettings } from "./types";

export interface SettingsContextType {
  settings: AppSettings;
  apiStatus: ApiStatus;
  updateSettings: (updates: Partial<AppSettings>) => void;
  setApiStatus: (status: ApiStatus) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);
