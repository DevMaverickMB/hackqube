import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("mx-auto max-w-5xl w-full px-4 py-10 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
