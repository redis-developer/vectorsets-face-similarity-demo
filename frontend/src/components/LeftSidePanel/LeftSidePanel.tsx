import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';
import styles from './LeftSidePanel.module.scss';
import UploadImage from '../shared/UploadImage/UploadImage';
import ImageCard from '../shared/ImageCard/ImageCard';
import { getSampleImages } from '@/utils/api';
import type { IImageDoc } from '@/types';
import { MAX_UPLOAD_FILE_SIZE } from '@/utils/config';

type Props = {
    width?: number | string;
    onImageSelect?: (image: IImageDoc) => void;
    onImageUpload?: (image: IImageDoc) => void;
};

const LEFT_SIDE_PANEL_WIDTH = 300;
const IMG_WIDTH = 100;

const LeftSidePanel: React.FC<Props> = ({
    width = LEFT_SIDE_PANEL_WIDTH,
    onImageSelect,
    onImageUpload,
}) => {
    const [uploadedImage, setUploadedImage] = useState<IImageDoc | null>(null);
    const [availableImages, setAvailableImages] = useState<IImageDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchImages = async () => {
            setLoading(true);

            try {
                const response = await getSampleImages();
                if (response.data) {
                    setAvailableImages(response.data);
                }
            } catch (err) {
                // API utility handles all error toasts, just log for debugging
                console.error('Unexpected error in fetchImages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [refreshKey]);

    const handleImageUpload = (image: IImageDoc) => {
        image.fromUpload = true;
        setUploadedImage(image);
        if (onImageUpload) {
            onImageUpload(image);
        }
    };

    const handleImageSelect = (image: IImageDoc) => {
        image.fromUpload = false;
        if (onImageSelect) {
            onImageSelect(image);
        }
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const panelStyle: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
    };

    return (
        <div className={styles.leftSidePanel} style={panelStyle}>
            <div className={styles.uploadSection}>
                <UploadImage
                    onUploaded={handleImageUpload}
                    fileSizeMax={MAX_UPLOAD_FILE_SIZE}
                    width="100%"
                    maxWidth={width}
                />
            </div>

            <div className={styles.labelSection}>
                <div className={styles.labelContainer}>
                    <h3 className={styles.label}>OR PICK A CARD</h3>
                    <button
                        className={styles.refreshButton}
                        onClick={handleRefresh}
                        disabled={loading}
                        aria-label="Refresh images"
                        title="Get new random images"
                    >
                        <RefreshCw
                            size={16}
                            className={`${styles.refreshIcon} ${loading ? styles.spinning : ''}`}
                        />
                    </button>
                </div>
            </div>

            <div className={styles.imageCardsContainer}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <p>Loading images...</p>
                    </div>
                ) : availableImages.length > 0 ? (
                    <div className={styles.imageCardsGrid}>
                        {availableImages.map((image) => (
                            <ImageCard
                                key={image.id}
                                image={image}
                                onSelect={handleImageSelect}
                                width={IMG_WIDTH}
                                showLabel={false}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>No images available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeftSidePanel;
