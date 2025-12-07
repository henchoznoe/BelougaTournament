/**
 * File: proxy.ts
 * Description: Middleware for protecting admin routes using JWT authentication.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { decrypt } from "@/lib/auth-core";
import { APP_ROUTES } from "@/lib/config/routes";
import { Role } from "@/prisma/generated/prisma/enums";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

export const proxy = async (request: NextRequest) => {
  const session = request.cookies.get("session")?.value;

  if (request.nextUrl.pathname.startsWith(APP_ROUTES.ADMIN_DASHBOARD)) {
    if (!session) {
      return NextResponse.redirect(new URL(APP_ROUTES.LOGIN, request.url));
    }

    try {
      const payload = await decrypt(session);
      if (
        !payload ||
        (payload.user.role !== Role.ADMIN &&
          payload.user.role !== Role.SUPERADMIN)
      ) {
        return NextResponse.redirect(new URL(APP_ROUTES.LOGIN, request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL(APP_ROUTES.LOGIN, request.url));
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/admin/:path*"],
};
