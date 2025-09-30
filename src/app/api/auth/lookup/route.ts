// src/app/api/auth/lookup/route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function POST(req: Request) {
    const { identifier } = await req.json().catch(() => ({}));
    if (!identifier) {
        return NextResponse.json({ message: "identifier é obrigatório" }, { status: 400 });
    }

    const res = await backend(`/api/auth/lookup?identifier=${encodeURIComponent(identifier)}`, {
        method: "POST",
    });

    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
}
