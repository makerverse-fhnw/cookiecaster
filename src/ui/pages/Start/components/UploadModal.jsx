import { Modal, Button } from "react-bootstrap";
import { FormattedMessage } from "react-intl";

export default function UploadModal({
                                        show,
                                        onHide,
                                        fileInputRef,
                                        previewUrl,
                                        uploadMode,
                                        setUploadMode,
                                        handleFileSelected,
                                        handleConfirmUpload,
                                        onDragOver,
                                        onDragLeave,
                                        onDrop,
                                        isDragActive
                                    }) {
    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    <FormattedMessage id="alert.imageUploadTitle"/>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="text-center mb-3">
                    <label className="form-label">
                        <FormattedMessage id="alert.enterFile"/>
                    </label>

                    <div
                        className={`upload-drop-zone ${isDragActive ? 'drag-active' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                style={{ maxWidth: "100%", maxHeight: "200px" }}
                                alt="preview"
                            />
                        ) : (
                            <small className="text-muted">
                                <FormattedMessage id="alert.imageUploadText" />
                            </small>
                        )}
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleFileSelected}
                />

                <div className="mt-4">
                    <strong><FormattedMessage id="alert.imageUploadDescription" /></strong>
                    <div className="form-check">
                        <input
                            type="radio"
                            className="form-check-input"
                            value="scale"
                            checked={uploadMode === "scale"}
                            onChange={(e) => setUploadMode(e.target.value)}
                        />
                        <FormattedMessage id="alert.scale"/>
                    </div>

                    <div className="form-check">
                        <input
                            type="radio"
                            className="form-check-input"
                            value="shrink"
                            checked={uploadMode === "shrink"}
                            onChange={(e) => setUploadMode(e.target.value)}
                        />
                        <FormattedMessage id="alert.shrink"/>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    <FormattedMessage id="alert.cancelButton"/>
                </Button>
                <Button variant="primary" onClick={handleConfirmUpload} disabled={!previewUrl}>
                    <FormattedMessage id="alert.saveButton"/>
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
