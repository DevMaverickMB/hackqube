"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Newspaper,
  ExternalLink,
  Rss,
  Globe,
  User,
  RefreshCw,
  ChevronDown,
  Sparkles,
  MoreVertical,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  Star,
} from "lucide-react";
import { ShareArticleDialog } from "./share-article-dialog";
import { EditArticleDialog } from "./edit-article-dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Article {
  id: string;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  source: "user" | "rss" | "newsapi";
  sourceName: string | null;
  pinnedUntil: string | null;
  createdAt: string;
  sharedBy: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

const SOURCE_CONFIG = {
  user: { icon: User, label: "Shared", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  rss: { icon: Rss, label: "RSS", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  newsapi: { icon: Globe, label: "News", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

function isPinned(article: Article) {
  return article.pinnedUntil && new Date(article.pinnedUntil) > new Date();
}

function ArticleItem({
  article,
  index,
  currentClerkId,
  userRole,
  onDelete,
  onEdit,
  onTogglePin,
}: {
  article: Article;
  index: number;
  currentClerkId: string | null | undefined;
  userRole: "admin" | "participant" | null;
  onDelete: (id: string) => void;
  onEdit: (article: Article) => void;
  onTogglePin: (id: string, pin: boolean, days?: number) => void;
}) {
  const config = SOURCE_CONFIG[article.source];
  const SourceIcon = config.icon;
  const initials = article.sharedBy?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isOwner = article.sharedBy && currentClerkId && article.sharedBy.id === currentClerkId;
  const isAdmin = userRole === "admin";
  const canManage = isOwner || isAdmin;
  const pinned = isPinned(article);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={cn(
        "group relative flex gap-3 rounded-xl px-2 py-2 -mx-2 transition-all duration-200",
        "hover:bg-white/[0.04] hover:ring-1 hover:ring-white/5",
        pinned && "bg-amber-500/[0.04] ring-1 ring-amber-500/10"
      )}
    >
      {/* Thumbnail */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0"
      >
        {article.imageUrl ? (
          <div className="relative w-18 h-18 rounded-lg overflow-hidden bg-white/5">
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-18 h-18 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-slate-500" />
          </div>
        )}
      </a>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">
            {article.title}
          </h4>
        </a>

        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {pinned && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="inline-flex cursor-default">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium border bg-amber-500/10 border-amber-500/20 text-amber-400 gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                    Pinned
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Pinned by admin
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-medium border", config.bg, config.color)}>
            <SourceIcon className="w-2.5 h-2.5 mr-0.5" />
            {article.sourceName || config.label}
          </Badge>

          {article.sharedBy && (
            <div className="flex items-center gap-1">
              <Avatar className="w-3.5 h-3.5">
                <AvatarImage src={article.sharedBy.avatarUrl || undefined} />
                <AvatarFallback className="text-[6px] bg-muted">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-slate-500">{article.sharedBy.name.split(" ")[0]}</span>
            </div>
          )}

          <span className="text-[10px] text-slate-600">
            {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1 flex-shrink-0">
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white hover:bg-white/10 outline-none cursor-pointer">
              <MoreVertical className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {(isOwner || isAdmin) && article.source === "user" && (
                <DropdownMenuItem onClick={() => onEdit(article)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {isAdmin && !pinned && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Pin className="w-3.5 h-3.5 mr-2" />
                    Pin to top
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => onTogglePin(article.id, true, 1)}>
                      1 day
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTogglePin(article.id, true, 7)}>
                      7 days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTogglePin(article.id, true, 30)}>
                      30 days
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {isAdmin && pinned && (
                <DropdownMenuItem onClick={() => onTogglePin(article.id, false)}>
                  <PinOff className="w-3.5 h-3.5 mr-2" />
                  Unpin
                </DropdownMenuItem>
              )}
              {(isOwner || isAdmin) && (
                <DropdownMenuItem
                  onClick={() => onDelete(article.id)}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-white"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </motion.div>
  );
}

export function TechFeed() {
  const { user: clerkUser } = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "user" | "rss" | "newsapi">("all");
  const [userRole, setUserRole] = useState<"admin" | "participant" | null>(null);
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Fetch current user's DB role
  useEffect(() => {
    if (!clerkUser) return;
    fetch("/api/users/me")
      .then((r) => r.ok ? r.json() : null)
      .then((u) => {
        if (u) {
          setUserRole(u.role);
          setCurrentDbUserId(u.id);
        }
      })
      .catch(() => {});
  }, [clerkUser]);

  const fetchArticles = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (filter !== "all") params.set("source", filter);
      params.set("limit", "10");

      const res = await fetch(`/api/articles?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      if (cursor) {
        setArticles((prev) => [...prev, ...data.items]);
      } else {
        setArticles(data.items);
      }
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchArticles().finally(() => setLoading(false));
  }, [fetchArticles]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    await fetchArticles(nextCursor);
    setLoadingMore(false);
  };

  const handleArticleShared = () => {
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        toast.success("Article removed");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleTogglePin = async (id: string, pin: boolean, days?: number) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, ...(days && { pinDays: days }) }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, pinnedUntil: updated.pinnedUntil } : a))
        );
        toast.success(pin ? `Pinned to top for ${days} day${days === 1 ? "" : "s"}` : "Unpinned");
        // Re-fetch to get correct sort order
        fetchArticles();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update pin");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleEditSave = async (id: string, data: { title: string; description: string }) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, title: updated.title, description: updated.description } : a))
        );
        setEditingArticle(null);
        toast.success("Article updated");
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const filters = [
    { key: "all" as const, label: "All", icon: Sparkles },
    { key: "user" as const, label: "Shared", icon: User },
    { key: "rss" as const, label: "RSS", icon: Rss },
    { key: "newsapi" as const, label: "News", icon: Globe },
  ];

  return (
    <>
    <Card className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl flex flex-col">
      {/* Header — matches UpcomingSessionsCard / LeaderboardPreview */}
      <div className="p-5 pb-3 flex items-center justify-between border-b border-white/5">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="bg-violet-500/20 text-violet-400 p-1.5 rounded-lg">
            <Newspaper className="h-4 w-4" />
          </span>
          Tech Feed
        </h3>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setLoading(true); fetchArticles().finally(() => setLoading(false)); }}
            className="h-7 w-7 text-slate-500 hover:text-slate-300"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
          <ShareArticleDialog onSuccess={handleArticleShared} />
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.02] border border-white/5">
          {filters.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  filter === f.key
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-400"
                )}
              >
                <Icon className="w-3 h-3" />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Articles list with custom scrollbar */}
        <div className="max-h-[480px] overflow-y-auto feed-scrollbar">
          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-16 h-16 rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                    <div className="h-2 bg-white/5 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-white/5 p-4 ring-1 ring-white/10">
                <Newspaper className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No articles yet</p>
              <p className="text-xs text-slate-500 mt-1">Share a link to get things started</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="flex flex-col divide-y divide-white/[0.03]">
                {articles.map((article, i) => (
                  <ArticleItem
                    key={article.id}
                    article={article}
                    index={i}
                    currentClerkId={currentDbUserId}
                    userRole={userRole}
                    onDelete={handleDelete}
                    onEdit={setEditingArticle}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* Load more */}
          {nextCursor && !loading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full mt-2 text-slate-500 hover:text-slate-300 text-xs"
            >
              {loadingMore ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 mr-1" />
              )}
              Load more
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Edit dialog */}
    {editingArticle && (
      <EditArticleDialog
        article={editingArticle}
        open={!!editingArticle}
        onOpenChange={(open) => { if (!open) setEditingArticle(null); }}
        onSave={handleEditSave}
      />
    )}
    </>
  );
}
