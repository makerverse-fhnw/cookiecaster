import { FormattedMessage } from 'react-intl';
import { Container, Row, Col, Card } from 'react-bootstrap';

const ErrorPage = () => {
    return (
        <Container className="py-5">
            <Card className="p-4 shadow-sm">
                <Row>
                    <Col xs={12} sm={8} className="main-section">
                        <h1>404 ERROR</h1>
                        <h3>
                            <FormattedMessage id="error.404" />
                        </h3>
                    </Col>
                </Row>
            </Card>
        </Container>
    );
};

export default ErrorPage;