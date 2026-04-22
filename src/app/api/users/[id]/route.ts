import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse, errorResponse } from "@/lib/auth-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const { id } = await params;
  const body = await req.json();

  const allowedFields = ["role", "isActive"];
  const updateData: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updateData[key] = body[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse("No valid fields to update", 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData as { role?: "admin" | "participant"; isActive?: boolean },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "update_user",
      targetType: "user",
      targetId: id,
      afterVal: updateData as Record<string, string | boolean>,
    },
  });

  return NextResponse.json(updatedUser);
}
