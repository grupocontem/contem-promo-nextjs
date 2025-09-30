// src/app/api/terms/accept/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { cookies } from "next/headers";

// Se seu backend ainda exige `identifier=` na query,
// vamos tentar pegar de um cookie opcional gravado no login.
// (Se o backend já aceitar só o Bearer, nem precisa.)
const IDENT_COOKIE = "gc.identifier";

export async function POST() {
    // tenta ler identifier salvo (opcional)
    const id = (await cookies()).get(IDENT_COOKIE)?.value;

    // 1) caminho ideal: backend aceita só o Bearer (sem query)
    let res = await backend(`/api/accept/terms`, { method: "POST" });

    // 2) fallback: se o backend retornar 400 por faltar identifier,
    // tentamos novamente com ?identifier=...
    if (res.status === 400 && id) {
        res = await backend(`/api/accept/terms?identifier=${encodeURIComponent(id)}`, {
            method: "POST",
        });
    }

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
        return NextResponse.json(typeof body === "string" ? { message: body } : body, { status: res.status });
    }

    return NextResponse.json(typeof body === "string" ? { message: body } : body, { status: 200 });
}
