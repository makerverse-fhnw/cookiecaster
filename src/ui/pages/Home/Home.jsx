import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import { Container, Row, Col, Image, Button } from "react-bootstrap";
import GitHubReference from "../../components/GitHubReference.jsx";


export default function Home() {
    return (
        <Container className="mt-5">
            { /* DESKTOP/TABLET VERSION */ }
            <div className="p-5 rounded">
                {/* Welcome section */}
                <Row>
                    <Col md={8} className="mb-4 mb-md-0">
                        <h1>
                            <FormattedMessage
                                id="home.welcome"
                                defaultMessage="Welcome to CookieCaster!"
                            />
                        </h1>

                        {/* Help text */}
                        <p className="fs-5">
                            <FormattedMessage
                                id="home.needHelp"
                                defaultMessage="Need help? Check the Imprint or FAQ section."
                            />
                        </p>

                        <p className="fs-5">
                            <FormattedMessage
                                id="home.start"
                                defaultMessage="Get started by designing your cookie cutter."
                            />
                        </p>
                        <Button as={Link} to="/start" size="lg" variant="primary">
                                <FormattedMessage
                                    id="home.startButton"
                                    defaultMessage="Start Drawing"
                                />
                        </Button>
                    </Col>

                    {/* Right image */}
                    <Col md={4} className="text-center">
                        <Image
                            src={`${import.meta.env.BASE_URL}assets/Pfote.png`}
                            alt="CookieCaster Paw Logo"
                            fluid
                        />
                    </Col>
                </Row>

                {/* GitHub contribution call-to-action */}
                <Row className="mt-4">
                    <Col md={8}>
                        <GitHubReference />
                    </Col>
                </Row>
            </div>
        </Container>
    );
}
