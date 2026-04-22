import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorizedResponse, forbiddenResponse, errorResponse } from "@/lib/auth-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const article = await prisma.sharedArticle.findUnique({ where: { id } });
  if (!article) return errorResponse("Article not found", 404);

  const body = await req.json();

  // Pin/unpin — admin only, with selectable duration (1, 7, or 30 days)
  if ("pin" in body) {
    if (user.role !== "admin") return forbiddenResponse();

    let pinnedUntil: Date | null = null;
    if (body.pin) {
      const allowedDays = [1, 7, 30];
      const pinDays = allowedDays.includes(body.pinDays) ? body.pinDays : 1;
      pinnedUntil = new Date(Date.now() + pinDays * 24 * 60 * 60 * 1000);
    }

    const updated = await prisma.sharedArticle.update({
      where: { id },
      data: {
        pinnedAt: body.pin ? new Date() : null,
        pinnedUntil,
      },
    });

    return NextResponse.json(updated);
  }

  // Edit title/description — owner or admin
  const isOwner = article.sharedById === user.id;
  if (!isOwner && user.role !== "admin") return forbiddenResponse();

  const { title, description } = body;
  const data: Record<string, string | null> = {};
  if (typeof title === "string" && title.trim()) data.title = title.trim();
  if (typeof description === "string") data.description = description.trim() || null;

  if (Object.keys(data).length === 0) {
    return errorResponse("Nothing to update", 400);
  }

  const updated = await prisma.sharedArticle.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const article = await prisma.sharedArticle.findUnique({ where: { id } });
  if (!article) return errorResponse("Article not found", 404);

  const isOwner = article.sharedById === user.id;
  if (!isOwner && user.role !== "admin") return forbiddenResponse();

  await prisma.sharedArticle.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
