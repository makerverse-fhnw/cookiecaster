import {useCallback, useState, useRef} from "react";

export default function useImageUpload({setPictureUrl, setTemporaryUrl, toggleBackground, intl}) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadMode, setUploadMode] = useState("shrink");
    const [isDragActive, setIsDragActive] = useState(false);

    const fileInputRef = useRef(null);

    const openUpload = useCallback(() => setIsUploadOpen(true), []);
    const closeUpload = useCallback(() => {
        setIsUploadOpen(false);
        setPreviewUrl(null);
        setUploadMode("shrink");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [fileInputRef]);

    const selectFile = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => setPreviewUrl(event.target.result);
        reader.readAsDataURL(file);
    }, []);

      // Handle drag over (needed to allow drop)
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true); // Highlight on drag over
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false); // Remove highlight when leaving
    }, []);

    // Handle dropped file
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false); // Remove highlight after drop

        const file = e.dataTransfer?.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => setPreviewUrl(event.target.result);
        reader.readAsDataURL(file);
    }, []);

    const cropImage = (uploadedURL) =>
        new Promise((resolve) => {
            const inputImage = new Image();
            inputImage.src = uploadedURL;

            inputImage.onload = () => {
                const {naturalWidth: w, naturalHeight: h} = inputImage;
                const canvas = document.createElement("canvas");
                const aspect = w / h;

                if (aspect > 1) canvas.width = h, canvas.height = h;
                else canvas.width = w, canvas.height = w;

                canvas.getContext("2d").drawImage(inputImage, 0, 0);

                const croppedUrl = canvas.toDataURL();
                setPictureUrl(croppedUrl);
                setTemporaryUrl(croppedUrl);
                resolve();
            };
        });

    const confirmUpload = useCallback(async () => {
        if (!previewUrl) return;
        const {formatMessage} = intl;

        try {
            if (uploadMode === "scale") {
                await cropImage(previewUrl);
            } else {
                setPictureUrl(previewUrl);
                setTemporaryUrl(previewUrl);
            }

            toggleBackground(true);
            closeUpload();
        } catch (err) {
            console.error(err);
            alert(formatMessage({id: "alert.uploadError"}));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewUrl, uploadMode, intl, toggleBackground, closeUpload]);

    return {
        fileInputRef,
        isUploadOpen,
        previewUrl,
        uploadMode,
        setUploadMode,
        openUpload,
        closeUpload,
        selectFile,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        confirmUpload,
        isDragActive
    };
}