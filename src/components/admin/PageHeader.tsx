import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-[clamp(2rem,4vw,2.8rem)] font-medium leading-[1.04] tracking-[-0.045em] text-[#202522]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#747b73]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2 [&>button]:min-h-10">
          {actions}
        </div>
      )}
    </header>
  );
}
