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

import { useEffect, useRef } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  edgeThreshold?: number; // Distance from edge to start detecting (for open)
  swipeThreshold?: number; // Minimum distance to trigger swipe
}

/**
 * Hook to detect swipe gestures.
 * Specifically optimized for opening/closing the sidebar.
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  edgeThreshold = 40,
  swipeThreshold = 100,
}: SwipeOptions) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const dx = touchEnd.x - touchStart.current.x;
      const dy = touchEnd.y - touchStart.current.y;

      // Ensure it's a horizontal swipe
      if (Math.abs(dx) > Math.abs(dy)) {
        // Swipe Right (Open)
        if (dx > swipeThreshold) {
          // If edgeThreshold is provided, only trigger if start was near the left edge
          if (onSwipeRight && touchStart.current.x <= edgeThreshold) {
            onSwipeRight();
          }
        }
        // Swipe Left (Close)
        else if (dx < -swipeThreshold) {
          if (onSwipeLeft) {
            onSwipeLeft();
          }
        }
      }

      touchStart.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, edgeThreshold, swipeThreshold]);
};
