import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse, errorResponse } from "@/lib/auth-utils";
import { scheduleAssignSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const { id } = await params;

  const body = await req.json();
  const parsed = scheduleAssignSchema.partial().safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid schedule data", 400);
  }

  const existing = await prisma.presentation.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse("Schedule entry not found", 404);
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.user_id) updateData.userId = parsed.data.user_id;
  if (parsed.data.scheduled_date) updateData.scheduledDate = new Date(parsed.data.scheduled_date);
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;

  const presentation = await prisma.presentation.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(presentation);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const { id } = await params;

  const existing = await prisma.presentation.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse("Schedule entry not found", 404);
  }

  await prisma.presentation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
