import { NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/auth-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  return NextResponse.json({
    id: user.id,
    role: user.role,
    name: user.name,
  });
}
