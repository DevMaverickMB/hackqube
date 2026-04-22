import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse, errorResponse } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  const presentation = await prisma.presentation.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, email: true } },
      score: true,
      votes: {
        include: {
          voter: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!presentation) {
    return errorResponse("Presentation not found", 404);
  }

  // Only admins can see individual votes
  const canSeeVotes = user.role === "admin";

  const result = {
    ...presentation,
    votes: canSeeVotes ? presentation.votes : [],
    canSeeVotes,
  };

  return NextResponse.json(result);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const { id } = await params;
  const body = await req.json();

  // Whitelist allowed fields to prevent mass assignment
  const allowedFields = [
    "title", "problemStatement", "aiToolsUsed", "approach",
    "demoLink", "impactLevel", "category", "status",
    "implementationStatus", "attachments",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  const presentation = await prisma.presentation.update({
    where: { id },
    data,
  });

  return NextResponse.json(presentation);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const { id } = await params;

  // Soft delete - mark as cancelled
  const presentation = await prisma.presentation.update({
    where: { id },
    data: { status: "cancelled" },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "delete_presentation",
      targetType: "presentation",
      targetId: id,
      afterVal: { status: "cancelled" },
    },
  });

  return NextResponse.json(presentation);
}
