import React from "react";
import Image from "next/image";
import styles from "./ImageCard.module.scss";
import type { IImageDoc } from "@/types";

type Props = {
    image: IImageDoc;
    selected?: boolean;
    onSelect?: (img: IImageDoc) => void;
    width?: number;
    showLabel?: boolean;
};

const ImageCard: React.FC<Props> = ({
    image,
    selected = false,
    onSelect,
    width = 120,
    showLabel = true
}) => {
    const handleClick = () => onSelect?.(image);

    // Calculate content height based on whether we have label and/or score
    const hasLabel = image.label && showLabel;
    const hasScore = image.meta?.score !== undefined && showLabel;
    const hasBoth = hasLabel && hasScore;

    const calculateImageHeight = (cardWidth: number, hasLabel: boolean, hasScore: boolean): number => {
        // Always make image square by using the width minus padding
        const imageSize = cardWidth - 16; // 16px for padding (8px on each side)
        return imageSize;
    };

    const imageSize = calculateImageHeight(width, !!hasLabel, !!hasScore);

    const contentSpace = hasBoth ? 40 : (hasLabel || hasScore ? 20 : 0);
    const requiredCardHeight = imageSize + contentSpace + 16; // image + content + padding

    return (
        <button
            type="button"
            className={`${styles.imageCard} ${selected ? styles.selected : ""}`}
            onClick={handleClick}
            aria-pressed={selected}
            aria-label={image.label ?? "Image card"}
            style={{
                width: `${width}px`,
                height: `${requiredCardHeight}px`
            }}
        >
            <div
                className={styles.thumbnailWrapper}
                style={{
                    height: `${imageSize}px`,
                    width: `${imageSize}px`
                }}
            >
                <Image
                    src={image.src}
                    alt={image.label ?? "Image preview"}
                    className={styles.thumbnail}
                    width={imageSize}
                    height={imageSize}
                    style={{ objectFit: "cover" }}
                />
            </div>

            {(hasLabel || hasScore) && (
                <div
                    className={styles.content}
                    style={{
                        height: hasBoth ? '40px' : '20px'
                    }}
                >
                    {hasLabel && (
                        <div
                            className={styles.label}
                            title={image.label}
                        >
                            {image.label}
                        </div>
                    )}
                    {hasScore && (
                        <div className={styles.score}>
                            Score: {image.meta!.score}
                        </div>
                    )}
                </div>
            )}
        </button>
    );
};

export default ImageCard;