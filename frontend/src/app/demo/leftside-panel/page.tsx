'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import LeftSidePanel from '@/components/LeftSidePanel/LeftSidePanel';
import type { IImageDoc } from '@/types';
import styles from './page.module.scss';

const LeftSidePanelDemo: React.FC = () => {
    const [currentImage, setCurrentImage] = useState<IImageDoc | null>(null);

    const handleImageSelect = (image: IImageDoc) => {
        setCurrentImage(image);
    };

    const handleImageUpload = (image: IImageDoc) => {
        setCurrentImage(image);
    };

    return (
        <div className={styles.demoContainer}>
            <div className={styles.content}>
                <div className={styles.leftPanel}>
                    <LeftSidePanel
                        width={350}
                        onImageSelect={handleImageSelect}
                        onImageUpload={handleImageUpload}
                    />
                </div>

                <div className={styles.rightPanel}>
                    {currentImage ? (
                        <div className={styles.imageDisplay}>
                            <div className={styles.imageInfo}>
                                <p><strong>Image ID:</strong> {currentImage.id}</p>
                                {currentImage.label && (
                                    <p><strong>Label:</strong> {currentImage.label}</p>
                                )}
                            </div>
                            <Image
                                src={currentImage.src}
                                alt={currentImage.filename || currentImage.id}
                                width={400}
                                height={400}
                                className={styles.previewImage}
                                style={{ objectFit: 'contain' }}
                            />

                        </div>
                    ) : (
                        <div className={styles.noImage}>
                            <p>Select or upload an image to see it here</p>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
};

export default LeftSidePanelDemo;
