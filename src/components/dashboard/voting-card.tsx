"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTimeRemaining } from "@/lib/scoring";
import { toast } from "sonner";
import { Star, CheckCircle2, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface VotingCardProps {
  presentationId: string;
  closesAt: string | null;
  onVoteSubmitted: () => void;
}

const categories = [
  { key: "idea_score", label: "Idea", description: "Originality & potential impact", weight: "30%" },
  { key: "execution_score", label: "Execution", description: "Quality of the demo", weight: "30%" },
  { key: "helpfulness_score", label: "Helpfulness", description: "Business usefulness", weight: "20%" },
  { key: "presentation_score", label: "Presentation", description: "Clarity & communication", weight: "20%" },
] as const;

export function VotingCard({ presentationId, closesAt, onVoteSubmitted }: VotingCardProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(closesAt ? getTimeRemaining(closesAt) : 0);
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!closesAt) return;
    const update = () => {
      const remaining = getTimeRemaining(closesAt);
      setTimeLeft(remaining);
      if (remaining <= 0) setExpired(true);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [closesAt]);

  const allRated = categories.every((c) => scores[c.key] >= 1);

  const handleSubmit = async () => {
    if (!allRated || submitting || expired) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentation_id: presentationId,
          ...scores,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#3B82F6", "#60A5FA", "#93C5FD", "#2563EB"]
        });
        toast.success("Vote Locked In!");
        // Keep the success state visible for a moment before disappearing
        setTimeout(() => onVoteSubmitted(), 1500);
      } else {
        const data = await res.json();
        if (res.status === 409) {
          toast.error("You have already voted for this presentation");
        } else if (res.status === 403) {
          toast.error("Voting window is closed");
        } else {
          toast.error(data.error || "Failed to submit vote");
        }
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (expired && !success) {
    return (
      <Card className="border-border/60 opacity-70 bg-background/50 backdrop-blur-sm">
        <CardContent className="py-8 text-center">
          <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="font-semibold text-muted-foreground">Voting Closed</p>
          <p className="text-sm text-muted-foreground">The voting window has expired</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group rounded-2xl"
    >
      {/* Animated Gradient Border (Primary blue glow) */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-primary via-primary/60 to-primary rounded-2xl opacity-20 group-hover:opacity-60 blur-sm transition duration-500" />
      
      {/* Glassmorphic Inner Card */}
      <Card className="relative h-full bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 overflow-hidden">
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 relative z-10">
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Evaluate
          </h3>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 flex flex-col items-center justify-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.6 }}
              >
                <CheckCircle2 className="h-16 w-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Vote Submitted!</h2>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 relative z-10"
            >
              {categories.map((cat, idx) => (
                <motion.div 
                  key={cat.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-200 tracking-tight">{cat.label}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                        {cat.weight}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{cat.description}</span>
                  </div>

                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = (scores[cat.key] || 0) >= star;
                      return (
                        <motion.button
                          key={star}
                          whileHover={{ scale: 1.25, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setScores((prev) => ({ ...prev, [cat.key]: star }))}
                          className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-1"
                        >
                          <Star
                            className={cn(
                              "h-7 w-7 transition-colors duration-300",
                              isActive
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                                : "text-slate-600 dark:text-slate-700/50 hover:text-slate-400"
                            )}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              <Button
                className={cn(
                  "w-full h-14 mt-4 text-base font-bold tracking-wide rounded-xl transition-all duration-300",
                  !allRated 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5" 
                    : "bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-1"
                )}
                disabled={!allRated || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                    className="h-5 w-5 rounded-full border-2 border-black border-t-transparent"
                  />
                ) : (
                  "Lock In Final Vote"
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
