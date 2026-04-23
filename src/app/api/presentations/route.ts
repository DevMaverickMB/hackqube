import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse, errorResponse } from "@/lib/auth-utils";
import { presentationSchema } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const presentations = await prisma.presentation.findMany({
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      score: true,
    },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json(presentations);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const parsed = presentationSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid presentation data", 400);
  }

  const data = {
    title: parsed.data.title,
    problemStatement: parsed.data.problem_statement,
    aiToolsUsed: parsed.data.ai_tools_used,
    approach: parsed.data.approach,
    demoLink: parsed.data.demo_link || null,
    impactLevel: parsed.data.impact_level,
    category: parsed.data.category,
    attachments: parsed.data.attachments ?? [],
  };

  // Find the user's most recent upcoming presentation (scheduled or not)
  const existing = await prisma.presentation.findFirst({
    where: { userId: user.id, status: "upcoming" },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const updated = await prisma.presentation.update({
      where: { id: existing.id },
      data,
    });
    return NextResponse.json(updated);
  }

  // No existing submission — create a new unscheduled one. Admin can schedule later.
  const created = await prisma.presentation.create({
    data: {
      ...data,
      userId: user.id,
      scheduledDate: null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
