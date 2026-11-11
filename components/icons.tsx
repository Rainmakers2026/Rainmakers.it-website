import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  focusable: 'false' as const,
  ...props,
});

export const ArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ArrowDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);
export const ArrowUpRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);
export const Menu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const Close = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const Check = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);
export const Plus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const Minus = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);

/* Pillar / concept icons — simple, original line drawings */
/** Brand marks for the footer social links (simplified, single colour). */
export const Facebook = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
  </svg>
);
/** X (formerly Twitter) */
export const XLogo = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M17.2 3.5h2.9l-6.3 7.2 7.4 9.8h-5.8l-4.6-6-5.2 6H2.7l6.7-7.7L2.3 3.5h5.9l4.1 5.5 4.9-5.5Zm-1 15.3h1.6L7.9 5.1H6.2l10 13.7Z" />
  </svg>
);
export const Instagram = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);
/** Logo card popup sections */
export const IconDocument = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
);
export const IconTeam = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5" />
  </svg>
);
export const IconPie = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3a9 9 0 1 0 9 9h-9z" />
    <path d="M15 3.5A9 9 0 0 1 20.5 9H15z" />
  </svg>
);
export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);
/** Founder links, shown as white icons (simplified brand marks). */
export const LinkedIn = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
  </svg>
);
export const YouTube = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
  </svg>
);
export const Substack = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M21 7.3H3V5h18v2.3ZM3 9.6V21l9-5.05L21 21V9.6H3ZM21 1H3v2.3h18V1Z" />
  </svg>
);
export const IconNetwork = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="5" r="2" />
    <circle cx="5" cy="18" r="2" />
    <circle cx="19" cy="18" r="2" />
    <path d="M11 7 6 16M13 7l5 9M7 18h10" />
  </svg>
);
export const IconKnowledge = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
    <path d="M9 8h7M9 11h5" />
  </svg>
);
export const IconCommunity = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 20a6 6 0 0 1 12 0M14.5 14.2A5 5 0 0 1 21 19" />
  </svg>
);
export const IconOpportunity = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l2.6 5.6L20 9.5l-4 4 1 5.5-5-2.7-5 2.7 1-5.5-4-4 5.4-.9z" />
  </svg>
);
export const IconEcosystem = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);
export const IconExperience = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 20h18M6 20V11M11 20V7M16 20v-6M21 20V4" />
  </svg>
);
export const IconFragment = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="5" width="7" height="5" rx="1.5" />
    <rect x="5" y="14" width="5" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
export const IconQuestion = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" />
  </svg>
);
export const IconCompass = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </svg>
);
export const IconSolo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 21a7 7 0 0 1 14 0" />
  </svg>
);

export const challengeIcons = [IconFragment, IconNetwork, IconKnowledge, IconCompass, IconSolo];
export const accessIcons = [IconNetwork, IconKnowledge, IconOpportunity, IconCommunity, IconEcosystem, IconExperience];

/** "Come vuoi iniziare?" cards and "Cosa fa Rainmakers" (3 P). */
export const IconRocket = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4.5c2.6-1.3 5-1.5 5.5-1 .5.5.3 2.9-1 5.5L13 14.5 9.5 11z" />
    <path d="M9.5 11 6 10.5 8.5 8h4M13 14.5l.5 3.5 2.5-2.5v-4" />
    <path d="M6.5 15.5c-1.5.5-2.5 2.5-2.5 4.5 2 0 4-1 4.5-2.5" />
    <circle cx="15.5" cy="8.5" r="1.3" />
  </svg>
);
export const IconBriefcase = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M10.5 12.5v1.5h3v-1.5" />
  </svg>
);
export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);
export const IconQuote = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M10 6.5C6.6 7.6 4.5 10.3 4.5 14v3.5h5.5V12H7.4c.3-1.8 1.5-3 3.3-3.6zM19.5 6.5c-3.4 1.1-5.5 3.8-5.5 7.5v3.5h5.5V12h-2.6c.3-1.8 1.5-3 3.3-3.6z" />
  </svg>
);
export const IconGive = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 9.5c-1.2-2.3-4.5-2-4.5.6 0 1.9 2.4 3.4 4.5 5 2.1-1.6 4.5-3.1 4.5-5 0-2.6-3.3-2.9-4.5-.6z" />
    <path d="M3 20.5h3.5l3-1.5h5l4.2-2.8a1.4 1.4 0 0 0-1.6-2.3L14.5 15.5H11" />
  </svg>
);
export const IconBuilding = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21M14 10h4.5a1.5 1.5 0 0 1 1.5 1.5V21M2.5 21h19" />
    <path d="M7.5 8h3M7.5 12h3M7.5 16h3M17 14v.01M17 17.5v.01" />
  </svg>
);
/** "Investi con noi": a sprout growing from a coin. */
export const IconInvest = (p: P) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="18" rx="7" ry="2.5" />
    <path d="M5 18v1.5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V18M12 15.5V9" />
    <path d="M12 11c0-3 2-5 5.5-5 0 3-2 5-5.5 5zM12 9.5C12 7.2 10.4 5.5 7.5 5.5c0 2.3 1.6 4 4.5 4z" />
  </svg>
);
