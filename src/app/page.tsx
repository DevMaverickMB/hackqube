"use client";

import { useEffect, useState, useCallback } from "react";
import { useVotingStore } from "@/store/voting-store";
import { UpcomingSessionsCard } from "@/components/dashboard/presenter-card";
import { VotingBanner } from "@/components/dashboard/voting-banner";
import { VotingCard } from "@/components/dashboard/voting-card";
import { LeaderboardPreview } from "@/components/dashboard/leaderboard-preview";
import { TechFeed } from "@/components/dashboard/tech-feed";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface TodayPresenter {
  id: string;
  name: string;
  avatarUrl: string | null;
  presentationId: string;
  title: string | null;
  scheduledDate: string;
}

interface UpcomingSession {
  id: string;
  name: string;
  avatarUrl: string | null;
  presentationId: string;
  title: string | null;
  scheduledDate: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl: string | null;
  finalScore: number;
  scheduledDate: string;
}

export default function DashboardPage() {
  const [todayPresenter, setTodayPresenter] = useState<TodayPresenter | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { isActive, closesAt, hasVoted, presentationId, setVotingSession, setHasVoted } = useVotingStore();

  const fetchDashboard = useCallback(async () => {
    try {
      const [scheduleRes, leaderboardRes, sessionRes] = await Promise.all([
        fetch("/api/schedule"),
        fetch("/api/leaderboard"),
        fetch("/api/voting-sessions/active"),
      ]);

      if (scheduleRes.ok) {
        const schedule = await scheduleRes.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysOut = new Date(today);
        threeDaysOut.setDate(threeDaysOut.getDate() + 3);

        const upcoming = schedule
          .filter((s: { scheduledDate: string }) => {
            const d = new Date(s.scheduledDate);
            return d >= today && d < threeDaysOut;
          })
          .map((s: { id: string; scheduledDate: string; title: string | null; user: { id: string; name: string; avatarUrl: string | null } }) => ({
            id: s.user.id,
            name: s.user.name,
            avatarUrl: s.user.avatarUrl,
            presentationId: s.id,
            title: s.title,
            scheduledDate: s.scheduledDate,
          }));

        setUpcomingSessions(upcoming);

        const todayStr = new Date().toISOString().split("T")[0];
        const todaySlot = schedule.find(
          (s: { scheduledDate: string }) => s.scheduledDate.split("T")[0] === todayStr
        );
        if (todaySlot) {
          setTodayPresenter({
            id: todaySlot.user.id,
            name: todaySlot.user.name,
            avatarUrl: todaySlot.user.avatarUrl,
            presentationId: todaySlot.id,
            title: todaySlot.title,
            scheduledDate: todaySlot.scheduledDate,
          });
        }
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.slice(0, 3));
      }

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.isActive) {
          setVotingSession({
            isActive: true,
            presentationId: sessionData.session.presentationId,
            closesAt: sessionData.session.closesAt,
          });
          setHasVoted(sessionData.hasVoted);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [setVotingSession, setHasVoted]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const showEvaluate = isActive && presentationId && !hasVoted;

  return (
    <PageShell>
      <PageHeader icon={Zap} title="Dashboard" description="Your command center for the AI Innovation Sprint" />

      <div className={cn(
        "grid gap-4",
        showEvaluate
          ? "lg:grid-cols-[1.2fr_1fr]"
          : "lg:grid-cols-[2fr_1fr]"
      )}>
        {showEvaluate ? (
          <div className="lg:row-span-2 flex flex-col gap-4">
            <VotingBanner />
            <VotingCard
              presentationId={presentationId}
              closesAt={closesAt}
              onVoteSubmitted={() => setHasVoted(true)}
            />
          </div>
        ) : (
          <div className="lg:col-span-2">
            <VotingBanner />
          </div>
        )}

        <UpcomingSessionsCard sessions={upcomingSessions} />
        <LeaderboardPreview entries={leaderboard} />

        <div className="lg:col-span-2">
          <TechFeed />
        </div>
      </div>
    </PageShell>
  );
}
