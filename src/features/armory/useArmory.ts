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

import { useState, useCallback, useEffect } from "react";
import { Snippet } from "../../core/types";
import { saveSnippet, getAllSnippets, deleteSnippet as deleteSnippetService } from "../../shared/services/idbService";
import { toast } from "../../shared/services/toastService";
import { safeDate } from "../../shared/utils/dateUtils";

// Hook for managing the entire armory library
export const useArmoryLibrary = () => {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSnippets = useCallback(async () => {
        setIsLoading(true);
        try {
            let data = await getAllSnippets();
            
            // Map to ensure Date objects
            data = data.map(s => ({
                ...s,
                createdAt: safeDate(s.createdAt)
            }));

            // Sort by most recent
            setSnippets(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        } catch (error) {
            console.error("Failed to load armory:", error);
            toast.error("Failed to load snippets");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSnippets();
    }, [loadSnippets]);

    const removeSnippet = async (id: string) => {
        try {
            await deleteSnippetService(id);
            setSnippets(prev => prev.filter(s => s.id !== id));
            toast.success("Snippet removed from Armory");
        } catch (error) {
            console.error("Failed to delete snippet:", error);
            toast.error("Failed to delete snippet");
        }
    };

    return {
        snippets,
        isLoading,
        refresh: loadSnippets,
        removeSnippet
    };
};

// Hook for saving a single snippet (lightweight)
export const useSnippetSaver = () => {
    const saveToArmory = async (code: string, language: string, title?: string) => {
        const id = Date.now().toString();
        const snippet: Snippet = {
            id,
            title: title || `Snippet ${new Date().toLocaleTimeString()}`,
            language,
            code,
            createdAt: new Date(),
            description: ""
        };

        try {
            await saveSnippet(snippet);
            toast.success("Saved to Armory");
            return true;
        } catch (error) {
            console.error("Failed to save snippet:", error);
            toast.error("Failed to save snippet");
            return false;
        }
    };

    return { saveToArmory };
};
