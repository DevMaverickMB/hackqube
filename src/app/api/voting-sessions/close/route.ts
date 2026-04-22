import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse, errorResponse } from "@/lib/auth-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const activeSession = await prisma.votingSession.findFirst({
    where: { isActive: true },
  });

  if (!activeSession) {
    return errorResponse("No active voting session", 404);
  }

  await prisma.votingSession.update({
    where: { id: activeSession.id },
    data: { isActive: false, closedAt: new Date() },
  });

  await supabaseAdmin
    .channel("voting-session")
    .send({
      type: "broadcast",
      event: "voting-close",
      payload: { sessionId: activeSession.id },
    });

  return NextResponse.json({ success: true });
}
