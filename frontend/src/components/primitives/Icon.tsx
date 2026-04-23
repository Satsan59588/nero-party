interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const paths: Record<string, JSX.Element> = {
  search:     <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  music:      <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
  flame:      <><path d="M12 2C9 9 5 11 5 16a7 7 0 0 0 14 0c0-3-2-5-4-8-1 3-3 4-3 4Z"/></>,
  crown:      <><path d="m3 8 4 4 5-7 5 7 4-4-2 11H5Z"/><path d="M5 19h14"/></>,
  heart:      <><path d="M12 21s-8-4.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-10 11-10 11Z"/></>,
  skull:      <><path d="M12 2a8 8 0 0 0-5 14v3a1 1 0 0 0 1 1h3v-2h2v2h2v-2h2v2h3a1 1 0 0 0 1-1v-3a8 8 0 0 0-8-14Z"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/></>,
  skip:       <><path d="m5 4 10 8-10 8V4ZM19 5v14"/></>,
  skipBack:   <><path d="m19 20-10-8 10-8v16ZM5 19V5"/></>,
  skipForward:<><path d="m5 4 10 8-10 8V4ZM19 5v14"/></>,
  play:       <><circle cx="12" cy="12" r="9"/><path d="m15 12-5 3V9l5 3Z"/></>,
  pause:      <><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>,
  plus:       <><path d="M12 5v14M5 12h14"/></>,
  users:      <><circle cx="9" cy="7" r="4"/><path d="M3 21a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="3"/><path d="M23 19a5 5 0 0 0-7-4"/></>,
  check:      <><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></>,
  copy:       <><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>,
  arrowUR:    <><path d="m7 17 10-10M7 7h10v10"/></>,
  arrowL:     <><path d="M20 12H4m0 0 6-6m-6 6 6 6"/></>,
  x:          <><path d="m6 6 12 12M18 6 6 18"/></>,
  moon:       <><path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10Z"/></>,
  disc:       <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></>,
  thumbsUp:   <><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></>,
  thumbsDown: <><path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></>,
  eyes:       <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  star:       <><path d="m12 2 3 7 7 .6-5.3 4.7 1.6 7L12 17.7 5.7 21l1.6-7L2 9.6 9 9Z"/></>,
  trash:      <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></>,
};

export function Icon({ name, size = 18, strokeWidth = 1.8, color = "currentColor" }: IconProps) {
  const p = { fill: "none", stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      {paths[name] ?? null}
    </svg>
  );
}
