import React from "react";
import Image from "next/image";
import styles from "./ImageCard.module.scss";
import type { ImageDoc } from "@/types";

type Props = {
    image: ImageDoc;
    selected?: boolean;
    onSelect?: (img: ImageDoc) => void;
    width?: number;
    height?: number;
};

const ImageCard: React.FC<Props> = ({
    image,
    selected = false,
    onSelect,
    width = 120,
    height = 120
}) => {
    const handleClick = () => onSelect?.(image);

    return (
        <button
            type="button"
            className={`${styles.imageCard} ${selected ? styles.selected : ""}`}
            onClick={handleClick}
            aria-pressed={selected}
            aria-label={image.name ?? "Image card"}
            style={{ width: `${width}px` }}
        >
            <div
                className={styles.thumbnailWrapper}
                style={{ height: image.name ? `${height * 0.8}px` : `${height}px` }}
            >
                <Image
                    src={image.src}
                    alt={image.name ?? "Image preview"}
                    className={styles.thumbnail}
                    width={width}
                    height={image.name ? height * 0.8 : height}
                    style={{ objectFit: "cover" }}
                />
            </div>

            {image.name && (
                <div className={styles.label}>{image.name}</div>
            )}
        </button>
    );
};

export default ImageCard;