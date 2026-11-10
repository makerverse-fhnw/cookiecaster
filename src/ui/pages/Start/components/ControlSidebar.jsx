import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import SidebarButtonWithTooltip from "./SidebarButtonWithTooltip";
import ControlActions from "./ControlActions.jsx";

export default function ControlSidebar() {
    return (
        <aside className="sidenav">

            <h5><FormattedMessage id="start.controlSidebarTitle" /></h5>
            <ControlActions variant="sidebar"/>
        </aside>
    );
}