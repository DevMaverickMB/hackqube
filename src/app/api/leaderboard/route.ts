import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const view = searchParams.get("view");

  let orderByField: string;

  switch (category) {
    case "idea":
      orderByField = "avgIdea";
      break;
    case "execution":
      orderByField = "avgExecution";
      break;
    case "helpfulness":
      orderByField = "avgHelpfulness";
      break;
    case "presentation":
      orderByField = "avgPresentation";
      break;
    default:
      orderByField = "finalScore";
  }

  const whereClause: Record<string, unknown> = {
    presentation: { status: "completed" },
  };

  // Weekly view filter
  if (view === "weekly") {
    const weekParam = searchParams.get("week");
    if (weekParam) {
      // Calculate week boundaries based on sprint start
      // This is simplified — in production, derive from the actual sprint start date
      const now = new Date();
      const weekNum = parseInt(weekParam) || 1;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (weekNum - 1) * 7);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      whereClause.presentation = {
        status: "completed",
        scheduledDate: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      };
    }
  }

  const scores = await prisma.score.findMany({
    where: whereClause,
    include: {
      presentation: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { [orderByField]: "desc" },
  });

  const leaderboard = scores.map((score, index) => ({
    rank: index + 1,
    name: score.presentation.user.name,
    avatarUrl: score.presentation.user.avatarUrl,
    userId: score.presentation.user.id,
    presentationId: score.presentationId,
    presentationTitle: score.presentation.title,
    scheduledDate: score.presentation.scheduledDate,
    finalScore: Number(score.finalScore),
    avgIdea: Number(score.avgIdea),
    avgExecution: Number(score.avgExecution),
    avgHelpfulness: Number(score.avgHelpfulness),
    avgPresentation: Number(score.avgPresentation),
    voteCount: score.voteCount,
  }));

  return NextResponse.json(leaderboard);
}
