import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, errorResponse } from "@/lib/auth-utils";
import { shareArticleSchema } from "@/lib/validations";
import { fetchOgMetadata } from "@/lib/og-metadata";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const source = searchParams.get("source"); // "user" | "rss" | "newsapi" | null (all)

  const where = source ? { source: source as "user" | "rss" | "newsapi" } : {};

  const articles = await prisma.sharedArticle.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [
      { pinnedUntil: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    include: {
      sharedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const hasMore = articles.length > limit;
  const items = hasMore ? articles.slice(0, limit) : articles;

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const parsed = shareArticleSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid article data", 400);
  }

  const { url, title, description } = parsed.data;

  // Check for duplicate URL shared in the last 24 hours
  const existingRecent = await prisma.sharedArticle.findFirst({
    where: {
      url,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (existingRecent) {
    return errorResponse("This article was already shared recently", 409);
  }

  // Fetch OG metadata for auto-fill
  const og = await fetchOgMetadata(url);

  const article = await prisma.sharedArticle.create({
    data: {
      url,
      title: title || og.title || url,
      description: description || og.description || null,
      imageUrl: og.image || null,
      sourceName: og.siteName || new URL(url).hostname.replace("www.", ""),
      source: "user",
      sharedById: user.id,
    },
    include: {
      sharedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(article, { status: 201 });
}
