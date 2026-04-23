"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Edit, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { formatScore } from "@/lib/scoring";

interface PresentationEntry {
  id: string;
  title: string | null;
  status: string;
  scheduledDate: string | null;
  user: { name: string };
  score: { finalScore: string | number; voteCount: number } | null;
}

export function SubmissionsManager() {
  const [presentations, setPresentations] = useState<PresentationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideScore, setOverrideScore] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const fetchPresentations = () => {
    fetch("/api/presentations")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPresentations(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will mark the submission as cancelled.")) return;

    try {
      const res = await fetch(`/api/presentations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Submission cancelled");
        fetchPresentations();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleScoreOverride = async () => {
    if (!overrideId || !overrideScore || !overrideReason) {
      toast.error("Score and reason are required");
      return;
    }

    try {
      const res = await fetch(`/api/scores/${overrideId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          final_score: parseFloat(overrideScore),
          reason: overrideReason,
        }),
      });

      if (res.ok) {
        toast.success("Score overridden (audit logged)");
        setOverrideId(null);
        setOverrideScore("");
        setOverrideReason("");
        fetchPresentations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to override");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          All Submissions ({presentations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="py-8 text-center">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Presenter</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentations.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.user.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                    {p.title || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.scheduledDate ? format(new Date(p.scheduledDate), "MMM d") : <span className="text-muted-foreground italic">Unscheduled</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "completed" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    {p.score ? formatScore(p.score.finalScore) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {p.score && (
                        <Dialog>
                          <DialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setOverrideId(p.id);
                                  setOverrideScore(String(Number(p.score!.finalScore)));
                                }}
                              />
                            }
                          >
                            <Star className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Override Score — {p.user.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label>New Final Score (0-5)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="5"
                                  value={overrideScore}
                                  onChange={(e) => setOverrideScore(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Reason (required for audit log)</Label>
                                <Input
                                  placeholder="Reason for override..."
                                  value={overrideReason}
                                  onChange={(e) => setOverrideReason(e.target.value)}
                                />
                              </div>
                              <Button className="w-full" onClick={handleScoreOverride}>
                                Apply Override
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
