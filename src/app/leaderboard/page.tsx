"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Lightbulb, Wrench, Heart, Presentation as PresentationIcon, Search, Bell, ChevronDown, Star, Users, X } from "lucide-react";
import { formatScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl: string | null;
  userId: string;
  presentationId: string;
  presentationTitle: string | null;
  scheduledDate: string;
  finalScore: number;
  avgIdea: number;
  avgExecution: number;
  avgHelpfulness: number;
  avgPresentation: number;
  voteCount: number;
}

const categoryTabs = [
  { value: "overall", label: "Overall", icon: Trophy },
  { value: "idea", label: "Idea", icon: Lightbulb },
  { value: "execution", label: "Execution", icon: Wrench },
  { value: "helpfulness", label: "Helpfulness", icon: Heart },
  { value: "presentation", label: "Presenter", icon: PresentationIcon },
];

const scoreCategories = [
  { key: "ideaScore", label: "Idea", color: "text-yellow-400", bg: "bg-yellow-400" },
  { key: "executionScore", label: "Execution", color: "text-blue-400", bg: "bg-blue-400" },
  { key: "helpfulnessScore", label: "Helpfulness", color: "text-green-400", bg: "bg-green-400" },
  { key: "presentationScore", label: "Presentation", color: "text-purple-400", bg: "bg-purple-400" },
] as const;

interface VoteDetail {
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

interface PresentationDetail {
  id: string;
  title: string | null;
  problemStatement: string | null;
  aiToolsUsed: string[];
  approach: string | null;
  demoLink: string | null;
  impactLevel: string | null;
  category: string | null;
  votes: VoteDetail[];
  canSeeVotes: boolean;
  score: {
    avgIdea: string;
    avgExecution: string;
    avgHelpfulness: string;
    avgPresentation: string;
    finalScore: string;
    voteCount: number;
  } | null;
}

function StarRow({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3 h-3 transition-colors",
            i < value ? "text-yellow-400 fill-yellow-400" : "text-white/10"
          )}
        />
      ))}
    </div>
  );
}

function ScoreBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PodiumCard({
  entry,
  score,
  place,
}: {
  entry: LeaderboardEntry;
  score: number;
  place: 1 | 2 | 3;
}) {
  const isFirst = place === 1;
  const isSecond = place === 2;
  const isThird = place === 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: place * 0.1, duration: 0.5, type: "spring" }}
      className={cn(
        "relative flex flex-col items-center justify-end rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl p-6 transition-all duration-300 hover:scale-105 overflow-hidden",
        isFirst ? "h-64 sm:h-72 z-20 w-48 sm:w-56" : "h-56 sm:h-60 z-10 w-40 sm:w-48 mt-8 sm:mt-12",
        // Glowing gradients representing the medals
        isFirst && "bg-gradient-to-b from-[#1a1500] to-[#0b0e14] border-yellow-500/20 shadow-[0_0_40px_-10px_rgba(234,179,8,0.2)]",
        isSecond && "bg-gradient-to-b from-[#141b26] to-[#0b0e14] border-slate-400/20 shadow-[0_0_40px_-10px_rgba(148,163,184,0.15)]",
        isThird && "bg-gradient-to-b from-[#26101c] to-[#0b0e14] border-orange-500/20 shadow-[0_0_40px_-10px_rgba(249,115,22,0.15)]"
      )}
    >
      {/* Background glow orb */}
      <div 
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-[50px] opacity-40",
          isFirst && "bg-yellow-500",
          isSecond && "bg-slate-400",
          isThird && "bg-orange-500"
        )} 
      />

      <div className="absolute top-4 flex flex-col items-center">
        {/* Crown/Laurels SVG could go here. We'll use CSS for the "1st" text */}
        <div className={cn(
          "flex items-center justify-center font-bold text-lg mb-2",
          isFirst && "text-yellow-500",
          isSecond && "text-slate-300",
          isThird && "text-orange-400"
        )}>
          {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"}
          <Trophy className="ml-1 w-4 h-4 opacity-70" />
        </div>
      </div>

      <Avatar className={cn(
        "relative z-10 border-4 border-[#0b0e14] shadow-2xl mb-4 transition-transform",
        isFirst ? "w-24 h-24" : "w-16 h-16"
      )}>
        <AvatarImage src={entry.avatarUrl || undefined} />
        <AvatarFallback className="bg-muted text-xl">
          {entry.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="relative z-10 text-center w-full">
        <h3 className="font-semibold text-white truncate px-2">{entry.name}</h3>
        <p className="text-sm font-mono text-muted-foreground mt-1">
          {formatScore(score)} pts
        </p>
      </div>

      {/* Decorative dots/stars */}
      <div className="absolute bottom-4 left-4 w-1 h-1 rounded-full bg-white/20" />
      <div className="absolute top-1/2 right-4 w-1.5 h-1.5 rounded-full bg-white/10" />
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overall");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Record<string, PresentationDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  const fetchLeaderboard = (category?: string) => {
    setLoading(true);
    const url = category && category !== "overall"
      ? `/api/leaderboard?category=${category}`
      : "/api/leaderboard";

    fetch(url)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const toggleExpand = useCallback((presentationId: string) => {
    if (expandedId === presentationId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(presentationId);
    if (!detailData[presentationId]) {
      setDetailLoading(presentationId);
      fetch(`/api/presentations/${presentationId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((d: PresentationDetail) => {
          setDetailData((prev) => ({ ...prev, [presentationId]: d }));
        })
        .catch(console.error)
        .finally(() => setDetailLoading(null));
    }
  }, [expandedId, detailData]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchLeaderboard(value);
  };

  const getScoreForCategory = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case "idea": return entry.avgIdea;
      case "execution": return entry.avgExecution;
      case "helpfulness": return entry.avgHelpfulness;
      case "presentation": return entry.avgPresentation;
      default: return entry.finalScore;
    }
  };

  const topThree = data.slice(0, 3);
  const remaining = data.slice(3);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-24 flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">CALCULATING RANKS...</p>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <Card className="border-white/5 bg-white/5 backdrop-blur-md">
          <CardContent className="py-24 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground">
              Awaiting the first presentation to finalize the leaderboard.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="flex flex-col gap-8 md:gap-12">
        {/* Podium Display */}
        {topThree.length > 0 && (
          <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden min-h-[320px] sm:min-h-[380px] flex items-center justify-center px-4 md:px-8 py-4 md:py-6">
            {/* Subtle ambient glow — no borders, blends into page */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/[0.07] blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[80px] bg-primary/[0.08] blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            
            <div className="flex items-end justify-center gap-2 sm:gap-6 z-10 w-full relative">
              {/* 2nd Place */}
              {topThree[1] && (
                <PodiumCard 
                  entry={topThree[1]} 
                  score={getScoreForCategory(topThree[1])} 
                  place={2} 
                />
              )}
              
              {/* 1st Place */}
              {topThree[0] && (
                <PodiumCard 
                  entry={topThree[0]} 
                  score={getScoreForCategory(topThree[0])} 
                  place={1} 
                />
              )}
              
              {/* 3rd Place */}
              {topThree[2] && (
                <PodiumCard 
                  entry={topThree[2]} 
                  score={getScoreForCategory(topThree[2])} 
                  place={3} 
                />
              )}
            </div>
          </div>
          {pillTabs}
          </div>
        )}

        {/* Rest of the List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="bg-primary/20 text-primary p-1.5 rounded-lg">
                <Medal className="h-5 w-5" />
              </span>
              Top Rankings
            </h2>
          </div>
          
          <div className="grid gap-3">
            {/* Table Header like labels */}
            <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-6 py-2 text-xs font-mono text-muted-foreground uppercase tracking-widest border-b border-white/5">
              <div className="w-12 text-center">Rank</div>
              <div>Participant</div>
              <div>Project</div>
              <div className="text-right">Score</div>
            </div>

            {/* List Rows */}
            {data.map((entry, idx) => {
              const score = getScoreForCategory(entry);
              const isTopThree = idx < 3;
              const isExpanded = expandedId === entry.presentationId;
              const detail = detailData[entry.presentationId];
              const isLoadingDetail = detailLoading === entry.presentationId;
              
              return (
                <div key={entry.userId} className="flex flex-col">
                  <motion.button 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => toggleExpand(entry.presentationId)}
                    className={cn(
                      "grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] gap-4 items-center p-4 rounded-2xl border transition-all duration-200 text-left w-full cursor-pointer",
                      isExpanded
                        ? "border-primary/30 bg-primary/[0.06] rounded-b-none"
                        : isTopThree 
                          ? "border-white/10 bg-white/5 hover:bg-white/[0.08]" 
                          : "border-white/5 bg-card/30 hover:bg-white/[0.08]"
                    )}
                  >
                    <div className="w-12 text-center font-mono">
                      {isTopThree ? (
                        <span className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-full font-bold",
                          idx === 0 && "bg-yellow-500/20 text-yellow-500",
                          idx === 1 && "bg-slate-400/20 text-slate-300",
                          idx === 2 && "bg-orange-500/20 text-orange-400"
                        )}>
                          #{entry.rank}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">#{entry.rank}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={entry.avatarUrl || undefined} />
                        <AvatarFallback className="bg-muted">
                          {entry.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm md:text-base">{entry.name}</span>
                    </div>

                    <div className="hidden md:flex items-center text-sm text-muted-foreground">
                      <span className="truncate">{entry.presentationTitle || "Pending"}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-right font-mono font-medium whitespace-nowrap">
                        {formatScore(score)} <span className="text-muted-foreground text-xs uppercase ml-1">pts</span>
                      </span>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </motion.button>

                  {/* Expandable Detail Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border border-t-0 border-primary/30 rounded-b-2xl bg-primary/[0.03] p-5 md:p-6">
                          {isLoadingDetail ? (
                            <div className="flex justify-center py-8">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                          ) : detail ? (
                            <div className="space-y-6">
                              {/* Score Breakdown */}
                              <div>
                                <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Trophy className="h-3.5 w-3.5" />
                                  Score Breakdown
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {scoreCategories.map((cat) => {
                                    const avg = detail.score
                                      ? Number(detail.score[cat.key.replace("Score", "") === "idea" ? "avgIdea" : cat.key.replace("Score", "") === "execution" ? "avgExecution" : cat.key.replace("Score", "") === "helpfulness" ? "avgHelpfulness" : "avgPresentation" as keyof typeof detail.score])
                                      : 0;
                                    return (
                                      <div key={cat.key} className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-[11px] font-medium text-muted-foreground">{cat.label}</span>
                                          <span className={cn("text-sm font-bold font-mono", cat.color)}>{formatScore(avg)}</span>
                                        </div>
                                        <ScoreBar value={avg} color={cat.bg} />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Project Info */}
                              {(detail.problemStatement || detail.approach) && (
                                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-2">
                                  {detail.problemStatement && (
                                    <div>
                                      <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Problem</span>
                                      <p className="text-sm text-foreground/80 mt-0.5">{detail.problemStatement}</p>
                                    </div>
                                  )}
                                  {detail.approach && (
                                    <div>
                                      <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Approach</span>
                                      <p className="text-sm text-foreground/80 mt-0.5">{detail.approach}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* AI Tools */}
                              {detail.aiToolsUsed.length > 0 && (
                                <div>
                                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Tools Used</span>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {detail.aiToolsUsed.map((tool) => (
                                      <span key={tool} className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.05] text-[11px] font-medium text-white/70">
                                        {tool}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Individual Votes — only visible to admins and the presenter (after voting closes) */}
                              {detail.canSeeVotes && detail.votes.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Users className="h-3.5 w-3.5" />
                                    Individual Votes ({detail.votes.length})
                                  </h4>
                                  <div className="space-y-1.5">
                                    {detail.votes.map((vote) => (
                                      <div
                                        key={vote.id}
                                        className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                                      >
                                        {/* Voter */}
                                        <div className="flex items-center gap-2 sm:w-40 shrink-0">
                                          <Avatar className="h-6 w-6 border border-white/10">
                                            <AvatarImage src={vote.voter.avatarUrl || undefined} />
                                            <AvatarFallback className="text-[9px] bg-muted">
                                              {vote.voter.name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs font-medium text-foreground/90 truncate">{vote.voter.name}</span>
                                        </div>

                                        {/* Scores inline */}
                                        <div className="flex items-center gap-4 flex-wrap flex-1">
                                          {scoreCategories.map((cat) => {
                                            const raw = vote[cat.key];
                                            const val = Math.min(raw, 5);
                                            return (
                                              <div key={cat.key} className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-muted-foreground w-16 shrink-0">{cat.label}</span>
                                                <StarRow value={val} />
                                                <span className={cn("text-[11px] font-mono font-bold w-4 text-right", cat.color)}>{val}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Failed to load details.</p>
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
      </div>
    );
  };

  const pillTabs = (
    <div className="flex justify-center">
      <div className="bg-white/5 border border-white/5 p-1.5 rounded-full inline-flex overflow-x-auto hide-scrollbar">
        {categoryTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                isActive ? "text-white" : "text-muted-foreground hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="leaderboardTabs"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <PageShell>
      <PageHeader 
        icon={Trophy} 
        title="Leaderboard" 
        description="Live rankings and detailed scoring metrics"
        className="mb-4"
      />

      {renderContent()}
    </PageShell>
  );
}
