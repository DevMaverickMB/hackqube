import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const presentationId = req.nextUrl.searchParams.get("presentationId");

  // If a specific presentation is provided, get votes for it
  // Otherwise, get votes for the currently active session
  let targetPresentationId = presentationId;

  if (!targetPresentationId) {
    const activeSession = await prisma.votingSession.findFirst({
      where: { isActive: true },
    });
    if (!activeSession) {
      return NextResponse.json({ votes: [], presentationId: null });
    }
    targetPresentationId = activeSession.presentationId;
  }

  const votes = await prisma.vote.findMany({
    where: { presentationId: targetPresentationId },
    include: {
      voter: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({
    votes,
    presentationId: targetPresentationId,
  });
}
