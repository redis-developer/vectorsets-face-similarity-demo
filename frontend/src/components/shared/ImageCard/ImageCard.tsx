import React from "react";
import Image from "next/image";
import styles from "./ImageCard.module.scss";
import type { ImageDoc } from "@/types";

type Props = {
    image: ImageDoc;
    selected?: boolean;
    onSelect?: (img: ImageDoc) => void;
};

const ImageCard: React.FC<Props> = ({ image, selected = false, onSelect }) => {
    const handleClick = () => onSelect?.(image);

    return (
        <button
            type="button"
            className={`${styles.imageCard} ${selected ? styles["imageCard--selected"] : ""
                }`}
            onClick={handleClick}
            aria-pressed={selected}
            aria-label={image.name ?? "Image card"}
        >
            <div className={styles["imageCard__thumbWrapper"]}>
                <Image
                    src={image.src}
                    alt={image.name ?? "Image preview"}
                    className={styles["imageCard__thumb"]}
                    width={120}
                    height={120}
                    style={{ objectFit: "cover" }}
                />
            </div>

            {image.name && (
                <div className={styles["imageCard__label"]}>{image.name}</div>
            )}
        </button>
    );
};

export default ImageCard;