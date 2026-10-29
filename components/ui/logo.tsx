// The Kayv mark as inline SVG, so it scales crisply and takes no extra request.
// Keep the geometry in step with assets/logo.svg, which is the source for the
// app icons, favicon, and splash screens.

const SIZES = {
  sm: { mark: "h-6 w-6", word: "text-base" },
  md: { mark: "h-8 w-8", word: "text-lg" },
  lg: { mark: "h-12 w-12", word: "text-2xl" },
} as const;

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id="kayv-k"
          gradientUnits="userSpaceOnUse"
          x1="260"
          y1="200"
          x2="760"
          y2="860"
        >
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="0.55" stopColor="#a855f7" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path
        d="M330 236 V788 M330 560 L650 236 M452 437 L690 788"
        fill="none"
        stroke="url(#kayv-k)"
        strokeWidth="140"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M836 130 L858 194 L922 216 L858 238 L836 302 L814 238 L750 216 L814 194 Z"
        fill="currentColor"
      />
    </svg>
  );
}

type LogoProps = {
  size?: keyof typeof SIZES;
  /** Hide the "Kayv" wordmark and show the mark alone. */
  markOnly?: boolean;
  className?: string;
};

/** The mark with the "Kayv" wordmark beside it. */
export function Logo({ size = "sm", markOnly = false, className = "" }: LogoProps) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2 text-white ${className}`}>
      <LogoMark className={s.mark} />
      {markOnly ? (
        <span className="sr-only">Kayv</span>
      ) : (
        <span className={`font-bold tracking-tight ${s.word}`}>Kayv</span>
      )}
    </span>
  );
}
