"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Lightbulb,
  Send,
  X,
  Plus,
  Paperclip,
  Loader2,
  Pencil,
  Trash2,
  CalendarDays,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

type FormState = {
  title: string;
  problem_statement: string;
  ai_tools_used: string[];
  approach: string;
  demo_link: string;
  impact_level: string;
  category: string;
};

type Attachment = { url: string; name: string };

interface MySubmission {
  id: string;
  title: string | null;
  problemStatement: string | null;
  aiToolsUsed: string[];
  approach: string | null;
  demoLink: string | null;
  impactLevel: string | null;
  category: string | null;
  status: string;
  scheduledDate: string | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  problem_statement: "",
  ai_tools_used: [],
  approach: "",
  demo_link: "",
  impact_level: "",
  category: "",
};

const fileNameFromUrl = (url: string) => {
  try {
    const path = new URL(url).pathname;
    const last = path.split("/").pop() ?? url;
    // Strip the timestamp_ prefix added at upload time.
    const trimmed = last.replace(/^\d+_/, "");
    return decodeURIComponent(trimmed);
  } catch {
    return url;
  }
};

export default function SubmitPage() {
  const [loading, setLoading] = useState(false);
  const [toolInput, setToolInput] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<MySubmission | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMySubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const res = await fetch("/api/presentations/me");
      if (res.ok) {
        const data: MySubmission[] = await res.json();
        setMySubmissions(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silently ignore — the form is still usable.
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setAttachments([]);
    setToolInput("");
    setEditingId(null);
  };

  const startEdit = (sub: MySubmission) => {
    setEditingId(sub.id);
    setForm({
      title: sub.title ?? "",
      problem_statement: sub.problemStatement ?? "",
      ai_tools_used: sub.aiToolsUsed ?? [],
      approach: sub.approach ?? "",
      demo_link: sub.demoLink ?? "",
      impact_level: sub.impactLevel ?? "",
      category: sub.category ?? "",
    });
    setAttachments(
      (sub.attachments ?? []).map((url) => ({ url, name: fileNameFromUrl(url) }))
    );
    setToolInput("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const addTool = () => {
    if (toolInput.trim() && !form.ai_tools_used.includes(toolInput.trim())) {
      setForm((prev) => ({
        ...prev,
        ai_tools_used: [...prev.ai_tools_used, toolInput.trim()],
      }));
      setToolInput("");
    }
  };

  const removeTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      ai_tools_used: prev.ai_tools_used.filter((t) => t !== tool),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
        return;
      }
      const data = await res.json();
      setAttachments((prev) => [...prev, { url: data.url, name: data.name }]);
      toast.success("File attached");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  };

  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.problem_statement ||
      !form.approach ||
      !form.impact_level ||
      !form.category ||
      form.ai_tools_used.length === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const attachmentUrls = attachments.map((a) => a.url);
      let res: Response;

      if (editingId) {
        // PATCH expects camelCase field names.
        res = await fetch(`/api/presentations/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            problemStatement: form.problem_statement,
            aiToolsUsed: form.ai_tools_used,
            approach: form.approach,
            demoLink: form.demo_link || null,
            impactLevel: form.impact_level,
            category: form.category,
            attachments: attachmentUrls,
          }),
        });
      } else {
        res = await fetch("/api/presentations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, attachments: attachmentUrls }),
        });
      }

      if (res.ok) {
        toast.success(
          editingId ? "Submission updated!" : "Submission saved successfully!"
        );
        resetForm();
        fetchMySubmissions();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save submission");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/presentations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Submission removed");
        if (editingId === deleteTarget.id) resetForm();
        setDeleteTarget(null);
        fetchMySubmissions();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to remove submission");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeSubmissions = mySubmissions.filter(
    (s) => s.status !== "cancelled"
  );

  return (
    <PageShell>
      <PageHeader
        icon={Lightbulb}
        title={editingId ? "Edit Your Submission" : "Submit Your Idea"}
        description={
          editingId
            ? "Update the details of your submission below"
            : "Describe the problem you solved and the AI tools you used"
        }
      />

      <Card>
        <CardContent className="p-6 space-y-6">
          {editingId && (
            <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
              <span>
                You&apos;re editing an existing submission. Changes will replace
                its current contents.
              </span>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancel edit
              </Button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Presentation Title *</Label>
            <Input
              id="title"
              placeholder="e.g., AI-Powered Field Ticket Classification"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <Label htmlFor="problem">Problem Statement *</Label>
            <Textarea
              id="problem"
              placeholder="Describe the real business or product problem you addressed..."
              rows={4}
              value={form.problem_statement}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  problem_statement: e.target.value,
                }))
              }
            />
          </div>

          {/* AI Tools Used */}
          <div className="space-y-2">
            <Label>AI Tools Used *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., ChatGPT, Claude, Copilot..."
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTool())
                }
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addTool}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.ai_tools_used.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.ai_tools_used.map((tool) => (
                  <Badge
                    key={tool}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {tool}
                    <button
                      onClick={() => removeTool(tool)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Approach */}
          <div className="space-y-2">
            <Label htmlFor="approach">Approach / Solution Summary *</Label>
            <Textarea
              id="approach"
              placeholder="Describe your solution, how you built it, and what it does..."
              rows={4}
              value={form.approach}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, approach: e.target.value }))
              }
            />
          </div>

          {/* Demo Link */}
          <div className="space-y-2">
            <Label htmlFor="demo">Demo Link (optional)</Label>
            <Input
              id="demo"
              type="url"
              placeholder="https://..."
              value={form.demo_link}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, demo_link: e.target.value }))
              }
            />
          </div>

          {/* File Attachment */}
          <div className="space-y-2">
            <Label>Attachment (optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={uploadingFile}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                {uploadingFile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                {uploadingFile ? "Uploading..." : "Attach File"}
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.pptx,.docx,.xlsx,.txt,.csv,.zip"
              />
              <span className="text-xs text-muted-foreground">
                Max 10 MB · PDF, images, docs, zip
              </span>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {attachments.map((att) => (
                  <div
                    key={att.url}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(att.url)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Impact + Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Impact Level *</Label>
              <Select
                value={form.impact_level}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, impact_level: v ?? "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select impact level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Functional Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, category: v ?? "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ops">Operations</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                className="sm:w-40 h-12"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              className="flex-1 h-12 text-base font-semibold shadow-md shadow-primary/20"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {editingId ? "Update Submission" : "Save Submission"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            My Submissions
            {!submissionsLoading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({activeSubmissions.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissionsLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Loading…
            </p>
          ) : activeSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              You haven&apos;t submitted any ideas yet.
            </p>
          ) : (
            <div className="space-y-2">
              {activeSubmissions.map((sub) => {
                const isCompleted = sub.status === "completed";
                const canEdit = sub.status === "upcoming";
                return (
                  <div
                    key={sub.id}
                    className={
                      "flex items-start justify-between gap-3 rounded-lg border p-3 " +
                      (editingId === sub.id ? "border-primary bg-primary/5" : "")
                    }
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium text-sm truncate">
                        {sub.title?.trim() || "Untitled submission"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {sub.scheduledDate ? (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {format(
                              new Date(sub.scheduledDate),
                              "MMM d, yyyy"
                            )}
                          </span>
                        ) : (
                          <span>Unscheduled</span>
                        )}
                        {isCompleted && (
                          <Badge
                            variant="default"
                            className="bg-green-500 text-white"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEdit(sub)}
                        disabled={!canEdit}
                        title={
                          canEdit
                            ? "Edit submission"
                            : "Completed submissions can't be edited"
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(sub)}
                        disabled={!canEdit}
                        title={
                          canEdit
                            ? "Remove submission"
                            : "Completed submissions can't be removed"
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {deleteTarget?.title?.trim() || "this submission"}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Send, X, Plus, Paperclip, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

export default function SubmitPage() {
  const [loading, setLoading] = useState(false);
  const [toolInput, setToolInput] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    problem_statement: "",
    ai_tools_used: [] as string[],
    approach: "",
    demo_link: "",
    impact_level: "" as string,
    category: "" as string,
  });

  const addTool = () => {
    if (toolInput.trim() && !form.ai_tools_used.includes(toolInput.trim())) {
      setForm((prev) => ({
        ...prev,
        ai_tools_used: [...prev.ai_tools_used, toolInput.trim()],
      }));
      setToolInput("");
    }
  };

  const removeTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      ai_tools_used: prev.ai_tools_used.filter((t) => t !== tool),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
        return;
      }
      const data = await res.json();
      setAttachments((prev) => [...prev, { url: data.url, name: data.name }]);
      toast.success("File attached");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.problem_statement || !form.approach || !form.impact_level || !form.category || form.ai_tools_used.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attachments: attachments.map((a) => a.url),
        }),
      });

      if (res.ok) {
        toast.success("Submission saved successfully!");
        // Clear the form so the user can submit another idea or leave the page.
        setForm({
          title: "",
          problem_statement: "",
          ai_tools_used: [],
          approach: "",
          demo_link: "",
          impact_level: "",
          category: "",
        });
        setAttachments([]);
        setToolInput("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save submission");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader icon={Lightbulb} title="Submit Your Idea" description="Describe the problem you solved and the AI tools you used" />

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Presentation Title *</Label>
            <Input
              id="title"
              placeholder="e.g., AI-Powered Field Ticket Classification"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <Label htmlFor="problem">Problem Statement *</Label>
            <Textarea
              id="problem"
              placeholder="Describe the real business or product problem you addressed..."
              rows={4}
              value={form.problem_statement}
              onChange={(e) => setForm((prev) => ({ ...prev, problem_statement: e.target.value }))}
            />
          </div>

          {/* AI Tools Used */}
          <div className="space-y-2">
            <Label>AI Tools Used *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., ChatGPT, Claude, Copilot..."
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTool())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addTool}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.ai_tools_used.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.ai_tools_used.map((tool) => (
                  <Badge key={tool} variant="secondary" className="gap-1 pr-1">
                    {tool}
                    <button onClick={() => removeTool(tool)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Approach */}
          <div className="space-y-2">
            <Label htmlFor="approach">Approach / Solution Summary *</Label>
            <Textarea
              id="approach"
              placeholder="Describe your solution, how you built it, and what it does..."
              rows={4}
              value={form.approach}
              onChange={(e) => setForm((prev) => ({ ...prev, approach: e.target.value }))}
            />
          </div>

          {/* Demo Link */}
          <div className="space-y-2">
            <Label htmlFor="demo">Demo Link (optional)</Label>
            <Input
              id="demo"
              type="url"
              placeholder="https://..."
              value={form.demo_link}
              onChange={(e) => setForm((prev) => ({ ...prev, demo_link: e.target.value }))}
            />
          </div>

          {/* File Attachment */}
          <div className="space-y-2">
            <Label>Attachment (optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={uploadingFile}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                {uploadingFile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                {uploadingFile ? "Uploading..." : "Attach File"}
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.pptx,.docx,.xlsx,.txt,.csv,.zip"
              />
              <span className="text-xs text-muted-foreground">Max 10 MB · PDF, images, docs, zip</span>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {attachments.map((att) => (
                  <div
                    key={att.url}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(att.url)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Impact + Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Impact Level *</Label>
              <Select
                value={form.impact_level}
                onValueChange={(v) => setForm((prev) => ({ ...prev, impact_level: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select impact level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Functional Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((prev) => ({ ...prev, category: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ops">Operations</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <Button
            className="w-full h-12 text-base font-semibold shadow-md shadow-primary/20"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Save Submission
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
