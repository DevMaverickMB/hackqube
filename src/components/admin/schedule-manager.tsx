"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CalendarPlus,
  CalendarIcon,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
}

interface ScheduleEntry {
  id: string;
  scheduledDate: string | null;
  title: string | null;
  status: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

export function ScheduleManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<string>("none");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null);
  const [editUser, setEditUser] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [editDatePickerOpen, setEditDatePickerOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation
  const [deleteEntry, setDeleteEntry] = useState<ScheduleEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch("/api/users").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/schedule").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([u, s]) => {
        setUsers(Array.isArray(u) ? u : []);
        setSchedule(Array.isArray(s) ? s : []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? "Select user";

  const handleAssign = async () => {
    if (!selectedUser || !selectedDate) {
      toast.error("Select both a user and a date");
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      let res: Response;

      if (selectedSubmission && selectedSubmission !== "none") {
        // Schedule an existing unscheduled submission.
        res = await fetch(`/api/schedule/${selectedSubmission}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedUser,
            scheduled_date: dateStr,
          }),
        });
      } else {
        // Create a placeholder schedule entry without a submission.
        res = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedUser,
            scheduled_date: dateStr,
          }),
        });
      }

      if (res.ok) {
        toast.success("Presenter assigned!");
        setSelectedUser("");
        setSelectedSubmission("none");
        setSelectedDate(undefined);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to assign");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editEntry || !editUser || !editDate) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/schedule/${editEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: editUser,
          scheduled_date: format(editDate, "yyyy-MM-dd"),
        }),
      });

      if (res.ok) {
        toast.success("Schedule updated!");
        setEditEntry(null);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/schedule/${deleteEntry.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Schedule entry removed!");
        setDeleteEntry(null);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditDialog = (entry: ScheduleEntry) => {
    setEditEntry(entry);
    setEditUser(entry.user.id);
    setEditDate(entry.scheduledDate ? new Date(entry.scheduledDate) : undefined);
  };

  // Submissions belonging to the currently selected presenter that aren't
  // scheduled yet. These are eligible to be attached when assigning a date.
  const availableSubmissions = selectedUser
    ? schedule.filter(
        (s) => s.user.id === selectedUser && s.scheduledDate === null
      )
    : [];

  // Split into scheduled (grouped by date, numbered as Day N) and unscheduled.
  const scheduledGroups = schedule
    .filter((e) => e.scheduledDate !== null)
    .reduce<{ date: string; entries: ScheduleEntry[] }[]>((acc, entry) => {
      const dateStr = entry.scheduledDate!.split("T")[0];
      const group = acc.find((g) => g.date === dateStr);
      if (group) group.entries.push(entry);
      else acc.push({ date: dateStr, entries: [entry] });
      return acc;
    }, [])
    .sort((a, b) => a.date.localeCompare(b.date));

  const unscheduledEntries = schedule.filter((e) => e.scheduledDate === null);

  const renderEntry = (entry: ScheduleEntry) => (
    <div
      key={entry.id}
      className="flex items-center justify-between rounded-lg border p-3"
    >
      <div className="flex items-center gap-3">
        <div>
          <p className="font-medium text-sm">{entry.user.name}</p>
          {entry.title && (
            <p className="text-xs text-muted-foreground">{entry.title}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant={entry.status === "completed" ? "default" : "secondary"}
          className={
            entry.status === "completed" ? "bg-green-500 text-white" : ""
          }
        >
          {entry.status === "completed" ? (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
            </>
          ) : (
            <>
              <Clock className="h-3 w-3 mr-1" /> Upcoming
            </>
          )}
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => openEditDialog(entry)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setDeleteEntry(entry)}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Assign presenter card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Assign Presenter to Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Presenter</Label>
              <Select
                value={selectedUser}
                onValueChange={(v) => {
                  setSelectedUser(v ?? "");
                  setSelectedSubmission("none");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user">
                    {selectedUser ? getUserName(selectedUser) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Submission *</Label>
              <Select
                value={selectedSubmission}
                onValueChange={(v) => setSelectedSubmission(v ?? "none")}
                disabled={!selectedUser}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select submission">
                    {selectedSubmission === "none"
                      ? "No submission (placeholder)"
                      : availableSubmissions.find(
                          (s) => s.id === selectedSubmission
                        )?.title?.trim() || "Untitled submission"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    No submission (placeholder)
                  </SelectItem>
                  {availableSubmissions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title?.trim() || "Untitled submission"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUser && availableSubmissions.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No unscheduled submissions for this presenter.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    />
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "PPP")
                    : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date ?? undefined);
                      setDatePickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleAssign}
                disabled={loading || !selectedUser || !selectedDate}
              >
                Assign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current schedule card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Current Schedule ({schedule.length} presentation
            {schedule.length !== 1 ? "s" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledGroups.length === 0 && unscheduledEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No presentations scheduled yet
            </p>
          ) : (
            <div className="space-y-4">
              {scheduledGroups.map((group, gi) => (
                <div key={group.date} className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground px-1">
                    Day {gi + 1} &mdash;{" "}
                    {format(
                      new Date(group.date + "T00:00:00"),
                      "EEEE, MMM d, yyyy"
                    )}
                  </p>
                  {group.entries.map((entry) => renderEntry(entry))}
                </div>
              ))}
              {unscheduledEntries.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground px-1">
                    Unscheduled
                  </p>
                  {unscheduledEntries.map((entry) => renderEntry(entry))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog
        open={!!editEntry}
        onOpenChange={(open) => {
          if (!open) setEditEntry(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule Entry</DialogTitle>
            <DialogDescription>
              Change the presenter or date for this entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Presenter</Label>
              <Select
                value={editUser}
                onValueChange={(v) => setEditUser(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user">
                    {editUser ? getUserName(editUser) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover
                open={editDatePickerOpen}
                onOpenChange={setEditDatePickerOpen}
              >
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editDate && "text-muted-foreground"
                      )}
                    />
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editDate ? format(editDate, "PPP") : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={(date) => {
                      setEditDate(date ?? undefined);
                      setEditDatePickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditEntry(null)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editLoading || !editUser || !editDate}
            >
              {editLoading ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteEntry}
        onOpenChange={(open) => {
          if (!open) setDeleteEntry(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Schedule Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deleteEntry?.user.name}</strong> from the schedule on{" "}
              <strong>
                {deleteEntry?.scheduledDate
                  ? format(
                      new Date(deleteEntry.scheduledDate),
                      "MMM d, yyyy"
                    )
                  : "—"}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteEntry(null)}
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
    </div>
  );
}
