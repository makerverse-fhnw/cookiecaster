import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { exportCC3File } from "../../../utils/FileExport.js";

// hooks
import { useTemplates } from "./hooks/useTemplates.js";
import { useCustomItems } from "./hooks/useCustomItems.js";
import { useGallerySelection } from "./hooks/useGallerySelection.js";

// Dynamischer Import aller JSON Templates im Ordner /templates
const templateFiles = import.meta.glob("/src/templates/*.json", { eager: true });

export default function Gallery() {
    const templates = useTemplates(templateFiles);
    const { customItems, deleteItem } = useCustomItems("drawings");
    const handleSelect = useGallerySelection();

    // --- Leerer Zustand ---
    if (templates.length === 0 && customItems.length === 0) {
        return (
            <div className="text-center p-5">
                <FormattedMessage
                    id="gallery.empty"
                    defaultMessage="Noch keine gespeicherten Formen"
                />
                <div className="mt-4">
                    <Link to="/start" className="btn btn-primary">
                        <FormattedMessage id="gallery.backButton" defaultMessage="Zurück" />
                    </Link>
                </div>
            </div>
        );
    }

    const Card = ({ item, children }) => (
        <div className="col-md-4 col-lg-3">
            <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                    <svg
                        viewBox="0 0 200 200"
                        role="button"
                        tabIndex={0}
                        className="w-100"
                        style={{ height: 140 }}
                        onClick={() => handleSelect(item)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") handleSelect(item);
                        }}
                    >
                        <path
                            d={item.svgPath || item.svg || ""}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                    </svg>

                    <p className="mt-2 mb-2 fw-semibold">{item.name}</p>

                    {children}
                </div>
            </div>
        </div>
    );

    return (
        <div className="container py-4 text-center">
            {/* === Templates === */}
            {templates.length > 0 && (
                <>
                    <h2 className="mt-4">
                        <FormattedMessage id="gallery.templates" defaultMessage="Vorlagen" />
                    </h2>

                    <div className="row g-4 mt-2">
                        {templates.map((tpl) => (
                            <Card key={tpl.id} item={tpl}>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        exportCC3File(tpl.graphJSON, tpl.name);
                                    }}
                                    type="button"
                                >
                                    <FormattedMessage id="gallery.export" defaultMessage="Exportieren" />
                                </button>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* === Eigene Zeichnungen === */}
            {customItems.length > 0 && (
                <>
                    <h2 className="mt-5">
                        <FormattedMessage id="gallery.custom" defaultMessage="Eigene Formen" />
                    </h2>

                    <div className="row g-4 mt-2">
                        {customItems.map((item) => (
                            <Card key={item.id} item={item}>
                                <div className="d-flex justify-content-center gap-2 flex-wrap">
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteItem(item.id);
                                        }}
                                        type="button"
                                    >
                                        <FormattedMessage id="gallery.delete" defaultMessage="Löschen" />
                                    </button>

                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            exportCC3File(item.graphJSON, item.name);
                                        }}
                                        type="button"
                                    >
                                        <FormattedMessage id="gallery.export" defaultMessage="Exportieren" />
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            <Link to="/start" className="btn btn-primary mt-5">
                <FormattedMessage id="gallery.backButton" defaultMessage="Zurück" />
            </Link>
        </div>
    );
}
