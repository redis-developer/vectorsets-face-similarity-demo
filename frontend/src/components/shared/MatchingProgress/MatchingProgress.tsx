import React, { useState, useEffect } from 'react'
import styles from './MatchingProgress.module.scss'

interface MatchingProgressProps {
    isSearching: boolean;
}

const MatchingProgress: React.FC<MatchingProgressProps> = ({
    isSearching
}) => {
    const [progress, setProgress] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (isSearching && !hasStarted) {
            setHasStarted(true);
        }

        if (!isSearching) {
            setProgress(0);
            return;
        }

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    return prev; // Stop at 90% until search completes
                }
                return prev + Math.random() * 15; // Random increment for realistic feel
            });
        }, 200);

        return () => clearInterval(interval);
    }, [isSearching, hasStarted]);

    useEffect(() => {
        if (!isSearching && progress > 0) {
            // Complete the progress when search finishes
            setProgress(100);
        }
    }, [isSearching, progress]);

    return (
        <div className={styles.matchingProgress}>
            <div className={styles.matchingText}>
                <span className={`${styles.matchingLabel} ${isSearching ? styles.searching : (hasStarted ? styles.complete : styles.searching)}`}>
                    {isSearching ? 'MATCHING...' : (hasStarted ? 'COMPLETE' : 'MATCHING...')}
                </span>
            </div>
            <div className={styles.progressContainer}>
                <div
                    className={styles.progressBar}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}

export default MatchingProgress
