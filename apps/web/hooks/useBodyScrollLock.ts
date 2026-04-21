import { useEffect } from "react";

/**
 * Hides the page scrollbar and prevents background scroll while `locked` is true
 * (e.g. fullscreen image / post viewer). Compensates scrollbar width so layout does not shift.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const prevHtmlOverscroll = html.style.overscrollBehavior;

    const gutter = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    if (gutter > 0) {
      body.style.paddingRight = `${gutter}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
      html.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [locked]);
}
