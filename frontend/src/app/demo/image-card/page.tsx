"use client";

import React, { useMemo, useState } from "react";
import ImageCard from "@/components/shared/ImageCard/ImageCard";
import type { IImageDoc } from "@/types";

export default function ImageCardDemoPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const images: IImageDoc[] = useMemo(
        () => [
            { id: "1", name: "", src: "/images/00000_Aaron_Eckhart.jpg" },
            { id: "2", name: "Aaron Paul", src: "/images/00018_Aaron_Paul.jpg" },
            { id: "3", name: "Aaron Rodgers", src: "/images/00045_Aaron_Rodgers.jpg" },
        ],
        []
    );

    return (
        <main style={{ padding: "24px" }}>
            <h1 style={{ marginBottom: 16 }}>ImageCard Demo</h1>

            <p style={{ marginBottom: 16, color: "#6b7280" }}>
                Click any card to toggle selection.
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 16,
                    maxWidth: 720,
                }}
            >
                {images.map((img) => (
                    <ImageCard
                        key={img.id}
                        image={img}
                        selected={selectedId === img.id}
                        onSelect={(it) =>
                            setSelectedId((prev) => (prev === it.id ? null : it.id))
                        }
                    />
                ))}
            </div>
        </main>
    );
}