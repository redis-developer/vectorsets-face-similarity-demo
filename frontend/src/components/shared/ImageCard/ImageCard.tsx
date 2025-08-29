import React from "react";
import Image from "next/image";
import styles from "./ImageCard.module.scss";
import type { IImageDoc } from "@/types";

type Props = {
    image: IImageDoc;
    selected?: boolean;
    onSelect?: (img: IImageDoc) => void;
    width?: number;
    height?: number;
    showLabel?: boolean;
};

const ImageCard: React.FC<Props> = ({
    image,
    selected = false,
    onSelect,
    width = 120,
    height = 120,
    showLabel = true
}) => {
    const handleClick = () => onSelect?.(image);

    return (
        <button
            type="button"
            className={`${styles.imageCard} ${selected ? styles.selected : ""}`}
            onClick={handleClick}
            aria-pressed={selected}
            aria-label={image.label ?? "Image card"}
            style={{
                width: `${width}px`,
                height: `${height}px`
            }}
        >
            <div
                className={styles.thumbnailWrapper}
                style={{
                    height: (image.label && showLabel) ? `${(height - 16) * 0.8}px` : `${height - 16}px`,
                    width: `${width - 16}px`
                }}
            >
                <Image
                    src={image.src}
                    alt={image.label ?? "Image preview"}
                    className={styles.thumbnail}
                    width={width - 16}
                    height={(image.label && showLabel) ? (height - 16) * 0.8 : height - 16}
                    style={{ objectFit: "cover" }}
                />
            </div>

            {image.label && showLabel && (
                <div className={styles.label}>{image.label}</div>
            )}
        </button>
    );
};

export default ImageCard;