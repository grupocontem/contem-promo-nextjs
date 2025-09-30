// src/lib/backend.ts
import { cookies } from "next/headers";
import { ACCESS, REFRESH, setAuthCookies, clearAuthCookies } from "./auth-cookies";

const BASE = process.env.BACKEND_BASE ?? "http://localhost:8081";
// Permite customizar o caminho real do refresh se sua API não for /api/refresh-token
const REFRESH_PATH = process.env.REFRESH_PATH ?? "/api/refresh";

type AnyJson = Record<string, any> | null;

function nowSec() { return Math.floor(Date.now() / 1000); }

// Decodifica o payload do JWT (sem validar assinatura) para checar exp
function decodeJwtExp(token?: string): number | null {
    try {
        if (!token) return null;
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        return typeof payload?.exp === "number" ? payload.exp : null;
    } catch {
        return null;
    }
}

function bodyIndicaExpirado(json: AnyJson): boolean {
    if (!json || typeof json !== "object") return false;

    // sinais comuns
    const okFlag = typeof json.ok === "boolean" ? json.ok : undefined;
    const statusStr = typeof json.status === "string" ? json.status.toLowerCase() : "";
    const message = (json.message ?? json.error ?? json.detail ?? "").toString().toLowerCase();

    // exemplos: {status:"error", message:"Token has expired"}
    if (statusStr === "error" && message.includes("token") && message.includes("expire")) return true;

    // variações frequentes
    if (message.includes("token") && (message.includes("expire") || message.includes("expirado"))) return true;
    if (message.includes("unauthenticated") || message.includes("não autenticado")) return true;
    if (message.includes("invalid token") || message.includes("invalid signature")) return true;

    // alguns backends mandam ok:false
    if (okFlag === false && (message.includes("token") || message.includes("sess"))) return true;

    return false;
}

// src/lib/backend.ts (adicione estas funções no arquivo)
function bodyIndicaTermsNaoAceitos(json: any): boolean {
    if (!json || typeof json !== "object") return false;
    const msg = (json.message ?? "").toString().toLowerCase();
    // mensagem que você definiu
    return msg.includes("must accept the latest terms and conditions");
}

export function isJson(res: Response) {
    return (res.headers.get("content-type") || "").includes("application/json");
}

async function refreshTokens(): Promise<boolean> {
    const jar = await cookies();
    const rt = jar.get(REFRESH)?.value;

    if (!rt) {
        console.log("[AUTH] Nenhum refresh token encontrado.");
        return false;
    }

    console.log(`[AUTH] >> POST ${REFRESH_PATH} (tentando renovar)`);
    const res = await fetch(`${BASE}${REFRESH_PATH.startsWith("/") ? "" : "/"}${REFRESH_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
        cache: "no-store",
    });

    console.log("[AUTH] << refresh status:", res.status);

    if (res.status === 403) {
        console.log("[AUTH] Refresh 403 (expirado) → logout.");
        return false;
    }
    if (!res.ok) {
        console.log("[AUTH] Refresh falhou:", await res.text());
        return false;
    }

    const json = (await res.json().catch(() => null)) as AnyJson;

    const at = json?.access_token as string | undefined;
    const newRt = (json?.refresh_token as string | undefined) ?? rt;
    const ttl = (json?.expires_in as number | undefined) ?? 900;

    if (!at) {
        console.log("[AUTH] Resposta de refresh sem access_token.");
        return false;
    }

    await setAuthCookies(at, newRt, ttl);
    console.log("[AUTH] Tokens renovados com sucesso.");
    return true;
}

export async function backend(
    path: string,
    init?: RequestInit & { retrying?: boolean; _skipPre?: boolean }
): Promise<Response> {
    const jar = await cookies();
    const at = jar.get(ACCESS)?.value;

    // 0) Refresh PROATIVO (opcional): se for server-side e token expira em < 10s, renove antes
    if (!init?._skipPre && at) {
        const exp = decodeJwtExp(at);
        if (exp && exp - nowSec() <= 10) {
            console.log("[AUTH] Access prestes a expirar (<=10s) → refresh proativo.");
            const ok = await refreshTokens();
            if (!ok) await clearAuthCookies();
            // evita loop infinito de pre-check
            return backend(path, { ...init, _skipPre: true });
        }
    }

    const url = path.startsWith("http") ? path : `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
    console.log(`[HTTP] >> ${init?.method ?? "GET"} ${url}`);

    const res1 = await fetch(url, {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            ...(at ? { Authorization: `Bearer ${at}` } : {}),
            "X-From": "next-proxy",
        },
        cache: "no-store",
    });

    console.log("[HTTP] << status:", res1.status, "for", url);

    // 1) HTTP status triggers
    if ((res1.status === 401 || res1.status === 419) && !init?.retrying) {
        console.log("[AUTH] Status 401/419 → tentar refresh...");
        const ok = await refreshTokens();
        if (!ok) {
            await clearAuthCookies();
            return res1;
        }
        return backend(path, { ...init, retrying: true });
    }

    // 2) Body triggers (200 com erro de sessão/expiração)
    let shouldRetry = false;
    if (res1.headers.get("content-type")?.includes("application/json")) {
        try {
            const clone = res1.clone();
            const json = (await clone.json().catch(() => null)) as AnyJson;
            if (bodyIndicaExpirado(json) && !init?.retrying) {
                console.log("[AUTH] Body indica expiração → tentar refresh...");
                const ok = await refreshTokens();
                if (!ok) {
                    await clearAuthCookies();
                    return res1;
                }
                shouldRetry = true;
            }
        } catch {
            // ignore parse
        }
    }

    if (shouldRetry) {
        return backend(path, { ...init, retrying: true });
    }

    return res1;
}
