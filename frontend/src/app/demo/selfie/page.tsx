"use client";

import Selfie from "@/components/shared/Selfie/Selfie";
import { useState } from "react";
import type { IImageDoc } from "@/types";
import Image from "next/image";

export default function SelfiePage() {
    const [uploaded, setUploaded] = useState<IImageDoc>();
    const fileSizeMax = 1 * 1024 * 1024; // 1MB

    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{ marginBottom: "20px", fontSize: "24px", fontWeight: "bold" }}>
                Selfie Component Demo
            </h1>

            <p style={{ marginBottom: "20px", color: "#6b7280", maxWidth: "600px" }}>
                This demo shows the Selfie component with modal interface.
            </p>
            <p style={{ marginBottom: "20px", color: "#6b7280", maxWidth: "600px", fontStyle: "italic" }}>
                <strong>Note:</strong> Open browser developer tools (F12) to see detailed console logs of the process.
            </p>

            <div style={{ marginBottom: "30px" }}>
                <h2 style={{ marginBottom: "10px", fontSize: "18px" }}>Selfie Component:</h2>
                <Selfie
                    width={200}
                    fileSizeMax={fileSizeMax}
                    onUploaded={(img) => setUploaded(img)}
                />
            </div>

            {uploaded && uploaded.src && (
                <div style={{ marginTop: "30px" }}>
                    <h2 style={{ marginBottom: "10px", fontSize: "18px" }}>Uploaded Image:</h2>
                    <div style={{
                        border: "2px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "10px",
                        display: "inline-block",
                        backgroundColor: "#f9fafb"
                    }}>
                        <Image
                            src={uploaded.src}
                            alt={uploaded.filename || "Uploaded selfie"}
                            width={300}
                            height={200}
                            style={{ borderRadius: "4px" }}
                        />
                        <div style={{ marginTop: "8px", fontSize: "14px", color: "#6b7280" }}>
                            <p><strong>Filename:</strong> {uploaded.filename}</p>
                            <p><strong>ID:</strong> {uploaded.id}</p>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
                <h3 style={{ marginBottom: "10px", fontSize: "16px" }}>Component Features:</h3>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#374151" }}>
                    <li>📷 Access to front-facing camera</li>
                    <li>📸 Photo capture with preview</li>
                    <li>🔄 Retake functionality</li>
                    <li>⬆️ Upload to same API as UploadImage</li>
                    <li>📏 File size validation (1MB limit)</li>
                </ul>
            </div>
        </div>
    );
}
