"use client";

import UploadImage from "@/components/shared/UploadImage/UploadImage";
import { useState } from "react";
import type { IImageDoc } from "@/types";
import Image from "next/image";

export default function UploadImagePage() {
    const [uploaded, setUploaded] = useState<IImageDoc>();
    const fileSizeMax = 1 * 1024 * 1024; // 1MB
    return (
        <div style={{ padding: "20px" }}>
            <UploadImage
                width={200}
                fileSizeMax={fileSizeMax}
                onUploaded={(img) => setUploaded(img)}
            />
            {uploaded && uploaded.src && <Image src={uploaded.src} alt={uploaded.filename || "Uploaded image"} width={300} height={200} />}
        </div >
    );
}