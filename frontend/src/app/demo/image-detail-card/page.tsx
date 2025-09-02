"use client";

import React, { useState } from "react";
import ImageDetailCard from "@/components/shared/ImageDetailCard/ImageDetailCard";
import type { IImageDoc } from "@/types";

export default function ImageDetailCardDemoPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Sample data with meta fields
    const sampleImages: IImageDoc[] = [
        {
            id: "1",
            src: "/images/00000_Aaron_Eckhart.jpg",
            label: "Aaron Eckhart",
            meta: {
                name: "Aaron Eckhart",
                department: "Acting",
                country: "USA",
                score: 95,
                age: 55,
                experience: "25+ years"
            }
        },
        {
            id: "2",
            src: "/images/00018_Aaron_Paul.jpg",
            label: "Aaron Paul",
            meta: {
                name: "Aaron Paul",
                department: "Acting",
                country: "USA",
                score: 88,
                age: 44,
                experience: "20+ years"
            }
        },
        {
            id: "3",
            src: "/images/00045_Aaron_Rodgers.jpg",
            label: "Aaron Rodgers",
            meta: {
                name: "Aaron Rodgers",
                department: "Sports",
                country: "USA",
                score: 92,
                age: 40,
                experience: "18+ years"
            }
        }
    ];

    const handleImageSelect = (image: IImageDoc) => {
        setSelectedId((prev) => (prev === image.id ? null : image.id));
        console.log("Selected image:", image);
    };

    return (
        <main style={{ padding: "24px" }}>
            <h1 style={{ marginBottom: 16 }}>ImageDetailCard Demo</h1>

            <p style={{ marginBottom: 16, color: "#6b7280" }}>
                Click any card to toggle selection. Click the arrow button to expand/collapse meta details.
            </p>

            <div style={{ marginBottom: "32px" }}>
                <h3 style={{ marginBottom: 16 }}>Expandable Card (Click arrow to expand):</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <ImageDetailCard
                        image={sampleImages[0]}
                        selected={selectedId === sampleImages[0].id}
                        onSelect={handleImageSelect}
                        width={120}
                        showLabel={true}
                        expandable={true}
                        defaultExpanded={false}
                    />
                </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
                <h3 style={{ marginBottom: 16 }}>Pre-expanded Card:</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <ImageDetailCard
                        image={sampleImages[1]}
                        width={120}
                        showLabel={true}
                        expandable={true}
                        defaultExpanded={true}
                    />
                </div>
            </div>

            <div>
                <h3 style={{ marginBottom: 16 }}>Non-expandable Card:</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <ImageDetailCard
                        image={sampleImages[2]}
                        width={120}
                        showLabel={true}
                        expandable={false}
                    />
                </div>
            </div>
        </main>
    );
}
