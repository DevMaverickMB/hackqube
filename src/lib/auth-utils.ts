import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // Auto-provision from Clerk if not in DB yet
  if (!user) {
    try {
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      });
      if (clerkRes.ok) {
        const c = await clerkRes.json();
        const email = c.email_addresses?.[0]?.email_address || "";
        const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || email || "User";
        const role = (c.public_metadata?.role as string) === "admin" ? "admin" : "participant";

        try {
          user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: { name, email, avatarUrl: c.image_url },
            create: { clerkId: userId, name, email, role: role as "admin" | "participant", avatarUrl: c.image_url },
          });
        } catch {
          // Handle email unique constraint — claim existing record
          if (email) {
            user = await prisma.user.update({
              where: { email },
              data: { clerkId: userId, name, avatarUrl: c.image_url },
            }).catch(() => null);
          }
        }
      }
    } catch (err) {
      console.error("[auth-utils] Auto-provision failed:", err);
    }
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
