// The workspace mark: a rising line through three points. Neutral, so it
// suits any client; the favicon in index.html is the same drawing.
export default function Mark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="rgb(255 255 255 / 0.1)" />
      <path d="M16 44 L28 30 L36 37 L48 20" stroke="#2dd4bf" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="20" r="4.5" fill="#f6f4ef" />
    </svg>
  );
}
