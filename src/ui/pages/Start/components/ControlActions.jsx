// src/ui/pages/Start/components/ControlActions.jsx
import React from "react";
import {Link} from "react-router-dom";
import {FormattedMessage} from "react-intl";
import SidebarButtonWithTooltip from "./SidebarButtonWithTooltip";
import DrawerItem from "./DrawerItem";

export default function ControlActions({
                                           variant,              // "sidebar" | "drawer"
                                           onAnalyze,
                                           onSave,
                                           onExportToFile,
                                           closeDrawer,
                                       }) {
    const isDrawer = variant === "drawer";

    if (isDrawer) {
        return (
            <>
                <DrawerItem closeDrawer={closeDrawer} to="/gallery">
                    <i className="fas fa-upload"></i>{" "}
                    <FormattedMessage id="start.loadFromGallery"/>
                </DrawerItem>

                <DrawerItem id="saveDrawer" className="js-save" onButtonClick={onSave}>
                    <i className="far fa-save"></i>{" "}
                    <FormattedMessage id="start.save"/>
                </DrawerItem>

                <DrawerItem onButtonClick={onExportToFile}>
                    <i className="fas fa-file-export"></i>{" "}
                    <FormattedMessage id="start.exportAsFile"/>
                </DrawerItem>

                <DrawerItem onButtonClick={onAnalyze}>
                    <i className="fab fa-searchengin me-2"></i>{" "}
                    <FormattedMessage id="start.analyze" defaultMessage="Analyze"/>
                </DrawerItem>

                <DrawerItem closeDrawer={closeDrawer} to="/export">
                    <i className="fas fa-download"></i>{" "}
                    <FormattedMessage id="start.export"/>
                </DrawerItem>
            </>
        );
    }

    // variant === "sidebar"
    return (
        <>
            <Link id="load" className="nav-link" to="/gallery">
                <i className="fas fa-upload"></i>{" "}
                <FormattedMessage id="start.loadFromGallery"/>
            </Link>

            <SidebarButtonWithTooltip id="save" msgId="start.save" className="js-save">
                <i className="far fa-save"></i>{" "}
                <FormattedMessage id="start.save"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="exportToFile" msgId="start.exportAsFile">
                <i className="fas fa-file-export"></i>{" "}
                <FormattedMessage id="start.exportAsFile"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="analyze" msgId="start.analyzeText">
                <i className="fab fa-searchengin"></i>{" "}
                <FormattedMessage id="start.analyze"/>
            </SidebarButtonWithTooltip>

            <Link id="goToExport" className="nav-link" to="/export">
                <i className="fas fa-download"></i>{" "}
                <FormattedMessage id="start.export"/>
            </Link>
        </>
    );
}