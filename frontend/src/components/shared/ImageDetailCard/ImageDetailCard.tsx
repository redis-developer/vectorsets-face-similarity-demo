import React, { useState } from "react";
import ImageCard from "@/components/shared/ImageCard/ImageCard";
import styles from "./ImageDetailCard.module.scss";
import type { IImageDoc } from "@/types";

type Props = {
    image: IImageDoc;
    selected?: boolean;
    onSelect?: (img: IImageDoc) => void;
    width?: number;
    showLabel?: boolean;
    expandable?: boolean;
    defaultExpanded?: boolean;
};

const ImageDetailCard: React.FC<Props> = ({
    image,
    selected = false,
    onSelect,
    width = 120,
    showLabel = true,
    expandable = true,
    defaultExpanded = false
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const handleImageSelect = (img: IImageDoc) => {
        onSelect?.(img);
    };

    const handleExpandToggle = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering image selection
        setIsExpanded(!isExpanded);
    };

    const handleCardClick = () => {
        // Only handle selection if not clicking the expand button
        onSelect?.(image);
    };

    return (
        <div className={styles.container} style={{ width: `${width}px` }}>
            <div className={styles.imageCardWrapper} onClick={handleCardClick}>
                <ImageCard
                    image={image}
                    selected={selected}
                    onSelect={handleImageSelect}
                    width={width}
                    showLabel={showLabel}
                />

                {expandable && (
                    <button
                        type="button"
                        className={`${styles.expandButton} ${isExpanded ? styles.expanded : ""}`}
                        onClick={handleExpandToggle}
                        aria-label={isExpanded ? "Collapse details" : "Expand details"}
                        aria-expanded={isExpanded}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 12L10 8L6 4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {expandable && isExpanded && image.meta && (
                <div className={styles.metaPanel}>
                    {Object.entries(image.meta).map(([key, value]) => (
                        <div key={key} className={styles.metaField}>
                            <span className={styles.metaKey}>{key}:</span>
                            <span className={styles.metaValue}>{String(value)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageDetailCard;
