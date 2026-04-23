"use client";

import { useEffect, useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  CircleDot,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  format,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  addMonths,
  subMonths,
  isSameMonth,
  isPast,
} from "date-fns";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { motion, AnimatePresence } from "framer-motion";

interface ScheduleEntry {
  id: string;
  scheduledDate: string | null;
  title: string | null;
  status: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  score: { finalScore: string | number } | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setSchedule(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build schedule lookup by date string (multiple entries per day supported)
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    schedule.forEach((entry) => {
      if (!entry.scheduledDate) return;
      const key = new Date(entry.scheduledDate).toISOString().split("T")[0];
      const list = map.get(key);
      if (list) list.push(entry);
      else map.set(key, [entry]);
    });
    return map;
  }, [schedule]);

  // Calculate calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad start with empty cells for alignment
    const startPadding = getDay(monthStart);
    const paddedDays: (Date | null)[] = [
      ...Array.from({ length: startPadding }, () => null),
      ...days,
    ];

    return paddedDays;
  }, [currentMonth]);

  // Determine which months have schedule data (for navigation)
  const scheduledMonths = useMemo(() => {
    if (schedule.length === 0) return { first: new Date(), last: new Date() };
    const dates = schedule.filter((s) => s.scheduledDate).map((s) => new Date(s.scheduledDate as string));
    return {
      first: new Date(Math.min(...dates.map((d) => d.getTime()))),
      last: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
  }, [schedule]);

  // Quick stats
  const completedCount = schedule.filter((s) => s.status === "completed").length;
  const totalCount = schedule.length;
  const avgScore = schedule.filter((s) => s.score).length > 0
    ? (schedule.filter((s) => s.score).reduce((sum, s) => sum + Number(s.score!.finalScore), 0) / schedule.filter((s) => s.score).length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader icon={CalendarIcon} title="Sprint Timeline" description="Presentation schedule" />

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Completed", value: `${completedCount}/${totalCount}`, accent: "text-green-400" },
          { label: "Remaining", value: `${totalCount - completedCount}`, accent: "text-amber-400" },
          { label: "Avg Score", value: avgScore > 0 ? avgScore.toFixed(2) : "—", accent: "text-primary" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center"
          >
            <p className={cn("text-2xl font-bold font-mono", stat.accent)}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar Container */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-visible">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-mono uppercase tracking-widest text-muted-foreground/70"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            if (!day) {
              return <div key={`pad-${idx}`} className="min-h-[120px] border-b border-r border-white/[0.03] bg-white/[0.01]" />;
            }

            const dateKey = format(day, "yyyy-MM-dd");
            const entries = scheduleMap.get(dateKey) ?? [];
            const hasEntries = entries.length > 0;
            const today = isToday(day);
            const inMonth = isSameMonth(day, currentMonth);
            const allCompleted = hasEntries && entries.every((e) => e.status === "completed");
            const totalRows = Math.ceil(calendarDays.length / 7);
            const rowIndex = Math.floor(idx / 7);
            const isBottomRows = rowIndex >= totalRows - 2;

            return (
              <div
                key={dateKey}
                className={cn(
                  "relative min-h-[120px] border-b border-r border-white/[0.03] p-2 transition-colors duration-200 group",
                  !inMonth && "opacity-40",
                  today && "bg-primary/[0.06]",
                  hasEntries && "hover:bg-white/[0.04]",
                  !hasEntries && "bg-transparent"
                )}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold",
                      today
                        ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(99,144,245,0.4)]"
                        : "text-muted-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEntries && allCompleted && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  )}
                  {hasEntries && today && !allCompleted && (
                    <CircleDot className="h-3.5 w-3.5 text-primary animate-pulse" />
                  )}
                </div>

                {/* Inline Session Chips (one per entry) */}
                <div className="flex flex-col gap-1">
                  {entries.map((entry) => {
                    const completed = entry.status === "completed";
                    const isHovered = hoveredEntry === entry.id;
                    return (
                      <div
                        key={entry.id}
                        className="relative"
                        onMouseEnter={() => setHoveredEntry(entry.id)}
                        onMouseLeave={() => setHoveredEntry(null)}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "rounded-lg p-1.5 text-left overflow-hidden transition-colors cursor-pointer",
                            today && !completed
                              ? "bg-primary/15 border border-primary/20"
                              : completed
                                ? "bg-green-500/10 border border-green-500/10"
                                : "bg-white/5 border border-white/5"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage src={entry.user.avatarUrl || undefined} />
                              <AvatarFallback className="text-[8px] bg-muted">
                                {entry.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] font-medium text-white truncate leading-tight">
                              {entry.user.name.split(" ")[0]}
                            </span>
                          </div>
                          {entry.score && (
                            <span className="block text-[10px] font-mono text-primary mt-1 pl-6">
                              {Number(entry.score.finalScore).toFixed(2)}
                            </span>
                          )}
                        </motion.div>

                        {/* Hover Popover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.97 }}
                              transition={{ duration: 0.15 }}
                              className={cn(
                                "absolute z-50 left-1/2 -translate-x-1/2 w-64 rounded-2xl border border-white/10 bg-[#0f1219]/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] p-4 pointer-events-none",
                                isBottomRows ? "bottom-full mb-1" : "top-full mt-1"
                              )}
                            >
                              {/* Arrow */}
                              <div className={cn(
                                "absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#0f1219]",
                                isBottomRows
                                  ? "-bottom-1.5 border-r border-b border-white/10"
                                  : "-top-1.5 border-l border-t border-white/10"
                              )} />

                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-10 w-10 border border-white/10">
                                  <AvatarImage src={entry.user.avatarUrl || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-bold text-white">
                                    {entry.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white text-sm">{entry.user.name}</p>
                                  <p className="text-xs text-muted-foreground">{entry.scheduledDate ? format(new Date(entry.scheduledDate), "EEEE, MMM d") : "Unscheduled"}</p>
                                </div>
                              </div>

                              {entry.title && (
                                <div className="mb-3 rounded-lg bg-white/5 p-2.5 border border-white/5">
                                  <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-mono">Project</p>
                                  <p className="text-sm text-white font-medium">{entry.title}</p>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider",
                                    completed
                                      ? "border-green-500/30 text-green-400 bg-green-500/10"
                                      : today
                                        ? "border-primary/30 text-primary bg-primary/10"
                                        : "border-white/10 text-muted-foreground"
                                  )}
                                >
                                  {completed ? "Completed" : today ? "Live Today" : "Upcoming"}
                                </Badge>

                                {entry.score && (
                                  <div className="flex items-center gap-1.5">
                                    <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                                    <span className="font-mono text-sm font-bold text-white">
                                      {Number(entry.score.finalScore).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm">
        {[
          { color: "bg-primary", label: "Today" },
          { color: "bg-green-500", label: "Completed" },
          { color: "bg-white/20", label: "Upcoming" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
            <span className="text-muted-foreground text-xs">{item.label}</span>
          </div>
        ))}
      </div>

      {schedule.length === 0 && (
        <div className="py-20 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-white">No Schedule Yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            An admin needs to set up the 16-day sprint schedule.
          </p>
        </div>
      )}
    </PageShell>
  );
}
