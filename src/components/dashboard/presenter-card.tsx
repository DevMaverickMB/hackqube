"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Sparkles, Mic2 } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  name: string;
  avatarUrl: string | null;
  presentationId: string;
  title: string | null;
  scheduledDate: string;
}

interface UpcomingSessionsCardProps {
  sessions: Session[];
}

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, MMM d");
}

export function UpcomingSessionsCard({ sessions }: UpcomingSessionsCardProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <Card className="border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-2xl h-full">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 rounded-full bg-white/5 p-6 ring-1 ring-white/10 shadow-inner">
            <CalendarDays className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white mb-2">All Clear</h3>
          <p className="text-sm text-slate-400 font-medium">
            No sessions scheduled in the next 3 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  const todaySessions = sessions.filter((s) => isToday(new Date(s.scheduledDate)));
  const upNext = sessions.filter((s) => !isToday(new Date(s.scheduledDate)));

  return (
    <Card className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl h-full flex flex-col">
      <div className="p-5 pb-3 flex items-center justify-between border-b border-white/5">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="bg-primary/20 text-primary p-1.5 rounded-lg">
            <Mic2 className="h-4 w-4" />
          </span>
          Upcoming Sessions
        </h3>
        <Badge variant="outline" className="text-xs text-muted-foreground border-white/10">
          {sessions.length} upcoming
        </Badge>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        {/* Today's sessions — highlighted */}
        {todaySessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/5 p-4 overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Today</span>
            </div>
            <div className="flex flex-col gap-3">
              {todaySessions.map((todaySession) => (
                <div key={todaySession.presentationId} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-bold text-white">
                      {todaySession.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{todaySession.name}</p>
                    <p className="text-xs text-slate-400 truncate">{todaySession.title || "Untitled project"}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Divider if both exist */}
        {todaySessions.length > 0 && upNext.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">up next</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
        )}

        {/* Upcoming sessions — compact rows */}
        {upNext.map((session, idx) => (
          <motion.div
            key={session.presentationId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors p-3"
          >
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarFallback className="bg-muted text-xs font-semibold">
                {session.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.name}</p>
              <p className="text-xs text-slate-500 truncate">{session.title || "Untitled project"}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={cn(
                "text-xs font-mono px-2 py-1 rounded-md",
                isTomorrow(new Date(session.scheduledDate))
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-slate-400 bg-white/5"
              )}>
                {getDayLabel(session.scheduledDate)}
              </span>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
