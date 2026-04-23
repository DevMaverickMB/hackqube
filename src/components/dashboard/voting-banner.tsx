"use client";

import { useEffect, useState } from "react";
import { useVotingStore } from "@/store/voting-store";
import { getTimeRemaining, formatCountdown } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { Vote, Clock, CheckCircle2 } from "lucide-react";

interface VotingBannerProps {
  children?: React.ReactNode;
}

export function VotingBanner({ children }: VotingBannerProps) {
  const { isActive, closesAt, hasVoted, closeVoting } = useVotingStore();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!isActive || !closesAt) return;

    const update = () => {
      const remaining = getTimeRemaining(closesAt);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        // Local timer ran out — update store so banner & card reflect closed state
        // even if the realtime broadcast hasn't arrived yet.
        closeVoting();
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isActive, closesAt, closeVoting]);

  if (!isActive) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 px-6 py-4 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <Vote className="h-5 w-5 text-slate-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-300">Voting Closed</p>
          <p className="text-xs text-slate-500">
            Voting will open when a presentation starts
          </p>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-4 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-emerald-300">Vote Submitted</p>
          <p className="text-xs text-emerald-400/70">
            Your vote has been recorded. Results will appear on the leaderboard.
          </p>
        </div>
      </div>
    );
  }

  const isUrgent = timeLeft <= 30;

  return (
    <>
    <div
      className={cn(
        "rounded-2xl border px-6 py-4 flex items-center justify-between transition-all",
        isUrgent
          ? "border-red-500/30 bg-red-500/10 animate-pulse"
          : "border-emerald-500/20 bg-emerald-500/10"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border",
            isUrgent ? "bg-red-500/15 border-red-500/20" : "bg-emerald-500/15 border-emerald-500/20"
          )}
        >
          <Vote
            className={cn(
              "h-5 w-5",
              isUrgent ? "text-red-400" : "text-emerald-400"
            )}
          />
        </div>
        <div>
          <p
            className={cn(
              "font-semibold",
              isUrgent ? "text-red-300" : "text-emerald-300"
            )}
          >
            {isUrgent ? "Hurry! Voting Closing Soon" : "Voting Is Open!"}
          </p>
          <p
            className={cn(
              "text-xs",
              isUrgent ? "text-red-400/70" : "text-emerald-400/70"
            )}
          >
            Cast your vote before time runs out
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Clock
          className={cn(
            "h-4 w-4",
            isUrgent ? "text-red-400" : "text-emerald-400"
          )}
        />
        <span
          className={cn(
            "font-mono text-2xl font-bold tabular-nums",
            isUrgent ? "text-red-300" : "text-emerald-300"
          )}
        >
          {formatCountdown(timeLeft)}
        </span>
      </div>
    </div>
    {children && <div className="-mt-4 mb-8">{children}</div>}
    </>
  );
}
