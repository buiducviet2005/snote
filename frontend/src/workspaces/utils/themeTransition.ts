import { flushSync } from 'react-dom';

type Theme = 'dark' | 'light';

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>;
    skipTransition: () => void;
  };
};

let activeTransition: ReturnType<NonNullable<TransitionDocument['startViewTransition']>> | null = null;

/**
 * Crossfade the two rendered themes without a full-screen expanding overlay.
 * Apply the DOM theme inside the snapshot callback so the new frame is ready
 * even when React commits its state on a later render.
 */
export function executeThemeTransition(nextTheme: Theme, onApplyTheme: () => void): void {
  const doc = document as TransitionDocument;
  const apply = () => {
    doc.documentElement.setAttribute('data-theme', nextTheme);
    flushSync(onApplyTheme);
  };

  activeTransition?.skipTransition();
  activeTransition = null;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !doc.startViewTransition) {
    apply();
    return;
  }

  const transition = doc.startViewTransition(apply);
  activeTransition = transition;
  void transition.finished.finally(() => {
    if (activeTransition === transition) activeTransition = null;
  });
}

