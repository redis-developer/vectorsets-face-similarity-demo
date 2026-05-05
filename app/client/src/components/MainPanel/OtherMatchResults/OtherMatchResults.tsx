import React from 'react';
import styles from './OtherMatchResults.module.scss';
import { ImageDetailCard } from '../../../components/shared/ImageDetailCard/ImageDetailCard';
import type { ImageDoc } from '../../../types';

interface OtherMatchResultsProps {
  otherMatches?: ImageDoc[];
}

const OtherMatchResults: React.FC<OtherMatchResultsProps> = ({
  otherMatches = [],
}) => {
  return (
    <div className={styles.otherMatchResults}>
      <label className={styles.sectionLabel}>Other matches</label>
      <div className={styles.matchesContainer}>
        {otherMatches.length > 0 ? (
          otherMatches.map((match, index) => (
            <ImageDetailCard
              key={`${match.id || index}`}
              image={match}
              width={130}
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
  );
};

export { OtherMatchResults };
