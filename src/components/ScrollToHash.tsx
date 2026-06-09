import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to the element matching location.hash whenever the route or hash
 * changes. Place once at the top of the routed tree.
 *
 * Behaviour:
 *  - With a hash → smooth-scroll to the matching id, then to the top of the page if not found.
 *  - Without a hash → scroll to the top of the page (so changing routes feels like a "new page").
 */
export function ScrollToHash(): null {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Give React a tick to render the target page/section before we look for the element.
      const id = hash.replace(/^#/, '');
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      };
      // Two animation frames to be safe across renders.
      requestAnimationFrame(() => requestAnimationFrame(tryScroll));
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [pathname, hash]);

  return null;
};
