import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://localhost:8081";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const backendUrl = new URL("/api/premio/filter", BACKEND_BASE);

    // preserva todos os parâmetros
    url.searchParams.forEach((v, k) => backendUrl.searchParams.set(k, v));

    const access = (await cookies()).get("gc.access")?.value ?? "";
    const res = await fetch(backendUrl.toString(), {
        method: "GET",
        headers: {
            Accept: "application/json",
            ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        cache: "no-store",
    });

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json")
        ? await res.json().catch(() => ({}))
        : await res.text();

    return NextResponse.json(typeof body === "string" ? { message: body } : body, {
        status: res.status,
    });
}
