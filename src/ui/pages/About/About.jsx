import { FormattedMessage } from "react-intl";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import GitHubReference from "../../components/GitHubReference.jsx";



const About = () => {
    return (
        <Container className="py-5">
            <div className="p-5 rounded-3">
                <Row className="justify-content-center">
                    <Col xs={12} lg={8}>
                        
                        {/* Title */}
                        <h2 className="mb-4">
                            <FormattedMessage id="ueber.title" />
                        </h2>

                        {/* Text */}
                        <p className="mb-4 fs-5">
                            <FormattedMessage id="ueber.text1" />
                            <br /><br />
                            <FormattedMessage id="ueber.text2" />
                            <br /><br />
                            <FormattedMessage id="ueber.text3" />
                            <br /><br />
                            <FormattedMessage id="ueber.text4" />
                        </p>

                        {/* Video */}
                        <div className="mb-4">
                            <video
                                className="w-100 rounded"
                                controls
                            >
                                <source
                                    src="/cookiecaster/assets/Tutorial_Cookiecaster3.mp4"
                                    type="video/mp4"
                                />
                                Your browser does not support the video tag.
                            </video>
                        </div>

                        {/* GitHub */}
                        <div className="mb-4">
                            <GitHubReference />
                        </div>
                    

                        {/* Back Button */}
                        <Link to="/start">
                            <Button variant="primary" size="lg">
                                <FormattedMessage id="export.backButton" />
                            </Button>
                        </Link>

                    </Col>
                </Row>
            </div>
        </Container>
    );
};

export default About;
