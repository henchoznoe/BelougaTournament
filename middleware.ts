import { decrypt } from "@/lib/auth";
import type { NextRequest } from "next/server";
/**
 * File: middleware.ts
 * Description: Middleware for protecting admin routes using JWT authentication.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const payload = await decrypt(session);
      if (!payload || (payload.user.role !== "ADMIN" && payload.user.role !== "SUPERADMIN")) {
         return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
