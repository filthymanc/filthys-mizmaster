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

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// The self.__WB_MANIFEST is the injection point for the manifest.
// Vite-plugin-pwa will inject the list of assets to precache here.
precacheAndRoute(self.__WB_MANIFEST || []);

cleanupOutdatedCaches();

const CACHE_NAME = 'filthys-mizmaster-v1'; // Workbox handles versioning of assets, but this remains for custom logic

// --- FETCH PHASE ---
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // STRATEGY 1: IGNORE API CALLS (Network Only)
  if (url.hostname.includes("googleapis.com")) {
    return;
  }

  // STRATEGY 2: HTML NAVIGATION (Network First -> Cache Fallback)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("./index.html");
      }),
    );
    return;
  }
});

// Allow the PWA to take control immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
