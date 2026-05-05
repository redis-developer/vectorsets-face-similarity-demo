import React from 'react';
import styles from './NearestMatchResult.module.scss';
import { ImageCard } from '../../../components/shared/ImageCard/ImageCard';
import { ImageDetailCard } from '../../../components/shared/ImageDetailCard/ImageDetailCard';
import { MatchingProgress } from '../../../components/shared/MatchingProgress/MatchingProgress';
import type { ImageDoc } from '../../../types';

interface NearestMatchResultProps {
  selectedImage?: ImageDoc | null;
  celebrityMatch?: ImageDoc | null;
  isSearching?: boolean;
}

const NearestMatchResult: React.FC<NearestMatchResultProps> = ({
  selectedImage,
  celebrityMatch,
  isSearching = false,
}) => {
  return (
    <div className={styles.nearestMatchResult}>
      <div className={styles.selectedPhotoSection}>
        <label className={styles.sectionLabel}>Selected photo</label>
        <div className={styles.imageContainer}>
          {selectedImage ? (
            <ImageCard image={selectedImage} width={280} showLabel={false} />
          ) : (
            <div className={styles.emptyImagePlaceholder}>
              <span>Select a photo</span>
            </div>
          )}
        </div>
      </div>

      {isSearching && (
        <div className={styles.matchingSection}>
          <MatchingProgress isSearching={isSearching} />
        </div>
      )}

      <div className={styles.celebrityMatchSection}>
        <label className={styles.sectionLabel}>Best match</label>
        <div className={styles.imageContainer}>
          {celebrityMatch ? (
            <ImageDetailCard
              image={celebrityMatch}
              width={280}
              showLabel={true}
              expandable={true}
              defaultExpanded={false}
            />
          ) : (
            <div className={styles.emptyImagePlaceholder}>
              <span>No match found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { NearestMatchResult };
