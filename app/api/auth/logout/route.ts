import { NextResponse } from "next/server";
import { logout } from "@application/auth/logout";

export async function POST() {
  await logout();
  return NextResponse.json({ ok: true });
}
