/** Place → transition → place, drawn as a 20px monochrome mark on a primary tile. */
export default function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-primary text-fg-on-primary"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="4.5" cy="10" r="3" />
        <circle cx="15.5" cy="10" r="3" />
        <path d="M7.5 10h1.5M11 10h1.5" />
        <rect x="9" y="4" width="2" height="12" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
