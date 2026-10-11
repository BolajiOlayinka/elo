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
