import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try to find user by clerkId
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // Auto-provision user if not found (webhook may not have fired yet)
  if (!user) {
    // Fetch user info from Clerk
    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });

    if (clerkRes.ok) {
      const clerkUser = await clerkRes.json();
      const email = clerkUser.email_addresses?.[0]?.email_address || "";
      const name = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") || email || "User";
      const role = (clerkUser.public_metadata?.role as string) === "admin" ? "admin" : "participant";

      user = await prisma.user.upsert({
        where: { clerkId: userId },
        update: { name, email, avatarUrl: clerkUser.image_url },
        create: {
          clerkId: userId,
          name,
          email,
          role: role as "admin" | "participant",
          avatarUrl: clerkUser.image_url,
        },
      });
    }
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    role: user.role,
    name: user.name,
  });
}
