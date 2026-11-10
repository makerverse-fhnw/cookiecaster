import { Container, Row, Col } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';


const Imprint = () => {
    const company = "Fachhochschule Nordwestschweiz FHNW";
    const address = "Bahnhofstrasse 6";
    const city = "5210 Windisch";
    const email = "makerverse.windisch@fhnw.ch";

    return (
        <Container className="py-5">
            <div className="p-5 mb-4 rounded-3 fs-4">

                <Row>
                    <Col xs={12} sm={8} className="main-section">
                        <h2>
                            <FormattedMessage id="about.title" />
                        </h2>
                    </Col>
                </Row>

                <Row className="mt-3">
                    <Col xs={12} sm={4} className="main-section">
                        <p><FormattedMessage id="about.company" /></p>
                    </Col>
                    <Col xs={12} sm={8} className="main-section">
                        <p>{company}</p>
                    </Col>
                </Row>

                <Row>
                    <Col xs={12} sm={4} className="main-section">
                        <p><FormattedMessage id="about.address" /></p>
                    </Col>
                    <Col xs={12} sm={8} className="main-section">
                        <p>{address}</p>
                    </Col>
                </Row>

                <Row>
                    <Col xs={12} sm={4} className="main-section">
                        <p><FormattedMessage id="about.city" /></p>
                    </Col>
                    <Col xs={12} sm={8} className="main-section">
                        <p>{city}</p>
                    </Col>
                </Row>

                <Row>
                    <Col xs={12} sm={4} className="main-section">
                        <p><FormattedMessage id="about.email" /></p>
                    </Col>
                    <Col xs={12} sm={8} className="main-section">
                        <p>{email}</p>
                    </Col>
                </Row>

            </div>
        </Container>
    );
};

export default Imprint;