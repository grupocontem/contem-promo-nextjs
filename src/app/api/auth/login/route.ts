// src/app/api/auth/login/route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { setAuthCookies, clearAuthCookies, setAcceptedTermsCookie } from "@/lib/auth-cookies";

export async function POST(req: Request) {
    const { identifier, password } = await req.json().catch(() => ({}));
    if (!identifier || !password) {
        return NextResponse.json({ message: "Campos obrigatórios." }, { status: 400 });
    }

    const res = await backend(`/api/login?identifier=${encodeURIComponent(identifier)}&password=${encodeURIComponent(password)}`, {
        method: "POST",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        await clearAuthCookies();
        return NextResponse.json(json, { status: res.status });
    }

    // Resposta 200 conforme seu exemplo:
    // { token_type, access_token, expires_in, refresh_token, user: { email_verified: boolean, ... } }
    if (!json?.user?.email_verified) {
        await clearAuthCookies();
        return NextResponse.json(
            { message: "E-mail não verificado. Verifique seu e-mail para continuar." },
            { status: 412 } // Precondition Failed
        );
    }

    await setAuthCookies(json.access_token, json.refresh_token, json.expires_in ?? 900);

    const accepted = Boolean(json?.user?.terms_accepted);
    await setAcceptedTermsCookie(accepted);

    return NextResponse.json({ ok: true, user: json.user });
}
