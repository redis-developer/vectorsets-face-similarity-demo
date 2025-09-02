import React from 'react'
import styles from './NearestMatchResult.module.scss'
import ImageCard from '@/components/shared/ImageCard/ImageCard'
import ImageDetailCard from '@/components/shared/ImageDetailCard/ImageDetailCard'
import MatchingProgress from '@/components/shared/MatchingProgress/MatchingProgress'
import type { IImageDoc } from '@/types'

interface NearestMatchResultProps {
    selectedImage?: IImageDoc | null;
    celebrityMatch?: IImageDoc | null;
    isSearching?: boolean;
}

const NearestMatchResult: React.FC<NearestMatchResultProps> = ({
    selectedImage,
    celebrityMatch,
    isSearching = false
}) => {
    return (
        <div className={styles.nearestMatchResult}>
            <div className={styles.selectedPhotoSection}>
                <label className={styles.sectionLabel}>Selected Photo</label>
                <div className={styles.imageContainer}>
                    {selectedImage ? (
                        <ImageCard
                            image={selectedImage}
                            width={160}
                            showLabel={false}
                        />
                    ) : (
                        <div className={styles.emptyImagePlaceholder}>
                            <span>No photo selected</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.matchingSection}>
                {isSearching && <MatchingProgress isSearching={isSearching} />}
                {celebrityMatch && (
                    <div className={styles.matchInfo}>
                        <div className={styles.celebrityName}>
                            {celebrityMatch.label}
                        </div>
                        {celebrityMatch.score !== undefined && (
                            <div className={styles.matchScore}>
                                Score: {celebrityMatch.score}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.celebrityMatchSection}>
                <label className={styles.sectionLabel}>Best Match</label>
                <div className={styles.imageContainer}>
                    {celebrityMatch ? (
                        <ImageDetailCard
                            image={celebrityMatch}
                            width={160}
                            showLabel={false}
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
    )
}

export default NearestMatchResult
