type BrandMarkProps = { className?: string };

export function BrandMark({ className = "h-8 w-8" }: BrandMarkProps) {
  return (
    <img
      src="/vendora-mark.png"
      alt=""
      aria-hidden="true"
      className={className}
      decoding="async"
    />
  );
}
