import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return <header className={cn("flex flex-col gap-5 border-b border-[#ded9d0] pb-6 sm:flex-row sm:items-end sm:justify-between", className)}><div className="min-w-0"><div className="mb-2 flex items-center gap-2">{eyebrow && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">{eyebrow}</span>}</div><h1 className="text-2xl font-semibold tracking-[-0.05em] text-[#202522] sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#747b73]">{description}</p>}</div>{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}</header>;
}
