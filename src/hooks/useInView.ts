import { useEffect, useRef, useState } from 'react';

// Reports when an element first scrolls into view, so sections can trigger a
// one-shot reveal animation. Falls back to "visible" immediately when
// IntersectionObserver is unavailable, so content never gets stuck hidden.
export const useInView = <T extends Element = HTMLDivElement>(
  threshold = 0.15
): [React.RefObject<T>, boolean] => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView];
};
