"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Container, Row, Col, Card, Form, Button, Pagination, Spinner, Alert, Badge,
} from "react-bootstrap";

// ===== Tipos =====
type Direction = "asc" | "desc";
type OrderState = { column: string; direction: Direction };
type MetaState  = { current: number; last: number; total: number };

type Premio = {
    nome: string;
    pontos: number;
    imagem: string;
    status: boolean;
};

type ApiResponse = {
    status: "success" | "error";
    ok: boolean;
    message?: string;
    data?: {
        items: Premio[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        next_page_url?: string | null;
        prev_page_url?: string | null;
    };
};

// ===== Constantes =====
const DEFAULT_ORDER: OrderState = { column: "pontos", direction: "asc" };
const DEFAULT_PER_PAGE = 12;

// Build helper: monta uma janela de paginação centrada na página atual
function buildWindow(current: number, last: number, size = 5): number[] {
    if (last <= 0) return [1];
    const half = Math.floor(size / 2);
    const start = Math.max(1, Math.min(current - half, last - size + 1));
    const end = Math.min(last, start + size - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function PremiosPage() {
    const router = useRouter();

    // ===== Estado =====
    const [order, setOrder] = useState<OrderState>(DEFAULT_ORDER);
    const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
    const [page, setPage] = useState<number>(1);

    const [items, setItems] = useState<Premio[]>([]);
    const [meta, setMeta]   = useState<MetaState>({ current: 1, last: 1, total: 0 });

    const [loadingPrizes, setLoadingPrizes] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // ===== Querystring baseada no estado (ordem/páginação) =====
    const query = useMemo(() => {
        const q = new URLSearchParams();
        q.set("order_by[column]", order.column);
        q.set("order_by[direction]", order.direction);
        q.set("per_page", String(perPage));
        q.set("page", String(page));
        return q.toString();
    }, [order, perPage, page]);

    // ===== Carregar dados =====
    async function load() {
        setLoadingPrizes(true);
        setErrorMsg(null);
        try {
            const res = await fetch(`/api/prizes?${query}`, { cache: "no-store" });

            // se sua app precisa de guardas:
            if (res.status === 401) return router.replace("/login");
            if (res.status === 428) return router.replace("/terms");

            const json: ApiResponse = await res.json();
            if (!res.ok || json.status === "error" || !json.data) {
                setErrorMsg(json?.message || "Não foi possível carregar os prêmios.");
                setItems([]);
                setMeta({ current: 1, last: 1, total: 0 });
                return;
            }

            setItems(json.data.items ?? []);
            setMeta({
                current: json.data.current_page,
                last: json.data.last_page,
                total: json.data.total,
            });
        } catch {
            setErrorMsg("Falha de rede ao carregar prêmios.");
            setItems([]);
            setMeta({ current: 1, last: 1, total: 0 });
        } finally {
            setLoadingPrizes(false);
        }
    }

    // Sync URL → estado (rodar uma vez ao montar)
    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        const c = (sp.get("order_by[column]") ?? DEFAULT_ORDER.column) as string;
        const d = (sp.get("order_by[direction]") as Direction) ?? DEFAULT_ORDER.direction;
        const pp = Number(sp.get("per_page") ?? DEFAULT_PER_PAGE);
        const pg = Number(sp.get("page") ?? 1);

        setOrder({ column: c, direction: d });
        setPerPage(Number.isFinite(pp) && pp > 0 ? pp : DEFAULT_PER_PAGE);
        setPage(Number.isFinite(pg) && pg > 0 ? pg : 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync estado → URL (para compartilhar)
    useEffect(() => {
        const nextQs = `?${query}`;
        if (nextQs !== window.location.search) {
            window.history.replaceState(null, "", `/premios${nextQs}`);
        }
    }, [query]);

    // Recarrega quando a query muda
    useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [query]);

    // ===== Render =====
    return (
        <Container className="py-4">
            <Row className="mb-3 align-items-end">
                <Col xs={12} md={6}>
                    <h3 className="mb-2">Prêmios</h3>
                    <div className="text-muted small">{meta.total} itens</div>
                </Col>
                <Col xs={12} md="auto" className="ms-auto">
                    <Form className="d-flex gap-2">
                        <Form.Select
                            aria-label="Ordenação"
                            value={`${order.column}:${order.direction}`}
                            onChange={(e) => {
                                const [column, direction] = e.target.value.split(":");
                                setPage(1);
                                setOrder({ column, direction: direction as Direction });
                            }}
                        >
                            <option value="pontos:asc">Pontos (menor → maior)</option>
                            <option value="pontos:desc">Pontos (maior → menor)</option>
                            <option value="nome:asc">Nome (A → Z)</option>
                            <option value="nome:desc">Nome (Z → A)</option>
                        </Form.Select>

                        <Form.Select
                            aria-label="Itens por página"
                            value={perPage}
                            onChange={(e) => { setPage(1); setPerPage(Number(e.target.value)); }}
                        >
                            {[6, 12, 24, 48].map((n) => (
                                <option key={n} value={n}>{n}/página</option>
                            ))}
                        </Form.Select>
                    </Form>
                </Col>
            </Row>

            {errorMsg && <Alert variant="danger" className="mb-3">{errorMsg}</Alert>}

            {loadingPrizes ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : (
                <>
                    <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                        {items.map((p, idx) => (
                            <Col key={`${p.nome}-${idx}`}>
                                <Card className="h-100 shadow-sm">
                                    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3" }}>
                                        <Image
                                            src={p.imagem}
                                            alt={p.nome}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 25vw"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="mb-1">{p.nome}</Card.Title>
                                        <div className="mb-2">
                                            <Badge bg="warning" text="dark">{p.pontos} pontos</Badge>
                                        </div>
                                        <div className="mt-auto d-flex gap-2">
                                            <Button variant="primary" size="sm">Detalhes</Button>
                                            <Button variant="outline-primary" size="sm" disabled={!p.status}>
                                                {p.status ? "Resgatar" : "Indisponível"}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* paginação */}
                    <Row className="mt-4">
                        <Col className="d-flex justify-content-center">
                            <Pagination>
                                <Pagination.First disabled={page <= 1} onClick={() => setPage(1)} />
                                <Pagination.Prev  disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                                {buildWindow(page, meta.last, 5).map((n) => (
                                    <Pagination.Item key={n} active={n === page} onClick={() => setPage(n)}>
                                        {n}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next disabled={page >= meta.last} onClick={() => setPage((p) => Math.min(meta.last, p + 1))} />
                                <Pagination.Last disabled={page >= meta.last} onClick={() => setPage(meta.last)} />
                            </Pagination>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
}
