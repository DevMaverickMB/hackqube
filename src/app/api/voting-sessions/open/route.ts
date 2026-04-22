import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse, errorResponse } from "@/lib/auth-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const body = await req.json();
  const { presentation_id, duration_seconds } = body;

  if (!presentation_id) {
    return errorResponse("presentation_id is required", 400);
  }

  // Clamp duration between 60s (1 min) and 600s (10 min), default 120s (2 min)
  const duration = Math.max(60, Math.min(600, Number(duration_seconds) || 120));

  // Check no active session exists
  const existing = await prisma.votingSession.findFirst({
    where: { isActive: true },
  });

  if (existing) {
    return errorResponse("A voting session is already active", 409);
  }

  const now = new Date();
  const closesAt = new Date(now.getTime() + duration * 1000);

  const session = await prisma.votingSession.create({
    data: {
      presentationId: presentation_id,
      openedAt: now,
      closesAt,
      openedBy: user.id,
      isActive: true,
    },
  });

  // Update presentation status to completed
  await prisma.presentation.update({
    where: { id: presentation_id },
    data: { status: "completed" },
  });

  // Broadcast voting open event via Supabase Realtime
  await supabaseAdmin
    .channel("voting-session")
    .send({
      type: "broadcast",
      event: "voting-open",
      payload: {
        sessionId: session.id,
        presentationId: presentation_id,
        closesAt: closesAt.toISOString(),
      },
    });

  return NextResponse.json({
    id: session.id,
    closesAt: closesAt.toISOString(),
    isActive: true,
  });
}
