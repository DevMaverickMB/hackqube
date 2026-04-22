"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Vote, Calendar, Users, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { VotingControl } from "@/components/admin/voting-control";
import { ScheduleManager } from "@/components/admin/schedule-manager";
import { UserManager } from "@/components/admin/user-manager";
import { SubmissionsManager } from "@/components/admin/submissions-manager";

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== "admin") {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || user?.publicMetadata?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader icon={Shield} title="Admin Panel" description="Manage voting sessions, schedule, users, and submissions" />

      <Tabs defaultValue="voting" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="voting" className="gap-1.5">
            <Vote className="h-3.5 w-3.5" />
            Voting Control
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voting">
          <VotingControl />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleManager />
        </TabsContent>
        <TabsContent value="users">
          <UserManager />
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionsManager />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
