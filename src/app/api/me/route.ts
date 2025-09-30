// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { forwardWithTermsGuard } from "@/lib/api-guards";

export async function GET() {
    const res = await backend("/api/me", { method: "GET" });
    // se a API exigiu termos, devolvemos 428
    const maybeGuarded = await forwardWithTermsGuard(res);
    if (maybeGuarded.status !== 200) return maybeGuarded;

    // sucesso 200 → seu novo shape:
    // {
    //   "status":"success","ok":true,"message":"...","data":[ { name, email } ]
    // }
    const json = await res.json().catch(() => ({}));
    const user = Array.isArray(json?.data) ? json.data[0] : null;
    return NextResponse.json({ user, raw: json }, { status: 200 });
}
