import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse, errorResponse } from "@/lib/auth-utils";
import { scheduleAssignSchema } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const schedule = await prisma.presentation.findMany({
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      score: { select: { finalScore: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json(schedule);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const body = await req.json();
  const parsed = scheduleAssignSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid schedule data", 400);
  }

  const presentation = await prisma.presentation.create({
    data: {
      userId: parsed.data.user_id,
      scheduledDate: new Date(parsed.data.scheduled_date),
      title: parsed.data.title,
    },
  });

  return NextResponse.json(presentation, { status: 201 });
}
