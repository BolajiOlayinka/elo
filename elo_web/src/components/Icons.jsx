export function MenuIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M3 5h12M3 9h12M3 13h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M4.5 4.5 13.5 13.5M13.5 4.5 4.5 13.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowUpRight({ size = 16 }) {
  return (
    <svg className="btn-arrow" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 12 12 4M6.5 4H12v5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CompareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 3v10M12 3v10M2 6h4M10 10h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M2 8s2.4-4 6-4 6 4 6 4-2.4 4-6 4-6-4-6-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg className="tab-star" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M5 0.6 6.2 3.4 9.3 3.7 7 5.8 7.7 9.2 5 7.6 2.3 9.2 3 5.8 0.7 3.7 3.8 3.4Z" fill="#BCF766" />
    </svg>
  );
}

export function CalendarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 6.5h11M5.2 2.4v2.4M10.8 2.4v2.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function LogoutIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M6.2 3.2H3.8A1.3 1.3 0 0 0 2.5 4.5v7a1.3 1.3 0 0 0 1.3 1.3h2.4M10.2 11.2 13.5 8 10.2 4.8M13.5 8H6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FilterIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M2.5 3.5h11L10 8.2v4.1L6 13.5V8.2L2.5 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="12" cy="3.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4" cy="8" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.4 7.2 10.4 4.4M5.4 8.8 10.4 11.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function ChatIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 3.5h10a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 13 11.5H8.2L5 13.6V11.5H3A1.5 1.5 0 0 1 1.5 10V5A1.5 1.5 0 0 1 3 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PaperclipIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M6.2 8.6 9.8 5a2 2 0 1 1 2.8 2.8l-4.7 4.7a3.1 3.1 0 0 1-4.4-4.4l4.3-4.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SendUpIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 12.5V3.8M5 6.4 8 3.5l3 2.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThumbUpIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M5.5 7.2 7.4 3.4A1.4 1.4 0 0 1 9.7 4.2L9.2 7.2H13a1.5 1.5 0 0 1 1.5 1.8l-.8 3.2A1.8 1.8 0 0 1 11.9 13.5H5.5V7.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M3 7.2h2.5V13.5H3.6A.6.6 0 0 1 3 12.9V7.2Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function ThumbDownIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M10.5 8.8 8.6 12.6A1.4 1.4 0 0 1 6.3 11.8L6.8 8.8H3A1.5 1.5 0 0 1 1.5 7l.8-3.2A1.8 1.8 0 0 1 4.1 2.5h6.4V8.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M13 8.8h-2.5V2.5h1.9a.6.6 0 0 1 .6.6v5.7Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function ArrowDownIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 3.5v8.7M5 9.6 8 12.5l3-2.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserPlusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="6.2" cy="5.2" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.4 12.4c.4-2.2 1.9-3.4 3.8-3.4s3.4 1.2 3.8 3.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12.2 5.2v4M10.2 7.2h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2 13.4 13.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function InfoIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 7.2v4M8 5.2v.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TrophyIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 3.2h6v3.4A3 3 0 0 1 8 9.6 3 3 0 0 1 5 6.6V3.2Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M11 3.6h1.6A1.6 1.6 0 0 1 12.8 6 2.8 2.8 0 0 1 11 6.8M5 3.6H3.4A1.6 1.6 0 0 0 3.2 6 2.8 2.8 0 0 0 5 6.8M6.2 12.6h3.6M8 9.6v3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function MedalIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="9.2" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 2.6 8 6l2-3.4M6.8 9.2h2.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ChartIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 12.5V7.2M7 12.5V4.2M11 12.5V8.4M13.2 12.5H2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function PeakIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.4 12.2 6.2 6.4 8.4 9.2 11.2 4.6 13.6 12.2H2.4Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function BoltIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M9.2 2.4 4.6 8.6h3L6.8 13.6l4.8-6.4H8.6L9.2 2.4Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function GlobeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.6 8h10.8M8 2.6c1.8 1.6 2.7 3.4 2.7 5.4S9.8 11.8 8 13.4C6.2 11.8 5.3 10 5.3 8S6.2 4.2 8 2.6Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function ShieldIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.6 13 4.4v4.2c0 2.6-2 4.5-5 5.4-3-.9-5-2.8-5-5.4V4.4L8 2.6Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function SwapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 6h10M10.5 3.5 13 6 10.5 8.5M13 10H3M5.5 7.5 3 10l2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
