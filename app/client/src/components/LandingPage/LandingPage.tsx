import React, { useState, useEffect } from 'react';
import { RefreshCw, Camera } from 'lucide-react';
import styles from './LandingPage.module.scss';
import { DropZone } from '../shared/DropZone/DropZone';
import { Selfie } from '../shared/Selfie/Selfie';
import { ImageCard } from '../shared/ImageCard/ImageCard';
import { getSampleImages } from '../../utils/api';
import { MAX_UPLOAD_FILE_SIZE } from '../../utils/config';
import type { ImageDoc } from '../../types';

interface LandingPageProps {
  onImageSelect: (image: ImageDoc) => void;
  onImageUpload: (image: ImageDoc) => void;
}

const IMG_WIDTH = 100;

const LandingPage: React.FC<LandingPageProps> = ({
  onImageSelect,
  onImageUpload,
}) => {
  const [availableImages, setAvailableImages] = useState<ImageDoc[]>([]);
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
        console.error('Unexpected error in fetchImages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [refreshKey]);

  const handleImageUpload = (image: ImageDoc) => {
    image.fromUpload = true;
    onImageUpload(image);
  };

  const handleImageSelect = (image: ImageDoc) => {
    image.fromUpload = false;
    onImageSelect(image);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className={styles.landingPage}>
      <h2 className={styles.heading}>How it works:</h2>

      <p className={styles.step}>
        <span className={styles.stepNumber}>1.</span> Upload a photo, take a
        selfie, or select a face below to find similar matches.
      </p>

      <DropZone
        onFileUploaded={handleImageUpload}
        fileSizeMax={MAX_UPLOAD_FILE_SIZE}
      />

      <div className={styles.orDivider}>or</div>

      <Selfie
        onUploaded={handleImageUpload}
        fileSizeMax={MAX_UPLOAD_FILE_SIZE}
        width="240px"
        buttonText="Take a selfie"
        icon={<Camera size={18} />}
        buttonClassName={styles.selfieButton}
      />

      <p className={styles.pickLabel}>or pick a face below</p>

      <div className={styles.gridHeader}>
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

      <div className={styles.celebrityGridContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading images...</p>
          </div>
        ) : availableImages.length > 0 ? (
          <div className={styles.celebrityGrid}>
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

export { LandingPage };
