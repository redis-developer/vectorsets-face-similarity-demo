"use client";

import React, { useRef, useState } from "react";
import styles from "./UploadImage.module.scss";
import { apiImageUpload } from "@/utils/api";
import type { IImageDoc } from "@/types";

type Props = {
    onUploaded?: (image: IImageDoc) => void; // parent can update the grid/selection
    fileSizeMax?: number;
    width?: number | string;
    maxWidth?: number | string;
};

const UploadImage: React.FC<Props> = ({ onUploaded, fileSizeMax, width, maxWidth }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePick = () => inputRef.current?.click();

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (fileSizeMax) {
            if (file.size > fileSizeMax) {
                setError(file.name + " file is larger than " + (fileSizeMax / 1024 / 1024).toFixed(2) + " MB");
                return;
            }
        }

        setError(null);
        setBusy(true);
        try {
            const uploaded = await apiImageUpload(file);
            if (uploaded.data) {
                if (onUploaded && typeof onUploaded === "function") {
                    onUploaded({
                        id: uploaded.data?.id || "",
                        src: uploaded.data?.url || "",
                        filename: uploaded.data?.filename || "",
                    });
                }
            } else {
                setError(uploaded.error || "Upload failed");
            }
        } catch (err: any) {
            setError(err?.message || "Upload API failed");
        } finally {
            setBusy(false);
            // reset input so the same file can be selected aga in if needed
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const buttonStyle: React.CSSProperties = {};
    if (width) {
        buttonStyle.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (maxWidth) {
        buttonStyle.maxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
    }

    return (
        <div className={styles.uploadImage}>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className={styles["uploadImage__input"]}
                aria-label="Choose an image to upload"
            />

            <button
                type="button"
                className={styles["uploadImage__button"]}
                onClick={handlePick}
                disabled={busy}
                aria-busy={busy}
                style={buttonStyle}
            >
                {busy ? "Uploading…" : "Choose Photo"}
            </button>

            {error && <div className={styles["uploadImage__error"]}>{error}</div>}

            {/* <div className={styles["uploadImage__hint"]}>
                JPG, PNG, or WebP
            </div> */}
        </div>
    );
};

export default UploadImage;