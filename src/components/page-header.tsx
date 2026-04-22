import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function PageHeader({ title, description, icon: Icon, className }: PageHeaderProps & { className?: string }) {
  return (
    <div className={className ?? "mb-10"}>
      <div className="flex items-center gap-3 mb-2">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>
      </div>
      <p className="text-slate-400 font-medium text-sm ml-[52px]">
        {description}
      </p>
    </div>
  );
}
