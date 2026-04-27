import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, errorResponse } from "@/lib/auth-utils";
import { voteSchema } from "@/lib/validations";
import { computeFinalScore } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid vote data", 400);
  }

  const { presentation_id, idea_score, execution_score, helpfulness_score, presentation_score } = parsed.data;

  // Check active voting session
  const activeSession = await prisma.votingSession.findFirst({
    where: { presentationId: presentation_id, isActive: true },
  });

  if (!activeSession || !activeSession.closesAt) {
    return errorResponse("Voting window is closed", 403);
  }

  // Check if voting window has expired (with 5s grace period for client clock skew)
  if (Date.now() > activeSession.closesAt.getTime() + 5000) {
    return errorResponse("Voting window is closed", 403);
  }

  // Prevent self-voting
  const presentation = await prisma.presentation.findUnique({
    where: { id: presentation_id },
  });

  if (!presentation) {
    return errorResponse("Presentation not found", 404);
  }

  if (presentation.userId === user.id) {
    return errorResponse("You can't vote for your own presentation", 403);
  }

  // Check for duplicate vote
  const existingVote = await prisma.vote.findUnique({
    where: {
      voterId_presentationId: {
        voterId: user.id,
        presentationId: presentation_id,
      },
    },
  });

  if (existingVote) {
    return errorResponse("Vote already submitted", 409);
  }

  // Submit vote
  await prisma.vote.create({
    data: {
      voterId: user.id,
      presentationId: presentation_id,
      ideaScore: idea_score,
      executionScore: execution_score,
      helpfulnessScore: helpfulness_score,
      presentationScore: presentation_score,
    },
  });

  // Recompute scores
  const votes = await prisma.vote.findMany({
    where: { presentationId: presentation_id },
  });

  const count = votes.length;
  const avgIdea = votes.reduce((s: number, v: { ideaScore: number }) => s + v.ideaScore, 0) / count;
  const avgExecution = votes.reduce((s: number, v: { executionScore: number }) => s + v.executionScore, 0) / count;
  const avgHelpfulness = votes.reduce((s: number, v: { helpfulnessScore: number }) => s + v.helpfulnessScore, 0) / count;
  const avgPresentation = votes.reduce((s: number, v: { presentationScore: number }) => s + v.presentationScore, 0) / count;
  const finalScore = computeFinalScore({ avgIdea, avgExecution, avgHelpfulness, avgPresentation, voteCount: count });

  await prisma.score.upsert({
    where: { presentationId: presentation_id },
    update: {
      avgIdea,
      avgExecution,
      avgHelpfulness,
      avgPresentation,
      finalScore,
      voteCount: count,
      computedAt: new Date(),
    },
    create: {
      presentationId: presentation_id,
      avgIdea,
      avgExecution,
      avgHelpfulness,
      avgPresentation,
      finalScore,
      voteCount: count,
    },
  });

  return NextResponse.json({ success: true });
}
