import { NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/verify", "/", "/login"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

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
    const { role } = authData;

    // Check role-based access
    if (pathname.startsWith("/admin") && role !== "admin") {
      // Redirect non-admins away from admin routes
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }

    if (
      pathname.startsWith("/issuer") &&
      role !== "issuer" &&
      role !== "admin"
    ) {
      // Redirect non-issuers away from issuer routes
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }

    if (
      pathname.startsWith("/holder") &&
      role !== "holder" &&
      role !== "admin" &&
      role !== "issuer"
    ) {
      // Redirect away from holder routes
      return NextResponse.redirect(new URL("/", request.url));
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
