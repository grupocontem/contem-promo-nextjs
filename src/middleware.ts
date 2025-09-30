// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (
        pathname === "/" ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/terms")

    ) return NextResponse.next();

    const hasAccess = Boolean(req.cookies.get("gc.access")?.value);
    if (!hasAccess) {
        const url = req.nextUrl.clone(); url.pathname = "/login";
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
