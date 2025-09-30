import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://localhost:8081";
const ACCESS = "gc.access";
const REFRESH = "gc.refresh";

export async function POST(_req: NextRequest) {
    const jar = await cookies();

    // 1) SEMPRE limpar localmente (logout efetivo)
    jar.delete(ACCESS);
    jar.delete(REFRESH);

    // 2) Opcional: tentar notificar o backend, mas ignorar resultado
    const access = _req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
        || jar.get(ACCESS)?.value; // se ainda existir por algum motivo

    try {
        await fetch(`${BACKEND_BASE}/api/logout`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                ...(access ? { Authorization: `Bearer ${access}` } : {}),
            },
            cache: "no-store",
        });
    } catch {
        // ignorar qualquer erro do backend/rede
    }

    // 3) Sempre responder sucesso
    return NextResponse.json({ ok: true, message: "Logged out locally" }, { status: 200 });
}
