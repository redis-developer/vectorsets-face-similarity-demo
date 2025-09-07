import React from 'react'
import { Info } from 'lucide-react'
import styles from './PlaceholderContent.module.scss'

const PlaceholderContent: React.FC = () => {
    return (
        <div className={styles.placeholderContent}>
            <div className={styles.content}>
                <h3 className={styles.title}>From Left Sidebar, you can:</h3>


                <div className={styles.options}>
                    <div className={styles.option}>
                        <div className={styles.optionContent}>
                            <h3>Select an existing image to find similar faces</h3>
                        </div>
                    </div>

                    <div className={styles.orDivider}>OR</div>

                    <div className={styles.option}>
                        <div className={styles.optionContent}>
                            <h3>Upload new photo to find similar faces</h3>
                        </div>
                    </div>

                    <div className={styles.orDivider}>OR</div>

                    <div className={styles.option}>
                        <div className={styles.optionContent}>
                            <h3>Take a selfie and find similar faces</h3>
                        </div>
                    </div>
                </div>

                <div className={styles.noteBlock}>
                    <div className={styles.noteIcon}>
                        <Info size={18} />
                    </div>
                    <div className={styles.noteContent}>
                        <h4>Dataset Selection</h4>
                        <p>In the top right corner, you can choose between datasets:</p>
                        <ul>
                            <li><strong>Celebrity 1000:</strong> Contains multiple different images of 1,000 celebrities</li>
                            <li><strong>TMDB 10k:</strong> Contains 10,000 different actor images from The Movie Database</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default PlaceholderContent
