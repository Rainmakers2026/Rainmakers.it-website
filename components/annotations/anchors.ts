/**
 * Annotation anchoring (PRD §14.3): a pin is attached to the nearest stable section id
 * (e.g. "founder", "rainforest", "connect"), optionally to an element inside it via a short
 * tag:nth-of-type path, and placed with coordinates normalised to that element (0–1).
 * No absolute screen coordinates: pins follow the content across viewports and layout changes.
 */
const STABLE_ID = /^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const MAX_DEPTH = 8;

export interface Anchor {
  sectionId: string | null;
  elementSelector: string | null;
  anchor: { x: number; y: number; vw: number };
}

const isUi = (el: Element) => !!el.closest('[data-review-ui]');

/** Nearest ancestor with a stable id (React-generated ids such as ":r1:" are skipped). */
function sectionOf(el: Element): HTMLElement | null {
  let node: Element | null = el;
  while (node && node !== document.body) {
    if (node.id && STABLE_ID.test(node.id)) return node as HTMLElement;
    node = node.parentElement;
  }
  return null;
}

function pathFrom(root: Element, el: Element): string | null {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== root) {
    const parent: Element | null = node.parentElement;
    if (!parent) return null;
    const tag = node.tagName.toLowerCase();
    if (!/^[a-z0-9]+$/.test(tag)) return null;
    const index = Array.from(parent.children).filter((c) => c.tagName === node!.tagName).indexOf(node) + 1;
    parts.unshift(`${tag}:nth-of-type(${index})`);
    node = parent;
  }
  return parts.length && parts.length <= MAX_DEPTH ? parts.join(' > ') : null;
}

const clamp = (v: number) => Math.min(1, Math.max(0, Math.round(v * 10000) / 10000));

/** Builds the anchor for a click at (clientX, clientY) on `target`. */
export function anchorFor(target: Element, clientX: number, clientY: number): Anchor | null {
  if (isUi(target)) return null;
  const section = sectionOf(target);
  const root = section ?? document.body;
  // Prefer a reasonably sized element so pins stay meaningful; fall back to the section
  let el: Element = target;
  let selector = section && target !== section ? pathFrom(section, target) : null;
  if (!selector) el = root;
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) {
    el = root;
    selector = null;
  }
  const r = el.getBoundingClientRect();
  return {
    sectionId: section?.id ?? null,
    elementSelector: selector,
    anchor: { x: clamp((clientX - r.left) / r.width), y: clamp((clientY - r.top) / r.height), vw: Math.round(window.innerWidth) },
  };
}

/** Document position of a stored anchor, or null when its section is not on this page. */
export function positionOf(a: { section_id: string | null; element_selector: string | null; anchor_data: { x?: number; y?: number } }) {
  const section = a.section_id ? document.getElementById(a.section_id) : document.body;
  if (!section) return null;
  let el: Element = section;
  if (a.element_selector) {
    try {
      el = section.querySelector(`:scope > ${a.element_selector}`) ?? section;
    } catch {
      el = section;
    }
  }
  let r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) {
    el = section;
    r = section.getBoundingClientRect();
  }
  if (r.width === 0 && r.height === 0) return null;
  const x = typeof a.anchor_data?.x === 'number' ? a.anchor_data.x : 0;
  const y = typeof a.anchor_data?.y === 'number' ? a.anchor_data.y : 0;
  return { left: r.left + window.scrollX + x * r.width, top: r.top + window.scrollY + y * r.height };
}

/** Normalised page path (/it, /en/join …) and its locale. */
export function currentPage(): { path: string; locale: 'it' | 'en' } | null {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const m = path.match(/^\/(it|en)(\/[a-z0-9/_-]*)?$/);
  return m ? { path, locale: m[1] as 'it' | 'en' } : null;
}
