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

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.presentation.findUnique({ where: { id } });
  if (!existing) return errorResponse("Presentation not found", 404);

  const isAdmin = user.role === "admin";
  const isOwner = existing.userId === user.id;

  if (!isAdmin && !isOwner) return forbiddenResponse();

  // Owners can only edit content fields on their own upcoming submissions.
  // Admins can edit any field on any presentation.
  const adminOnlyFields = ["status", "implementationStatus"] as const;
  const contentFields = [
    "title",
    "problemStatement",
    "aiToolsUsed",
    "approach",
    "demoLink",
    "impactLevel",
    "category",
    "attachments",
  ] as const;
  const allowedFields = isAdmin
    ? [...contentFields, ...adminOnlyFields]
    : contentFields;

  if (!isAdmin && existing.status !== "upcoming") {
    return errorResponse(
      "Only upcoming submissions can be edited",
      400
    );
  }

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

  const { id } = await params;

  const existing = await prisma.presentation.findUnique({ where: { id } });
  if (!existing) return errorResponse("Presentation not found", 404);

  const isAdmin = user.role === "admin";
  const isOwner = existing.userId === user.id;

  if (!isAdmin && !isOwner) return forbiddenResponse();
  if (!isAdmin && existing.status !== "upcoming") {
    return errorResponse("Only upcoming submissions can be removed", 400);
  }

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
