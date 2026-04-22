import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse } from "@/lib/auth-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const activeSession = await prisma.votingSession.findFirst({
    where: { isActive: true },
    include: {
      presentation: {
        include: { user: true },
      },
    },
  });

  if (!activeSession) {
    return NextResponse.json({ isActive: false, session: null });
  }

  // Check if expired
  if (activeSession.closesAt && new Date() > activeSession.closesAt) {
    await prisma.votingSession.update({
      where: { id: activeSession.id },
      data: { isActive: false, closedAt: new Date() },
    });
    return NextResponse.json({ isActive: false, session: null });
  }

  // Check if user already voted
  const existingVote = await prisma.vote.findUnique({
    where: {
      voterId_presentationId: {
        voterId: user.id,
        presentationId: activeSession.presentationId,
      },
    },
  });

  return NextResponse.json({
    isActive: true,
    session: {
      id: activeSession.id,
      presentationId: activeSession.presentationId,
      closesAt: activeSession.closesAt?.toISOString(),
      presenter: {
        name: activeSession.presentation.user.name,
        avatarUrl: activeSession.presentation.user.avatarUrl,
      },
      presentationTitle: activeSession.presentation.title,
    },
    hasVoted: !!existingVote,
    isPresenter: activeSession.presentation.userId === user.id,
  });
}
