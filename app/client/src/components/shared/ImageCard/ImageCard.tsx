import React from 'react';
import styles from './ImageCard.module.scss';
import type { ImageDoc } from '../../../types';

type Props = {
  image: ImageDoc;
  selected?: boolean;
  onSelect?: (img: ImageDoc) => void;
  width?: number;
  showLabel?: boolean;
};

const ImageCard: React.FC<Props> = ({
  image,
  selected = false,
  onSelect,
  width = 120,
  showLabel = true,
}) => {
  const handleClick = () => onSelect?.(image);

  const hasLabel = Boolean(image.label) && showLabel;
  const hasScore = image.score !== undefined && showLabel;
  const hasBoth = hasLabel && hasScore;

  const imageSize = width;
  const contentSpace = hasBoth ? 40 : hasLabel || hasScore ? 20 : 0;
  const requiredCardHeight = imageSize + (contentSpace > 0 ? contentSpace + 6 : 0);

  return (
    <button
      type="button"
      className={`${styles.imageCard} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
      aria-pressed={selected}
      aria-label={image.label ?? 'Image card'}
      style={{
        width: `${width}px`,
        height: `${requiredCardHeight}px`,
      }}
    >
      <div
        className={styles.thumbnailWrapper}
        style={{
          height: `${imageSize}px`,
          width: `${imageSize}px`,
        }}
      >
        <img
          src={image.src}
          alt={image.label ?? 'Image preview'}
          className={styles.thumbnail}
          width={imageSize}
          height={imageSize}
          style={{ objectFit: 'cover' }}
        />
      </div>

      {(hasLabel || hasScore) && (
        <div
          className={styles.content}
          style={{
            height: hasBoth ? '40px' : '20px',
          }}
        >
          {hasLabel && (
            <div className={styles.label} title={image.label}>
              {image.label}
            </div>
          )}
          {hasScore && <div className={styles.score}>Score: {image.score}</div>}
        </div>
      )}
    </button>
  );
};

export { ImageCard };
