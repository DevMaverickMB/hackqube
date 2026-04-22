import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
      console.log(`[users/me] Auto-provisioning user ${userId}`);

      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      });

      if (!clerkRes.ok) {
        const errText = await clerkRes.text();
        console.error(`[users/me] Clerk API error ${clerkRes.status}: ${errText}`);
        return NextResponse.json({ error: "Failed to fetch user from Clerk" }, { status: 502 });
      }

      const clerkUser = await clerkRes.json();
      const email = clerkUser.email_addresses?.[0]?.email_address || "";
      const name = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") || email || "User";
      const role = (clerkUser.public_metadata?.role as string) === "admin" ? "admin" : "participant";

      console.log(`[users/me] Creating user: ${name} (${email}), role: ${role}`);

      try {
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
      } catch (dbErr: unknown) {
        // Handle email unique constraint - update existing record to use new clerkId
        const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.error(`[users/me] DB upsert error: ${errMsg}`);
        if (email && errMsg.includes("Unique constraint")) {
          user = await prisma.user.update({
            where: { email },
            data: { clerkId: userId, name, avatarUrl: clerkUser.image_url },
          });
        } else {
          throw dbErr;
        }
      }

      console.log(`[users/me] User provisioned: ${user.id}`);
    }

    return NextResponse.json({
      id: user.id,
      role: user.role,
      name: user.name,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[users/me] Unexpected error: ${errMsg}`);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
