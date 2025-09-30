"use client";

import Image from "next/image";
import styles from "./home.module.css";
import {Container, Row, Col, Button, Card, Table, Badge} from "react-bootstrap";
import {redirect} from "next/navigation";
import logo from "@/assets/img/logo.png";
import Link from "next/link";

const USER_NAME = "MATHEUS SOARES";
const TOTAL_POINTS = 1000;
const POINTS_TABLE = [
    { label: "1 vida Assim", value: 10 },
    { label: "1 vida Hapvida", value: 10 },
    { label: "1 vida Healthmed", value: 5 },
    { label: "1 vida HSMed", value: 5 },
    { label: "1 vida Nova Saúde", value: 10 },
    { label: "1 vida Unimed Costa Verde", value: 10 },
    { label: "1 vida Unimed Nova Iguaçu", value: 10 },
];

export default function HomePage() {
    return (
        <div className={styles.shell}>
            <Container className="py-4">
                <Row className="justify-content-center text-center">
                    <Col md={7}>
                        <div className="mb-3">
                            {/* coloque seu logo em /public/logo.png (ou troque o src) */}
                            <Image src={logo} alt="Logo" width={200} height={60} style={{ height: 60, width: "auto" }} />
                        </div>

                        <p className={`${styles.greeting} mb-1`}>Olá {USER_NAME}!</p>
                        <p className={`${styles.subtitle} mb-2`}>Seu total de pontos é:</p>
                        <div className={styles.bigPoints}>{TOTAL_POINTS}</div>

                        <Button size="lg" className={`${styles.cta} mt-2`} onClick={() => { redirect('/premios') }}>
                            Resgatar prêmio!
                        </Button>
                    </Col>
                </Row>

                {/* tabela de pontos */}
                <Row className="justify-content-center mt-5">
                    <Col lg={7}>
                        <Card className={`${styles.card} shadow-sm border-0`}>
                            <Card.Body className="p-4">
                                <h5 className="fw-bold mb-3 text-center">Tabela de pontos</h5>
                                <Table responsive borderless className={styles.pointsTable}>
                                    <tbody>
                                    {POINTS_TABLE.map((r, i) => (
                                        <tr key={i} className={styles.pointsRow}>
                                            <td className="py-2"><span className="fw-semibold">{r.label}</span></td>
                                            <td className="text-end py-2">
                                                <Badge bg="" className={styles.badgePill}>{r.value} pontos</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>

                                <div className="mt-3">
                                    <div className={styles.ribbon}>Estes pontos serão utilizados para a troca de prêmios</div>
                                    <div className={styles.ribbonAlt}>Cada prêmio terá uma pontuação estipulada para a troca</div>
                                    <p className={`${styles.disclaimer} mt-2 mb-0`}>
                                        * Texto meramente ilustrativo para demonstração de layout.
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* chamada secundária */}
                <Row className="justify-content-center mt-5">
                    <Col lg={8} className="text-center">
                        <h4 className={`${styles.sectionTitle} mb-1`}>Concentre suas vendas</h4>
                        <h5 className={`${styles.sectionSubtitle} mb-4`}>Junte pontos e ganhe prêmios!</h5>
                        <small className="text-light-50">*Imagens meramente ilustrativas.</small>
                    </Col>
                </Row>

                {/* vitrine ilustrativa */}
                <Row className="justify-content-center mt-4">
                    <Col lg={10} className="text-center">
                        {/* coloque uma imagem em /public/premios.png ou remova */}
                        <Image src="/premios.png" alt="Prêmios" width={1200} height={450} style={{ width: "100%", height: "auto" }} />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
