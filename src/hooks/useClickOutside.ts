import { useEffect, useRef } from 'react';

/**
 * Calls `handler` when a pointer-down or Escape key occurs outside `ref`.
 * Used to close dropdown menus when the user clicks elsewhere.
 */
export function useClickOutside<T extends HTMLElement>(handler: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [handler]);

  return ref;
}
