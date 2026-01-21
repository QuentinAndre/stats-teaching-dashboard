import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Tracks scroll progress through a scrollytelling container.
 * The container should have a tall height to allow scrolling while
 * the sticky content remains fixed in the viewport.
 *
 * Progress goes from 0 to 1 as the user scrolls through the container.
 *
 * @returns [ref to attach to scroll container, progress value 0-1]
 */
export function useScrollProgress<T extends HTMLElement>(): [RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const containerHeight = container.offsetHeight;
      const viewportHeight = window.innerHeight;

      // The scrollable distance is the container height minus one viewport
      // (since the sticky content takes up one viewport)
      const scrollableDistance = containerHeight - viewportHeight;

      if (scrollableDistance <= 0) {
        setProgress(0);
        return;
      }

      // How far the top of the container has scrolled past the top of the viewport
      const scrolledPast = -rect.top;

      if (scrolledPast <= 0) {
        // Haven't started scrolling through yet
        setProgress(0);
      } else if (scrolledPast >= scrollableDistance) {
        // Finished scrolling through
        setProgress(1);
      } else {
        // In the middle of scrolling through
        setProgress(scrolledPast / scrollableDistance);
      }
    };

    // Initial calculation
    handleScroll();

    // Listen for scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return [ref, progress];
}
