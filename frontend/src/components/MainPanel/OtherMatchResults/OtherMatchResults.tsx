import React from 'react'
import styles from './OtherMatchResults.module.scss'
import ImageCard from '@/components/shared/ImageCard/ImageCard'
import type { IImageDoc } from '@/types'

interface OtherMatchResultsProps {
    otherMatches?: IImageDoc[];
}

const OtherMatchResults: React.FC<OtherMatchResultsProps> = ({
    otherMatches = []
}) => {
    return (
        <div className={styles.otherMatchResults}>
            <label className={styles.sectionLabel}>Other Matches</label>
            <div className={styles.matchesContainer}>
                {otherMatches.length > 0 ? (
                    otherMatches.map((match, index) => (
                        <ImageCard
                            key={`${match.id || index}`}
                            image={match}
                            width={130}
                            height={130}
                            showLabel={true}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <span>No additional matches found</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default OtherMatchResults
