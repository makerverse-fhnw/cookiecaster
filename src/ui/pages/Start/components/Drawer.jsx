import { Offcanvas } from "react-bootstrap";
import { FormattedMessage } from "react-intl";
import ControlActions from "./ControlActions.jsx";

export default function Drawer({ showDrawer, setShowSidebar, position, onAnalyze, onSave, onExportToFile }) {
    return (
        <div>
            <Offcanvas
                show={showDrawer}
                onHide={() => setShowSidebar(false)}
                placement={position}
                className="control-drawer"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        <FormattedMessage id="start.controlSidebarTitle" />
                    </Offcanvas.Title>
                </Offcanvas.Header>

                <Offcanvas.Body>
                    <ControlActions
                        variant="drawer"
                        onAnalyze={onAnalyze}
                        onSave={onSave}
                        onExportToFile={onExportToFile}
                        closeDrawer={setShowSidebar}
                    />
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
}