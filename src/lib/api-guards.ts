// src/lib/api-guards.ts
import { NextResponse } from "next/server";
import { isJson } from "./backend";

export async function forwardWithTermsGuard(res: Response) {
    // tenta ler o body (sem quebrar content-type)
    let json: any = null;
    if (isJson(res)) {
        try { json = await res.clone().json(); } catch {}
    }
    // se a API sinalizar "aceite os termos", normalize como 428
    const msg = (json?.message ?? "").toString().toLowerCase();
    if (msg.includes("must accept the latest terms and conditions")) {
        return NextResponse.json(
            { terms_required: true, message: json?.message ?? "Terms required" },
            { status: 428 } // Precondition Required
        );
    }
    // caso normal: apenas repassar status e body originais
    const body = json ?? (await res.text());
    return NextResponse.json(body, { status: res.status });
}
