import React from 'react'
import styles from './NearestMatchResult.module.scss'
import ImageCard from '@/components/shared/ImageCard/ImageCard'
import MatchingProgress from '@/components/shared/MatchingProgress/MatchingProgress'
import type { IImageDoc } from '@/types'

interface NearestMatchResultProps {
    selectedImage?: IImageDoc | null;
    celebrityMatch?: IImageDoc | null;
    isSearching?: boolean;
    searchError?: string | null;
}

const NearestMatchResult: React.FC<NearestMatchResultProps> = ({
    selectedImage,
    celebrityMatch,
    isSearching = false,
    searchError = null
}) => {
    return (
        <div className={styles.nearestMatchResult}>
            <div className={styles.selectedPhotoSection}>
                <label className={styles.sectionLabel}>Selected Photo</label>
                <div className={styles.imageContainer}>
                    {selectedImage ? (
                        <ImageCard
                            image={selectedImage}
                            width={150}
                            height={150}
                            showLabel={!selectedImage.fromUpload}
                        />
                    ) : (
                        <div className={styles.emptyImagePlaceholder}>
                            <span>No photo selected</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.matchingSection}>
                <MatchingProgress isSearching={isSearching} />
                {searchError && (
                    <div className={styles.errorMessage}>
                        <span>{searchError}</span>
                    </div>
                )}
            </div>

            <div className={styles.celebrityMatchSection}>
                <label className={styles.sectionLabel}>Celebrity Twin is</label>
                <div className={styles.imageContainer}>
                    {celebrityMatch ? (
                        <ImageCard
                            image={celebrityMatch}
                            width={150}
                            height={150}
                            showLabel={true}
                        />
                    ) : (
                        <div className={styles.emptyImagePlaceholder}>
                            <span>No match found</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default NearestMatchResult
