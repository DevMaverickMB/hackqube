"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, ArrowRight, Ghost } from "lucide-react";
import { formatScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl: string | null;
  finalScore: number;
  scheduledDate: string;
}

function MiniPodiumCard({
  entry,
  place,
}: {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
}) {
  const isFirst = place === 1;
  const isSecond = place === 2;
  const isThird = place === 3;
  const initials = entry.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: place * 0.08, duration: 0.4, type: "spring" }}
      className={cn(
        "relative flex flex-col items-center rounded-2xl border overflow-hidden transition-all duration-300",
        isFirst
          ? "flex-1 bg-gradient-to-b from-[#1a1500] to-[#0b0e14] border-yellow-500/20 shadow-[0_0_20px_-6px_rgba(234,179,8,0.2)] py-7 z-10"
          : "flex-1 py-5",
        isSecond && "bg-gradient-to-b from-[#141b26] to-[#0b0e14] border-slate-400/20 shadow-[0_0_20px_-6px_rgba(148,163,184,0.15)]",
        isThird && "bg-gradient-to-b from-[#26101c] to-[#0b0e14] border-orange-500/20 shadow-[0_0_20px_-6px_rgba(249,115,22,0.15)]"
      )}
    >
      {/* Glow */}
      <div 
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-20 h-16 blur-[30px] rounded-full pointer-events-none opacity-40",
          isFirst && "bg-yellow-500",
          isSecond && "bg-slate-400",
          isThird && "bg-orange-500"
        )} 
      />

      {/* Place label */}
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-wider mb-2",
        isFirst && "text-yellow-500",
        isSecond && "text-slate-400",
        isThird && "text-orange-400"
      )}>
        {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"}
      </span>

      {/* Avatar */}
      <Avatar className={cn(
        "relative z-10 border-2 mb-2",
        isFirst ? "w-12 h-12 border-yellow-500/30" : "w-10 h-10 border-white/10"
      )}>
        <AvatarImage src={entry.avatarUrl || undefined} />
        <AvatarFallback className={cn(
          "text-[10px] font-bold",
          isFirst ? "bg-yellow-500/15 text-yellow-400" : "bg-muted text-slate-300"
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span className="text-[11px] font-semibold text-slate-200 truncate max-w-full px-2 text-center">
        {entry.name.split(" ")[0]}
      </span>

      {/* Score */}
      <span className={cn(
        "text-xs font-mono font-bold mt-0.5",
        isFirst ? "text-yellow-400" : isSecond ? "text-slate-300" : "text-orange-400"
      )}>
        {formatScore(entry.finalScore)}
      </span>
    </motion.div>
  );
}

export function LeaderboardPreview({ entries }: { entries: LeaderboardEntry[] }) {
  const topThree = entries.slice(0, 3);

  return (
    <Card className="relative overflow-hidden bg-slate-900/50 backdrop-blur-2xl border border-white/5 shadow-xl rounded-2xl h-full flex flex-col">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Trophy className="h-4 w-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Leaderboard</h3>
        </div>
        <Link href="/leaderboard" className="text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1">
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Podium */}
      <div className="px-5 pb-5 relative z-10 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="popLayout">
          {topThree.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 flex flex-col items-center justify-center text-center"
            >
              <Ghost className="h-6 w-6 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Awaiting results</p>
            </motion.div>
          ) : (
            <motion.div
              key="podium"
              className="flex items-end gap-2"
            >
              {/* 2nd place — slightly shorter */}
              {topThree[1] ? (
                <div className="flex-1 pt-5">
                  <MiniPodiumCard entry={topThree[1]} place={2} />
                </div>
              ) : <div className="flex-1" />}

              {/* 1st place — tallest */}
              {topThree[0] && (
                <div className="flex-1">
                  <MiniPodiumCard entry={topThree[0]} place={1} />
                </div>
              )}

              {/* 3rd place — shortest */}
              {topThree[2] ? (
                <div className="flex-1 pt-9">
                  <MiniPodiumCard entry={topThree[2]} place={3} />
                </div>
              ) : <div className="flex-1" />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
