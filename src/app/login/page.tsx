// src/app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import logo from "@/assets/img/logo.png";

import {
    Card,
    Form,
    Button,
    Alert,
    Spinner,
    FloatingLabel,
} from "react-bootstrap";

type Step = "lookup" | "password" | "done";

export default function LoginPage() {
    const router = useRouter();

    const [step, setStep] = useState<Step>("lookup");
    const [identifier, setIdentifier] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [loadingLookup, setLoadingLookup] = useState(false);
    const [processingLogin, setProcessingLogin] = useState(false);
    const [passwordData, setPasswordData] = useState({
        identifier: "",
        password: "",
        remember: true,
    });

    async function handleLookup(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setLoadingLookup(true);
        try {
            const resp = await fetch("/api/auth/lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: identifier.trim() }),
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.status === 404 || !resp.ok || data?.ok === false) {
                setMsg(data?.message || "Usuário não encontrado.");
                return;
            }
            const firstLogin = Boolean(data?.data?.firstLogin);
            if (firstLogin) {
                setMsg(
                    data?.message ||
                    "Enviamos um e-mail com o link para criar sua senha. Verifique sua caixa de entrada."
                );
                setStep("done");
                return;
            }
            setPasswordData((s) => ({ ...s, identifier: identifier.trim() }));
            setStep("password");
        } catch {
            setMsg("Houve um erro. Tente novamente.");
        } finally {
            setLoadingLookup(false);
        }
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setProcessingLogin(true);
        try {
            const resp = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identifier: passwordData.identifier,
                    password: passwordData.password,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                if (resp.status === 401) {
                    const m =
                        data?.errors?.message?.[0] ||
                        data?.message ||
                        "Credenciais inválidas.";
                    setMsg(m);
                } else if (resp.status === 412) {
                    setMsg(data?.message || "E-mail não verificado.");
                } else {
                    setMsg(data?.message || "Não foi possível autenticar.");
                }
                return;
            }
            // login ok → tokens nos cookies → deixa o fluxo seguir (terms guard cuida)
            router.replace("/home");
        } catch {
            setMsg("Houve um erro. Tente novamente.");
        } finally {
            setProcessingLogin(false);
        }
    }

    return (
        <div className={styles.authShell}>
            <main className={styles.authMain}>
                <Card className="shadow-sm border-0">
                    <Card.Body className="p-4 p-sm-5">
                        {/* Brand */}
                        <div className="text-center mb-3">
                            <img src={logo.src} alt="Grupo Contem" className={styles.brandImg} />

                            <br />
                            <small className="text-body-secondary">Acesso seguro</small>
                        </div>

                        {/* Mensagens */}
                        {msg && (
                            <Alert variant={step === "done" ? "success" : "danger"} className="mb-3">
                                {msg}
                            </Alert>
                        )}

                        {/* PASSO 1 — LOOKUP */}
                        {step === "lookup" && (
                            <Form onSubmit={handleLookup} noValidate>
                                <FloatingLabel controlId="identifier" label="Login ou CPF" className="mb-3">
                                    <Form.Control
                                        type="text"
                                        placeholder="NORMA ou 739.583.017-20"
                                        value={identifier}
                                        autoFocus
                                        autoComplete="username"
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                    />
                                </FloatingLabel>

                                <Button
                                    type="submit"
                                    className="w-100 py-2"
                                    disabled={loadingLookup || identifier.trim() === ""}
                                >
                                    {loadingLookup && (
                                        <Spinner animation="border" size="sm" className="me-2" />
                                    )}
                                    Continuar
                                </Button>

                                <p className="mt-3 mb-0 text-center text-body-secondary small">
                                    Digite seu <strong>login</strong> ou seu <strong>CPF</strong> e clique em Continuar.
                                </p>
                            </Form>
                        )}

                        {/* PASSO 2 — PASSWORD */}
                        {step === "password" && (
                            <Form onSubmit={handleLogin} noValidate>
                                <FloatingLabel controlId="identifierReadonly" label="Login/CPF" className="mb-3">
                                    <Form.Control
                                        type="text"
                                        value={passwordData.identifier}
                                        readOnly
                                        plaintext
                                    />
                                </FloatingLabel>

                                <FloatingLabel controlId="password" label="Senha" className="mb-3">
                                    <Form.Control
                                        type="password"
                                        placeholder="Senha"
                                        value={passwordData.password}
                                        onChange={(e) =>
                                            setPasswordData((s) => ({ ...s, password: e.target.value }))
                                        }
                                        required
                                        autoComplete="current-password"
                                    />
                                </FloatingLabel>

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="remember"
                                        label="Lembrar-me"
                                        checked={passwordData.remember}
                                        onChange={(e) =>
                                            setPasswordData((s) => ({ ...s, remember: e.target.checked }))
                                        }
                                    />
                                    <a href="/forgot-password" className="small">
                                        Esqueci minha senha
                                    </a>
                                </div>

                                <Button type="submit" className="w-100 py-2" disabled={processingLogin}>
                                    {processingLogin && (
                                        <Spinner animation="border" size="sm" className="me-2" />
                                    )}
                                    Entrar
                                </Button>

                                <Button
                                    variant="link"
                                    className="w-100 mt-2 text-decoration-none"
                                    type="button"
                                    onClick={() => {
                                        setStep("lookup");
                                        setMsg(null);
                                        setPasswordData((s) => ({ ...s, password: "" }));
                                    }}
                                >
                                    Voltar
                                </Button>
                            </Form>
                        )}

                        {/* PASSO 3 — DONE */}
                        {step === "done" && (
                            <>
                                <FloatingLabel controlId="identifierDone" label="Login/CPF" className="mb-3">
                                    <Form.Control type="text" value={identifier} readOnly plaintext />
                                </FloatingLabel>

                                <Button
                                    variant="outline-primary"
                                    className="w-100"
                                    type="button"
                                    onClick={() => {
                                        setMsg(null);
                                        setStep("lookup");
                                    }}
                                >
                                    Fazer outra verificação
                                </Button>
                            </>
                        )}

                        <p className="mt-4 mb-0 text-center text-body-secondary small">
                            © {new Date().getFullYear()} — Grupo Contem
                        </p>
                    </Card.Body>
                </Card>
            </main>
        </div>
    );
}
