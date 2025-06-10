import { NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/verify", "/", "/login"];

// Role hierarchy - higher roles inherit lower role permissions
const ROLE_HIERARCHY = {
  admin: ["admin", "issuer", "holder"],
  issuer: ["issuer", "holder"],
  holder: ["holder"],
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for authentication
  const authCookie = request.cookies.get("auth");

  if (!authCookie) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Parse auth data
    const authData = JSON.parse(authCookie.value);
    const { walletAddress, role } = authData;

    // For better security, you could re-verify role from database here
    // But for performance, trust the cookie if it's recent

    // Enhanced role-based access control with hierarchy
    const accessMap = {
      "/admin": ["admin"],
      "/dashboard": ["holder", "issuer", "admin"],
    };

    // Check if user can access this route using role hierarchy
    const requiredRoles = Object.entries(accessMap).find(([route]) =>
      pathname.startsWith(route)
    )?.[1];

    if (requiredRoles) {
      const userRoles = ROLE_HIERARCHY[role] || [role];
      const hasAccess = requiredRoles.some((reqRole) =>
        userRoles.includes(reqRole)
      );

      if (!hasAccess) {
        // Redirect to user's appropriate dashboard
        const redirectUrl = role === "admin" ? "/admin" : "/dashboard";

        // Add headers for better debugging
        const response = NextResponse.redirect(
          new URL(redirectUrl, request.url)
        );
        response.headers.set(
          "X-Auth-Redirect-Reason",
          "insufficient-permissions"
        );
        response.headers.set("X-User-Role", role);
        response.headers.set("X-Required-Roles", requiredRoles.join(","));

        return response;
      }
    }

    // Allow access
    return NextResponse.next();
  } catch (error) {
    // Invalid auth data
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Specify which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
