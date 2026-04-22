"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Link, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ShareArticleDialogProps {
  onSuccess?: () => void;
}

export function ShareArticleDialog({ onSuccess }: ShareArticleDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setUrl("");
    setTitle("");
    setDescription("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          ...(title.trim() && { title: title.trim() }),
          ...(description.trim() && { description: description.trim() }),
        }),
      });

      if (res.status === 409) {
        toast.error("This article was already shared recently");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to share article");
        return;
      }

      toast.success("Article shared!");
      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger
        render={
          <Button variant="outline" size="xs" className="text-[10px] gap-1 text-slate-400 border-white/10 hover:border-white/15" />
        }
      >
        <Plus className="w-3 h-3" />
        Share
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share an Article</DialogTitle>
          <DialogDescription>
            Found something cool? Share it with the team — paste a URL from X, Reddit, or anywhere.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="article-url">URL *</Label>
            <div className="relative">
              <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <Input
                id="article-url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-8"
                required
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-500">We&apos;ll auto-detect the title and preview image</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-title">Title (optional)</Label>
            <Input
              id="article-title"
              placeholder="Override auto-detected title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-desc">Quick note (optional)</Label>
            <Textarea
              id="article-desc"
              placeholder="Why is this worth reading?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={2}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={!url.trim() || submitting}>
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Share Article
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
