"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Archive, Search, ExternalLink, Paperclip, FileText } from "lucide-react";
import { format } from "date-fns";
import { formatScore } from "@/lib/scoring";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

interface PresentationEntry {
  id: string;
  title: string | null;
  problemStatement: string | null;
  aiToolsUsed: string[];
  approach: string | null;
  demoLink: string | null;
  attachments: string[];
  impactLevel: string | null;
  category: string | null;
  status: string;
  implementationStatus: string;
  scheduledDate: string | null;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  score: {
    finalScore: string | number;
    avgIdea: string | number;
    avgExecution: string | number;
    avgHelpfulness: string | number;
    avgPresentation: string | number;
    voteCount: number;
  } | null;
}

export default function ArchivePage() {
  const [presentations, setPresentations] = useState<PresentationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [selected, setSelected] = useState<PresentationEntry | null>(null);

  useEffect(() => {
    fetch("/api/presentations")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setPresentations(arr.filter((p: PresentationEntry) => p.status === "completed"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = presentations.filter((p) => {
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.problemStatement?.toLowerCase().includes(search.toLowerCase()) ||
      p.approach?.toLowerCase().includes(search.toLowerCase()) ||
      p.aiToolsUsed.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesImpact = impactFilter === "all" || p.impactLevel === impactFilter;

    return matchesSearch && matchesCategory && matchesImpact;
  });

  return (
    <PageShell>
      <PageHeader icon={Archive} title="Idea Archive" description="Browse all submitted solutions from the sprint" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas, tools, problems..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue>
              {categoryFilter === "all" ? "All Categories" : categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ops">Operations</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={impactFilter} onValueChange={(v) => setImpactFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue>
              {impactFilter === "all" ? "All Impact" : impactFilter.charAt(0).toUpperCase() + impactFilter.slice(1) + " Impact"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Impact</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Archive className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold">No Ideas Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Try adjusting your search filters" : "Completed presentations will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const initials = p.user.name.split(" ").map((n) => n[0]).join("").toUpperCase();

            return (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border/60 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
              >
                {/* Subtle bottom glow matching app primary blue */}
                <div className="absolute -bottom-[30%] left-[10%] w-[80%] h-[60%] bg-primary/15 blur-[3rem] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Card content */}
                <div className="relative z-10 flex flex-col flex-1 p-5">

                  {/* Top: Avatar pill with score */}
                  <div className="flex items-center gap-2.5 mb-5">
                    <Avatar className="h-7 w-7 border border-border">
                      <AvatarImage src={p.user.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/15 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground/80">{p.user.name}</span>
                    {p.score && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-sm font-bold text-primary">
                          {formatScore(p.score.finalScore)}
                        </span>
                      </>
                    )}
                    {p.demoLink && (
                      <a
                        href={p.demoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Title & description */}
                  <h3 className="text-lg font-bold text-foreground leading-snug mb-2 line-clamp-2">
                    {p.title || "Untitled Presentation"}
                  </h3>
                  {p.problemStatement && (
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 mb-5">
                      {p.problemStatement}
                    </p>
                  )}

                  {/* Spacer to push footer down */}
                  <div className="flex-1" />

                  {/* AI tool badges */}
                  {p.aiToolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.aiToolsUsed.slice(0, 4).map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                          {tool}
                        </Badge>
                      ))}
                      {p.aiToolsUsed.length > 4 && (
                        <Badge variant="secondary" className="text-[11px] font-medium px-2.5 py-0.5 rounded-full text-muted-foreground">
                          +{p.aiToolsUsed.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer: date + status */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border/50 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    <span>{p.scheduledDate ? format(new Date(p.scheduledDate), "MMM d, yy") : "Unscheduled"}</span>
                    <span className="text-border">·</span>
                    <span>{p.implementationStatus.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (() => {
            const initials = selected.user.name.split(" ").map((n) => n[0]).join("").toUpperCase();
            const fileNameFromUrl = (url: string) => {
              try {
                const decoded = decodeURIComponent(url.split("/").pop() || "");
                // Remove the timestamp prefix (e.g. "1713600000000_")
                return decoded.replace(/^\d+_/, "");
              } catch {
                return "Attachment";
              }
            };

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl leading-snug pr-6">
                    {selected.title || "Untitled Presentation"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  {/* Presenter */}
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={selected.user.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selected.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selected.scheduledDate ? format(new Date(selected.scheduledDate), "MMMM d, yyyy") : "Unscheduled"}
                      </p>
                    </div>
                    {selected.score && (
                      <span className="ml-auto text-lg font-bold text-primary">
                        {formatScore(selected.score.finalScore)}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {selected.impactLevel && (
                      <Badge variant="outline" className="capitalize">{selected.impactLevel} impact</Badge>
                    )}
                    {selected.category && (
                      <Badge variant="outline" className="capitalize">{selected.category}</Badge>
                    )}
                    {selected.aiToolsUsed.map((tool) => (
                      <Badge key={tool} variant="secondary" className="text-xs">{tool}</Badge>
                    ))}
                  </div>

                  {/* Problem Statement */}
                  {selected.problemStatement && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Problem Statement</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.problemStatement}</p>
                    </div>
                  )}

                  {/* Approach */}
                  {selected.approach && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Approach / Solution</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.approach}</p>
                    </div>
                  )}

                  {/* Links & Attachments */}
                  {(selected.demoLink || (selected.attachments && selected.attachments.length > 0)) && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Links & Attachments</h4>
                      <div className="space-y-1.5">
                        {selected.demoLink && (
                          <a
                            href={selected.demoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">Demo Link</span>
                          </a>
                        )}
                        {selected.attachments?.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{fileNameFromUrl(url)}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score breakdown */}
                  {selected.score && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Score Breakdown</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                          <span className="text-muted-foreground">Idea</span>
                          <span className="font-semibold">{formatScore(selected.score.avgIdea)}</span>
                        </div>
                        <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                          <span className="text-muted-foreground">Execution</span>
                          <span className="font-semibold">{formatScore(selected.score.avgExecution)}</span>
                        </div>
                        <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                          <span className="text-muted-foreground">Helpfulness</span>
                          <span className="font-semibold">{formatScore(selected.score.avgHelpfulness)}</span>
                        </div>
                        <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                          <span className="text-muted-foreground">Presentation</span>
                          <span className="font-semibold">{formatScore(selected.score.avgPresentation)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{selected.score.voteCount} vote{selected.score.voteCount !== 1 ? "s" : ""}</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
