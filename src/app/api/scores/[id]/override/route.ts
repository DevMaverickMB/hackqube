import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse, errorResponse } from "@/lib/auth-utils";
import { scoreOverrideSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  if (user.role !== "admin") return forbiddenResponse();

  const { id } = await params;
  const body = await req.json();
  const parsed = scoreOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid override data", 400);
  }

  const currentScore = await prisma.score.findUnique({
    where: { presentationId: id },
  });

  if (!currentScore) {
    return errorResponse("No scores found for this presentation", 404);
  }

  const beforeVal = {
    finalScore: Number(currentScore.finalScore),
  };

  await prisma.score.update({
    where: { presentationId: id },
    data: {
      finalScore: parsed.data.final_score,
      computedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "score_override",
      targetType: "score",
      targetId: currentScore.id,
      beforeVal,
      afterVal: {
        finalScore: parsed.data.final_score,
        reason: parsed.data.reason,
      },
    },
  });

  return NextResponse.json({ success: true });
}
