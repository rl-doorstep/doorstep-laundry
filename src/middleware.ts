import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const washPaths = ["/wash"];
const adminPaths = ["/admin"];
const adminApiPattern = /^\/api\/admin\/.+$/;
const staffApiPattern = /^\/api\/orders\/[^/]+\/status$/;
const customerPaths = ["/dashboard", "/book", "/account", "/welcome"];
const orderPathPattern = /^\/orders\/[^/]+$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isWashRoute = washPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAdminRoute =
    adminPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    adminApiPattern.test(pathname);
  const isStaffApi = staffApiPattern.test(pathname);
  const isCustomerRoute =
    customerPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    orderPathPattern.test(pathname);

  if (isAdminRoute) {
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    if ((token.role as string) !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isWashRoute || isStaffApi) {
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    const role = token.role as string | undefined;
    if (role !== "staff" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isCustomerRoute) {
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/book/:path*",
    "/orders/:path*",
    "/account/:path*",
    "/wash/:path*",
    "/admin/:path*",
    "/welcome",
    "/api/orders/:path*/status",
    "/api/admin/:path*",
  ],
};
