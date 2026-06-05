// Unified flat / linear icon set (stroke-based, currentColor) so navigation and
// interaction affordances share one visual language. Category emojis stay as
// content; these icons are for chrome (nav, theme, favorite, etc.).

export type IconName =
  | "home"
  | "city"
  | "community"
  | "explore"
  | "chat"
  | "profile"
  | "heart" // 想去 / want to go
  | "bookmark" // 收藏 / save
  | "sun"
  | "moon"
  | "search"
  | "arrowUp"
  | "globe"
  | "signout"
  | "key"
  | "plus"
  | "back"
  | "hash"
  | "route";

// 24x24 viewBox, 1.8 stroke, round caps/joins — a calm, X-like line style.
const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5" />,
  city: (
    <>
      <path d="M3 21h18M5 21V7l6-4 6 4v14" />
      <path d="M9 21v-4h4v4M9 9h.01M13 9h.01M9 13h.01M13 13h.01" />
    </>
  ),
  community: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-3-4.9" />
    </>
  ),
  explore: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-1.6 4-4 1.6 1.6-4z" />
    </>
  ),
  chat: <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />,
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  heart: <path d="M12 20s-7-4.6-9.3-9.1A5 5 0 0 1 12 6a5 5 0 0 1 9.3 4.9C19 15.4 12 20 12 20Z" />,
  bookmark: <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  arrowUp: <path d="M12 20V5M6 11l6-6 6 6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </>
  ),
  signout: <path d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />,
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8.2-8.2M16 6l2 2M14 8l2 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  back: <path d="M15 5l-7 7 7 7" />,
  hash: <path d="M9 3 7 21M17 3l-2 18M4 8.5h16M3.5 15.5h16" />,
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h6a3 3 0 0 0 3-3V9" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-6 w-6",
  filled = false,
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  /** Fill the shape with currentColor (used for active heart/bookmark). */
  filled?: boolean;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
