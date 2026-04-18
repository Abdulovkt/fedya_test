"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

type Props = {
  /** Must resolve to a single DOM element child (whitespace text nodes are ignored) */
  children: ReactNode;
  className?: string;
  /** Horizontal offset in px before reveal */
  x?: number;
  /** Extra delay after the element enters the viewport */
  delayMs?: number;
  /** Reveal animation duration in ms */
  durationMs?: number;
  /** CSS easing for reveal transitions */
  easing?: string;
  /** IntersectionObserver threshold (0..1) */
  threshold?: number;
  /** IntersectionObserver rootMargin */
  rootMargin?: string;
  /** Animation style */
  mode?: "slide" | "fade" | "line";
  /** Hide element with visibility:hidden until it activates (prevents “ghost” text/lines) */
  visibilityHiddenUntilActive?: boolean;
};

function composeRefs<T>(a: Ref<T> | undefined, b: Ref<T> | undefined): Ref<T> {
  return (value) => {
    if (typeof a === "function") a(value);
    else if (a) (a as { current: T | null }).current = value;

    if (typeof b === "function") b(value);
    else if (b) (b as { current: T | null }).current = value;
  };
}

export function RevealOnScroll({
  children,
  className,
  x = 18,
  delayMs = 0,
  durationMs = 720,
  easing = "cubic-bezier(0.2, 1, 0.2, 1)",
  threshold = 0.12,
  rootMargin = "0px 0px -8% 0px",
  mode = "slide",
  visibilityHiddenUntilActive = false,
}: Props) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    let timeoutId = 0;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          timeoutId = window.setTimeout(() => {
            setInView(true);
          }, Math.max(0, delayMs));
          obs.disconnect();
        }
      },
      { root: null, threshold, rootMargin },
    );

    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [delayMs, rootMargin, threshold]);

  const childNodes = Children.toArray(children).filter((node) => {
    if (typeof node === "string") return node.trim().length > 0;
    return true;
  });

  if (childNodes.length !== 1 || !isValidElement(childNodes[0])) {
    throw new Error("RevealOnScroll expects exactly one React element child.");
  }

  const child = childNodes[0] as ReactElement<{ className?: string; style?: CSSProperties; ref?: Ref<HTMLElement> }>;
  const baseClass = mode === "fade" ? "reveal-fade" : mode === "line" ? "reveal-line" : "reveal";
  const inClass = mode === "slide" ? "reveal--in" : "is-in";
  const mergedClassName = [
    baseClass,
    inView ? inClass : "",
    visibilityHiddenUntilActive ? "reveal--hidden-until-active" : "",
    child.props.className,
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const mergedStyle = {
    ...(child.props.style ?? {}),
    ...({
      ...(mode === "slide" ? { "--reveal-x": `${x}px` } : null),
      "--reveal-duration": `${Math.max(0, durationMs)}ms`,
      "--reveal-ease": easing,
    } as CSSProperties),
  };

  return cloneElement(child, {
    className: mergedClassName,
    style: mergedStyle,
    ref: composeRefs(child.props.ref, (el) => {
      nodeRef.current = el;
    }),
  });
}
