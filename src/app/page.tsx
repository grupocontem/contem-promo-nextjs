"use client";

import Image from "next/image";
import Link from "next/link";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import styles from "./landing.module.css";

export default function Landing() {
    return (
        <div className={styles.shell}>
            <Container className="py-4">
                <div className="d-flex justify-content-end mb-3">
                    <Link href="/login">
                        <Button as="span" variant="light" size="sm">Entrar</Button>
                    </Link>
                </div>

                <Row className="justify-content-center text-center">
                    <Col md={8}>
                        <div className="mb-3">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={200}
                                height={60}
                                style={{ height: 60, width: "auto" }}
                            />
                        </div>

                        <h1 className="fw-bold text-white">Programa de Pontos</h1>
                        <p className="text-white-50">
                            Junte pontos com suas vendas e troque por prêmios incríveis.
                        </p>

                        <div className="d-flex gap-2 justify-content-center mt-2">
                            <Link href="/login">
                                <Button as="span" size="lg" variant="light">Entrar</Button>
                            </Link>

                            <Link href="/premios">
                                <Button as="span" size="lg" variant="outline-light">Ver prêmios</Button>
                            </Link>
                        </div>
                    </Col>
                </Row>

                <Row className="justify-content-center mt-5">
                    <Col md={8}>
                        <Card className={`${styles.card} shadow-sm border-0`}>
                            <Card.Body className="p-4">
                                <h5 className="fw-bold mb-2">Como funciona?</h5>
                                <p className="mb-0">
                                    Faça suas vendas, acumule pontos e troque por prêmios. Para acompanhar seu saldo,{" "}
                                    <Link href="/login">entre na sua conta</Link>.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
