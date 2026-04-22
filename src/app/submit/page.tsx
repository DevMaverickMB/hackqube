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
