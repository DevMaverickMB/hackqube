"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/calendar", label: "Schedule" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/archive", label: "Archive" },
  { href: "/submit", label: "Submit" },
];

const adminItems = [
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-provision user in database on first visit
  useEffect(() => {
    if (user) {
      fetch("/api/users/me").catch(() => {});
    }
  }, [user]);

  const isAdmin = user?.publicMetadata?.role === "admin";
  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full pt-6 pb-8 bg-gradient-to-b from-[#0b0e14] via-[#0b0e14]/95 to-transparent pointer-events-none">
      <div className="pointer-events-auto mx-auto flex h-14 max-w-5xl items-center px-6 rounded-full bg-white/[0.03] border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-3xl">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center justify-center gap-3 mr-8 group">
          <Image
            src="/logo.png"
            alt="HackQube"
            width={40}
            height={40}
            className="transition-transform group-hover:scale-105"
          />
          <span className="text-lg font-bold tracking-tight text-slate-100">
            HackQube
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 px-2 flex-1 justify-center">
          {allItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300",
                pathname === href
                  ? "bg-white/10 text-white shadow-inner border border-white/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 rounded-full ring-2 ring-white/10 hover:ring-blue-500/50 transition-colors",
              },
            }}
          />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full text-slate-300 hover:text-white hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="pointer-events-auto absolute top-[100%] left-0 right-0 md:hidden mt-2 px-4">
          <nav className="flex flex-col p-4 bg-[#0b0e14]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl gap-1">
            {allItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  pathname === href
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
