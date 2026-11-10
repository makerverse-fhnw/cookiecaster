import {useCallback} from "react";
import {FormattedMessage} from "react-intl";
import {Link} from "react-router-dom";
import {Navbar, Nav, NavDropdown, Image, Container} from "react-bootstrap";
import "./CustomNavbar.css";

export default function CustomNavbar() {
    // Handle language change
    const handleSelect = useCallback((eventKey) => {
        let locale;
        switch (eventKey) {
            case "de":
                locale = "de";
                break;
            case "en":
                locale = "en";
                break;
            default:
                locale = "de";
        }
        window.localStorage.setItem("locale", locale);
        window.location.reload();
    }, []);

    return (<Navbar
        collapseOnSelect
        expand="lg"
        sticky="top"
        className="custom-navbar">
        <Container fluid className="px-3">
            {/* Brand */}
            <Navbar.Brand
                as={Link}
                to="/"
                className="d-flex align-items-center gap-3 me-auto"
            >
                <span className="fhnw-logo-safezone d-none d-sm-inline">
                    <Image
                    className="fhnw-logo"
                    src={`${import.meta.env.BASE_URL}assets/FHNW.svg`}
                    alt="FHNW Logo"
                />
                </span>

                <span>CookieCaster 3.0</span>
            </Navbar.Brand>

            {/* Mobile Toggle */}
            <Navbar.Toggle aria-controls="responsive-navbar-nav"/>

            {/* Nav Links */}
            <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="ms-auto">
                    <Nav.Link as={Link} to="/">
                        Home
                    </Nav.Link>

                    <Nav.Link as={Link} to="/start">
                        <FormattedMessage id="customNavbar.draw" defaultMessage="Draw" />
                    </Nav.Link>

                    <Nav.Link as={Link} to="/gallery">
                        <FormattedMessage id="customNavbar.gallery" defaultMessage="Gallery"/>
                    </Nav.Link>

                    {/* Language Dropdown */}
                    <NavDropdown
                        title={<span><i className="fa-solid fa-globe"></i></span>}
                        id="basic-nav-dropdown"
                        align="end"
                        onSelect={handleSelect}>
                        <NavDropdown.Item eventKey="de">Deutsch</NavDropdown.Item>
                        <NavDropdown.Item eventKey="en">English</NavDropdown.Item>
                    </NavDropdown>

                    <Nav.Link as={Link} to="/ueber">
                        <i className="fa-solid fa-question"></i>
                    </Nav.Link>

                    <Nav.Link
                        as="a"
                        href="https://github.com/makerverse-fhnw/cookiecaster"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub repository"
                        className="d-flex align-items-center"
                        >
                        <img src={`${import.meta.env.BASE_URL}/assets/github.svg`} alt="" width={20} height={20} />
                    </Nav.Link>

                    <Nav.Link as={Link} to="/about">
                        <FormattedMessage id="customNavbar.about" defaultMessage="Imprint"/>
                    </Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Container>
    </Navbar>);
}