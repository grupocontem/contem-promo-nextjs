// src/app/api/term/route.ts
import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { forwardWithTermsGuard } from "@/lib/api-guards";

export async function GET() {
    const res = await backend("/api/term", { method: "GET" });
    return forwardWithTermsGuard(res); // pode virar 428 aqui também
}
