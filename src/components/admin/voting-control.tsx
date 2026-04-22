"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTimeRemaining, formatCountdown } from "@/lib/scoring";
import { useVotingStore } from "@/store/voting-store";
import { toast } from "sonner";
import { Play, Square, Clock, AlertTriangle, Eye, Star, Users, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Presentation {
  id: string;
  title: string | null;
  scheduledDate: string;
  status: string;
  user: { name: string };
}

interface LiveVote {
  id: string;
  ideaScore: number;
  executionScore: number;
  helpfulnessScore: number;
  presentationScore: number;
  submittedAt: string;
  voter: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

const scoreLabels = [
  { key: "ideaScore" as const, label: "Idea", color: "text-yellow-400" },
  { key: "executionScore" as const, label: "Exec", color: "text-blue-400" },
  { key: "helpfulnessScore" as const, label: "Help", color: "text-green-400" },
  { key: "presentationScore" as const, label: "Pres", color: "text-purple-400" },
];

export function VotingControl() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { isActive, closesAt, presentationId, setVotingSession, closeVoting } = useVotingStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [liveVotes, setLiveVotes] = useState<LiveVote[]>([]);
  const [showVotes, setShowVotes] = useState(true);
  const [votesLoading, setVotesLoading] = useState(false);
  const [votingDuration, setVotingDuration] = useState(2); // minutes
  // For viewing past votes when voting is not active
  const [pastVotesPresentationId, setPastVotesPresentationId] = useState<string>("");
  const [pastVotes, setPastVotes] = useState<LiveVote[]>([]);
  const [showPastVotes, setShowPastVotes] = useState(false);
  const [pastVotesLoading, setPastVotesLoading] = useState(false);

  const getPresentationLabel = (id: string) => {
    const p = presentations.find((p) => p.id === id);
    if (!p) return "Select presentation";
    return `${p.user.name} — ${p.title || "Untitled"}`;
  };

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setPresentations(arr.filter((p: Presentation) => p.status !== "cancelled"));
      })
      .catch(console.error);

    // Check active session
    fetch("/api/voting-sessions/active")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.isActive) {
          setVotingSession({
            isActive: true,
            presentationId: data.session.presentationId,
            closesAt: data.session.closesAt,
          });
        }
      })
      .catch(console.error);
  }, [setVotingSession]);

  // Poll live votes when voting is active
  const fetchLiveVotes = useCallback(() => {
    if (!isActive) return;
    setVotesLoading(true);
    fetch("/api/voting-sessions/votes")
      .then((r) => r.ok ? r.json() : { votes: [] })
      .then((data) => setLiveVotes(data.votes || []))
      .catch(console.error)
      .finally(() => setVotesLoading(false));
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      setLiveVotes([]);
      return;
    }
    fetchLiveVotes();
    const interval = setInterval(fetchLiveVotes, 5000);
    return () => clearInterval(interval);
  }, [isActive, fetchLiveVotes]);

  // Fetch past votes for a specific presentation
  const fetchPastVotes = useCallback((presId: string) => {
    setPastVotesLoading(true);
    fetch(`/api/voting-sessions/votes?presentationId=${presId}`)
      .then((r) => r.ok ? r.json() : { votes: [] })
      .then((data) => setPastVotes(data.votes || []))
      .catch(console.error)
      .finally(() => setPastVotesLoading(false));
  }, []);

  useEffect(() => {
    if (!isActive || !closesAt) return;
    const update = () => setTimeLeft(getTimeRemaining(closesAt));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isActive, closesAt]);

  const handleOpen = async () => {
    if (!selectedPresentation) {
      toast.error("Select a presentation first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/voting-sessions/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentation_id: selectedPresentation, duration_seconds: votingDuration * 60 }),
      });

      if (res.ok) {
        const data = await res.json();
        setVotingSession({
          isActive: true,
          presentationId: selectedPresentation,
          closesAt: data.closesAt,
        });
        toast.success("Voting window opened!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to open voting");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/voting-sessions/close", {
        method: "POST",
      });
      if (res.ok) {
        closeVoting();
        toast.success("Voting window closed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const renderVoteRow = (vote: LiveVote) => (
    <div
      key={vote.id}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg bg-white/[0.03] dark:bg-white/[0.03] border border-border/40 px-3 py-2.5"
    >
      <div className="flex items-center gap-2 sm:w-36 shrink-0">
        <Avatar className="h-6 w-6 border border-border/40">
          <AvatarImage src={vote.voter.avatarUrl || undefined} />
          <AvatarFallback className="text-[9px] bg-muted">
            {vote.voter.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium truncate">{vote.voter.name}</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap flex-1">
        {scoreLabels.map((cat) => (
          <div key={cat.key} className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground w-8 shrink-0">{cat.label}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5",
                    i < vote[cat.key] ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20"
                  )}
                />
              ))}
            </div>
            <span className={cn("text-[10px] font-mono font-bold", cat.color)}>{vote[cat.key]}</span>
          </div>
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {new Date(vote.submittedAt).toLocaleTimeString()}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Voting Session Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isActive ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border-2 border-green-300 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/30">
              <div>
                <Badge className="bg-green-500 text-white border-0 text-sm px-3 py-1 mb-2">
                  VOTING ACTIVE
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Auto-closes when timer reaches zero
                </p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "font-mono text-4xl font-black tabular-nums",
                  timeLeft <= 30 ? "text-red-600" : "text-green-700 dark:text-green-400"
                )}>
                  {formatCountdown(timeLeft)}
                </span>
                <p className="text-xs text-muted-foreground mt-1">remaining</p>
              </div>
            </div>

            {/* Live Votes Tracker */}
            <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
              <button
                onClick={() => setShowVotes((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Live Votes</span>
                  <Badge variant="secondary" className="text-xs">
                    {liveVotes.length} vote{liveVotes.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                {showVotes ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showVotes && (
                <div className="px-4 pb-4 space-y-1.5">
                  {votesLoading && liveVotes.length === 0 ? (
                    <div className="flex justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : liveVotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No votes yet — waiting for participants...</p>
                  ) : (
                    liveVotes.map(renderVoteRow)
                  )}
                </div>
              )}
            </div>

            <Button
              variant="destructive"
              className="w-full h-12"
              onClick={handleClose}
              disabled={loading}
            >
              <Square className="h-4 w-4 mr-2" />
              End Voting Early
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-6">
              <div className="flex items-start justify-between mb-4">
                <p className="font-semibold text-muted-foreground">No active voting session</p>
                <p className="font-semibold text-muted-foreground">Duration</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <Select value={selectedPresentation} onValueChange={(v) => setSelectedPresentation(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select today's presentation">
                        {selectedPresentation ? getPresentationLabel(selectedPresentation) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {presentations.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.user.name} — {p.title || "Untitled"} ({new Date(p.scheduledDate).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Voting Duration Control */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setVotingDuration((d) => Math.max(1, d - 1))}
                    disabled={votingDuration <= 1}
                  >
                    <span className="text-lg font-bold leading-none">−</span>
                  </Button>
                  <div className="text-center w-14">
                    <span className="font-mono text-lg font-bold tabular-nums">{votingDuration}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">m</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setVotingDuration((d) => Math.min(10, d + 1))}
                    disabled={votingDuration >= 10}
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-700 dark:text-amber-400">
                Opening voting will broadcast to all connected users and start a {votingDuration}-minute countdown.
                This action is visible to everyone.
              </p>
            </div>

            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleOpen}
              disabled={loading || !selectedPresentation}
            >
              <Play className="h-4 w-4 mr-2" />
              Open Voting ({votingDuration} min)
            </Button>

            {/* View Past Votes */}
            <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
              <button
                onClick={() => setShowPastVotes((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">View Past Votes</span>
                </div>
                {showPastVotes ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showPastVotes && (
                <div className="px-4 pb-4 space-y-3">
                  <Select value={pastVotesPresentationId} onValueChange={(v) => {
                    setPastVotesPresentationId(v ?? "");
                    if (v) fetchPastVotes(v);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a presentation to view votes">
                        {pastVotesPresentationId ? getPresentationLabel(pastVotesPresentationId) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {presentations.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.user.name} — {p.title || "Untitled"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pastVotesLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : pastVotesPresentationId && pastVotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">No votes found for this presentation.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {pastVotes.map(renderVoteRow)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
