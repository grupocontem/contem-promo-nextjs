// src/app/terms/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TermsPage() {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const router = useRouter();

    async function load() {
        setLoading(true);
        setErr(null);
        const res = await fetch("/api/term");
        if (res.status === 401) return router.replace("/login");
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.status === "error") {
            setErr(json?.message ?? "Erro ao carregar os termos.");
        } else {
            setContent(json?.data?.content ?? "# Termos indisponíveis");
        }
        setLoading(false);
    }

    async function accept() {
        setErr(null);
        setSubmitting(true);
        const res = await fetch("/api/terms/accept", { method: "POST" });
        const json = await res.json().catch(() => ({}));
        setSubmitting(false);

        if (res.status === 401 || res.status === 403) return (location.href = "/login");
        if (!res.ok) {
            setErr(json?.message ?? "Não foi possível aceitar os termos.");
            return;
        }
        router.replace("/");
    }

    useEffect(() => { load(); }, []);

    return (
        <main className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Termos e Condições de Uso</h1>

            {err && (
                <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
                    {err}
                    <button className="ml-3 underline" onClick={load} type="button">Tentar novamente</button>
                </div>
            )}

            {loading ? (
                <div className="animate-pulse rounded border p-4 text-gray-500">Carregando…</div>
            ) : (
                <article className="prose max-w-none border rounded p-4 max-h-[60vh] overflow-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </article>
            )}

            <div className="sticky bottom-0 mt-4 flex gap-3 bg-white/80 py-3 backdrop-blur">
                <button
                    className="border rounded px-4 py-2 disabled:opacity-60"
                    onClick={accept}
                    disabled={loading || submitting}
                >
                    {submitting ? "Salvando…" : "Li e Aceito"}
                </button>

                <button
                    className="border rounded px-4 py-2"
                    onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        location.href = "/login";
                    }}
                    type="button"
                >
                    Sair
                </button>
            </div>

            <p className="mt-2 text-sm text-gray-500">
                Você já está autenticado. O aceite é feito com seu token atual.
            </p>
        </main>
    );
}
