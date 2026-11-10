import {FormattedMessage} from "react-intl";
import SidebarButtonWithTooltip from "./SidebarButtonWithTooltip";

export default function DrawSidebar({
                                    showGrid,
                                    changeGrid,
                                    pictureUrl,
                                    toggleBackground,
                                    zoomIndex,
                                    changeZoom,
                                    handleUploadClick,
                                    fileInputRef,
                                    handleFileSelected,
                                    zoomLevels
                                }) {
    return (
        <aside className="sidenav">
            <h5><FormattedMessage id="start.drawSidebarTitle"/></h5>
            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2 standard-font">
                    <i className="fas fa-table-cells-large"></i>
                    <FormattedMessage id="start.helplines"/>
                </div>
                <label className="switch m-0">
                    <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={(e) => changeGrid(e.target.checked)}
                    />
                    <span className="slider round"></span>
                </label>
            </div>

            {/* BACKGROUND IMAGE */}
            <div className="list-group-item d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <i className="far fa-image"></i>
                    <FormattedMessage id="start.backgroundImage"/>
                </div>
                <label className="switch m-0">
                    <input
                        type="checkbox"
                        checked={!!pictureUrl}
                        onChange={(e) => toggleBackground(e.target.checked)}
                    />
                    <span className="slider round"></span>
                </label>
            </div>

            {/* ZOOM SELECTOR */}
            <div className="list-group-item d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <i className="fa fa-search"></i>
                    <FormattedMessage id="start.zoom"/>
                </div>
                <div className="selector m-0 flex-shrink-0">
                    <select
                        className="form-select form-select-sm fs-6"
                        aria-label="Zoom"
                        value={zoomIndex}
                        onChange={(e) => changeZoom(e.target.value)}
                    >
                        {zoomLevels.map((z, i) => (
                            <option key={z} value={i}>{z}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TOOL BUTTONS */}
            <SidebarButtonWithTooltip id="reset" msgId="start.deleteEverything" type="button">
                <i className="far fa-file"></i> <FormattedMessage id="start.new"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="draw" msgId="start.draw">
                <i className="far fa-edit"></i> <FormattedMessage id="start.draw"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="select" msgId="start.select">
                <i className="fas fa-expand"></i> <FormattedMessage id="start.select"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="move" msgId="start.move">
                <i className="fas fa-arrows-alt"></i> <FormattedMessage id="start.move"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="rotate" msgId="start.rotate">
                <i className="fas fa-sync-alt"></i> <FormattedMessage id="start.rotate"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="mirror" msgId="start.mirror">
                <i className="far fa-star-half"></i> <FormattedMessage id="start.mirror"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="copy" msgId="start.copy">
                <i className="far fa-clone"></i> <FormattedMessage id="start.copy"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="loadFromFile" msgId="start.loadFromFile">
                <i className="fas fa-folder-open"></i> <FormattedMessage id="start.loadFromFile"/>
            </SidebarButtonWithTooltip>

            {/* UPLOAD IMAGE */}
            <SidebarButtonWithTooltip
                id="upload"
                msgId="start.uploadTooltip"
                type="button"
                onClick={handleUploadClick}
            >
                <i className="fas fa-camera"></i> <FormattedMessage id="start.upload"/>
            </SidebarButtonWithTooltip>

            {/* File input hidden */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleFileSelected}
            />

            <SidebarButtonWithTooltip id="erase" msgId="start.deleteTooltip">
                <i className="far fa-trash-alt"></i> <FormattedMessage id="start.delete"/>
            </SidebarButtonWithTooltip>
        </aside>
    );
}