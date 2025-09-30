// src/lib/auth-cookies.ts
//"use server";

import { cookies } from "next/headers";

export const ACCESS = "gc.access";
export const REFRESH = "gc.refresh";
export const ACCEPTED = "gc.accepted"; // flag local até o backend responder

export async function setAuthCookies(access: string, refresh: string, expiresInSec: number) {
    const jar = await cookies();
    const maxAge = Math.max(1, expiresInSec); // segundos

    jar.set(ACCESS, access, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge });
    // refresh dura mais tempo (a API define exp dele; se quiser, ajuste um valor alto)
    jar.set(REFRESH, refresh, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
}

export async function clearAuthCookies() {
    const jar = await cookies();
    jar.delete(ACCESS);
    jar.delete(REFRESH);
    jar.delete(ACCEPTED);
}

export async function setAcceptedTermsCookie(val: boolean) {
    const jar = await cookies();
    if (val) jar.set(ACCEPTED, "1", { path: "/", sameSite: "lax" });
    else jar.delete(ACCEPTED);
}
