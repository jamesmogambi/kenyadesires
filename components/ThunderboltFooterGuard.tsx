/**
 * components/ThunderboltFooterGuard.tsx
 *
 * Keeps the Thunderbolt chat widget from covering the footer's links,
 * without changing the footer, the layout, or the widget's own behaviour.
 *
 * WHY THE FIRST ATTEMPT FAILED
 * ----------------------------
 * This originally drove the widget through its public API
 * (`window.Thunderbolt.close()` / `.open()`). That is unreliable: the
 * embed's message handler has no case for a close command, so `close()`
 * merely postMessages the widget iframe and hopes it complies. When it did
 * not, the widget stayed on top of the links; when it half-worked, the
 * close/open round trip made the widget visibly pop in and out while
 * scrolling. The widget must not be controlled through that channel.
 *
 * HOW THIS WORKS INSTEAD
 * ----------------------
 * The embed mounts its iframes inside a *closed* shadow root, so the
 * iframes themselves are unreachable — but the shadow HOST is a plain
 * `<div>` that the script appends to `document.body`. Hiding that host
 * hides everything inside the shadow root.
 *
 * Crucially this is pure CSS. The widget's own state is never touched, so
 * there is no open/close cycle and nothing to pop. When the footer scrolls
 * back into view the host is simply revealed again, exactly as it was.
 *
 * IDENTIFYING THE HOST
 * --------------------
 * Two independent signals, both deliberately narrow:
 *
 *  1. `Element.prototype.attachShadow` is wrapped at module import time —
 *     ahead of the `lazyOnload` embed script — so every closed shadow root
 *     the embed creates is recorded with the element it was attached to.
 *     This is exact.
 *
 *  2. A structural fallback for hosts that already existed before the
 *     patch. It is deliberately strict, because a false positive would
 *     hide real page content. A node qualifies only when ALL of the
 *     following hold:
 *
 *       - it is a `<div>` that is a direct child of `<body>`;
 *       - it is not part of this app's tree (it neither contains nor is
 *         contained by the app's `<main>`, `<header>`, or `<footer>`),
 *         which excludes the footer's own wrapper `<div>`;
 *       - it renders no box of its own (zero offset width *and* height),
 *         which is how a container that exists only to hold fixed-position
 *         content presents itself, and which excludes the full-viewport
 *         background `<div>` the layout renders.
 *
 *     If the real host does present a non-zero box the fallback simply
 *     does not fire, and signal 1 still covers it. The fallback is
 *     therefore allowed to miss, never to over-match.
 */

"use client";

import { useEffect } from "react";

/** Marks the embed's shadow hosts once they have been identified. */
const HOST_ATTR = "data-tbolt-widget-host";

/** Marks <html> while the footer is on screen. */
const SUPPRESS_ATTR = "data-tbolt-suppressed";

const STYLE_ID = "tbolt-footer-guard-style";

/** Closed shadow roots seen by the patched `attachShadow`. */
const capturedHosts = new Set<Element>();

/**
 * Records closed shadow roots as they are created.
 *
 * `attachShadow({ mode: "closed" })` is observable only from inside the
 * call, since `element.shadowRoot` is null afterwards by design. Wrapping
 * the prototype is the only way to identify these hosts reliably, and
 * doing it at module scope means it runs at import time — before the
 * `lazyOnload` embed script executes.
 */
function patchAttachShadow() {
  if (typeof Element === "undefined") return;
  const proto = Element.prototype as Element & {
    attachShadow: (init: ShadowRootInit) => ShadowRoot;
    __tboltPatched?: boolean;
  };
  if (proto.__tboltPatched) return;
  proto.__tboltPatched = true;

  const original = proto.attachShadow;
  proto.attachShadow = function (init: ShadowRootInit) {
    const root = original.call(this, init);
    if (init?.mode === "closed") {
      capturedHosts.add(this);
      this.setAttribute(HOST_ATTR, "");
    }
    return root;
  };
}

// Runs at import time, ahead of the effect and ahead of the lazy script.
if (typeof window !== "undefined") {
  patchAttachShadow();
}

const GUARD_CSS = `
[${SUPPRESS_ATTR}] body [${HOST_ATTR}] {
  display: none !important;
}
`;

export default function ThunderboltFooterGuard() {
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let bodyObserver: MutationObserver | null = null;
    let suppressed = false;

    const setSuppressed = (next: boolean) => {
      if (next === suppressed) return;
      suppressed = next;
      if (next) {
        document.documentElement.setAttribute(SUPPRESS_ATTR, "");
      } else {
        document.documentElement.removeAttribute(SUPPRESS_ATTR);
      }
    };

    const observeFooter = () => {
      const footer = document.querySelector("footer");
      if (!footer) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) setSuppressed(entry.isIntersecting);
        },
        { threshold: 0 },
      );
      observer.observe(footer);
    };

    /**
     * Elements that belong to this app and must never be treated as a
     * widget host: every ancestor of the app's <main>/<header>/<footer>
     * up to and including <body>, and every one of their descendants.
     */
    const appElements = (): Set<Element> => {
      const owned = new Set<Element>();
      const roots = Array.from(
        document.querySelectorAll("main, header, footer"),
      );
      for (const root of roots) {
        let node: Element | null = root;
        while (node) {
          owned.add(node);
          node = node.parentElement;
        }
        for (const descendant of Array.from(root.querySelectorAll("*"))) {
          owned.add(descendant);
        }
      }
      return owned;
    };

    /**
     * A structural candidate is a zero-area <div> appended to <body> that
     * this app does not own. Anything that renders site content, or that
     * the app's own content lives inside, is excluded — which is what
     * keeps the page, the header, and the footer visible while the widget
     * is hidden.
     */
    const isOverlayCandidate = (node: Node, owned: Set<Element>): boolean => {
      if (!(node instanceof HTMLDivElement)) return false;
      if (node.parentElement !== document.body) return false;
      if (owned.has(node)) return false;
      // A container that only holds fixed-position content has no box.
      return node.offsetWidth === 0 && node.offsetHeight === 0;
    };

    const adoptCandidates = () => {
      const owned = appElements();
      for (const host of capturedHosts) host.setAttribute(HOST_ATTR, "");
      for (const child of Array.from(document.body?.children ?? [])) {
        if (isOverlayCandidate(child, owned)) {
          child.setAttribute(HOST_ATTR, "");
        }
      }
    };

    // Install the rule once per document.
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = GUARD_CSS;
      document.head.appendChild(style);
    }

    adoptCandidates();
    observeFooter();

    // Catch overlay hosts added after this effect (the embed is lazyOnload).
    bodyObserver = new MutationObserver((mutations) => {
      const added = mutations.flatMap((mutation) =>
        Array.from(mutation.addedNodes),
      );
      if (added.length === 0) return;
      const owned = appElements();
      for (const node of added) {
        if (isOverlayCandidate(node, owned)) {
          (node as HTMLDivElement).setAttribute(HOST_ATTR, "");
        }
      }
    });
    bodyObserver.observe(document.body, { childList: true });

    return () => {
      observer?.disconnect();
      bodyObserver?.disconnect();
      // Never leave the attribute behind for the next page.
      document.documentElement.removeAttribute(SUPPRESS_ATTR);
    };
  }, []);

  // Behaviour only — renders nothing.
  return null;
}
