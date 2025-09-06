"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import styles from "./Selfie.module.scss";
import { apiImageUpload } from "@/utils/api";
import type { IImageDoc } from "@/types";
import { showErrorToast } from '@/utils/toast';

type Props = {
    onUploaded?: (image: IImageDoc) => void; // parent can update the grid/selection
    fileSizeMax?: number;
    width?: number | string;
    maxWidth?: number | string;
    buttonText?: string; // Custom button text
};

const Selfie: React.FC<Props> = ({ onUploaded, fileSizeMax, width, maxWidth, buttonText = "📷 Take Selfie" }) => {
    console.log('Selfie component rendered with props:', { onUploaded: !!onUploaded, fileSizeMax, width, maxWidth });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [isMirrored, setIsMirrored] = useState(true); // Default to mirrored (like a real mirror)

    const handleOpenModal = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        // Stop camera and reset state when modal closes
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
        setCapturedImage(null);
        setVideoLoaded(false);
        setError(null);
        setIsMirrored(true); // Reset to default mirrored state
    }, []);

    const startCamera = useCallback(async () => {
        try {
            console.log('Starting camera...');
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user', // Front camera
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            console.log('Camera stream obtained:', stream);
            streamRef.current = stream; // Store stream immediately
            setIsCameraOpen(true); // Set camera open, this will cause video element to render
            setVideoLoaded(false); // Reset video loaded state
            console.log('✅ Camera state set to open');
        } catch (err: any) {
            const errorMessage = "Unable to access camera. Please check permissions.";
            setError(errorMessage);
            showErrorToast(errorMessage);
            console.error('❌ Camera access error:', err);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
        setCapturedImage(null);
        setVideoLoaded(false);
        setIsMirrored(true); // Reset to default mirrored state
    }, []);

    const capturePhoto = useCallback(() => {
        console.log('📸 Capturing photo...');
        if (!videoRef.current || !canvasRef.current) {
            console.error('❌ Video or canvas ref not available');
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
            console.error('❌ Canvas context not available');
            return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);

        // Save the current context state
        context.save();

        // Apply mirror transform if enabled - this will make the captured image match what the user sees
        if (isMirrored) {
            context.scale(-1, 1);
            context.translate(-canvas.width, 0);
        }

        // Draw the current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Restore the context state
        context.restore();

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (blob) {
                console.log('Photo captured, blob size:', blob.size);
                const imageUrl = URL.createObjectURL(blob);
                setCapturedImage(imageUrl);

                // Stop camera stream but don't reset captured image
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                setIsCameraOpen(false);
                setVideoLoaded(false);
                console.log('Photo captured and camera stopped');
            } else {
                console.error('❌ Failed to create blob from canvas');
            }
        }, 'image/jpeg', 0.8);
    }, [isMirrored]);

    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
        startCamera();
    }, [startCamera]);

    const toggleMirror = useCallback(() => {
        setIsMirrored(prev => !prev);
    }, []);

    const handleVideoLoaded = useCallback(() => {
        console.log('Video loaded and ready');
        console.log('Video element:', videoRef.current);
        console.log('Video dimensions:', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            clientWidth: videoRef.current?.clientWidth,
            clientHeight: videoRef.current?.clientHeight
        });
        setVideoLoaded(true);
    }, []);

    const uploadPhoto = useCallback(async () => {
        console.log('Starting photo upload...');
        if (!canvasRef.current) {
            console.error('❌ Canvas ref not available for upload');
            return;
        }

        setBusy(true);
        try {
            // Convert canvas to file
            const blob = await new Promise<Blob>((resolve) => {
                canvasRef.current!.toBlob((blob) => {
                    resolve(blob!);
                }, 'image/jpeg', 0.8);
            });

            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            console.log('File created:', { name: file.name, size: file.size, type: file.type });

            if (fileSizeMax && file.size > fileSizeMax) {
                const errorMessage = "Photo is larger than " + (fileSizeMax / 1024 / 1024).toFixed(2) + " MB";
                showErrorToast(errorMessage);
                console.error('❌ File too large:', file.size, 'max:', fileSizeMax);
                return;
            }

            console.log('Calling apiImageUpload...');
            const uploaded = await apiImageUpload(file);
            console.log('Upload response:', uploaded);

            if (uploaded.data) {
                console.log('✅ Upload successful:', uploaded.data);
                if (onUploaded && typeof onUploaded === "function") {
                    onUploaded({
                        id: uploaded.data?.id || "",
                        src: uploaded.data?.url || "",
                        filename: uploaded.data?.filename || "",
                    });
                }
                // Close modal after successful upload
                handleCloseModal();
            } else {
                console.error('❌ Upload failed:', uploaded.error);
            }
        } catch (err: any) {
            console.error('❌ Unexpected error in uploadPhoto:', err);
        } finally {
            setBusy(false);
        }
    }, [fileSizeMax, onUploaded]);

    const buttonStyle: React.CSSProperties = {};
    if (width) {
        buttonStyle.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (maxWidth) {
        buttonStyle.maxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
    }

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (capturedImage) {
                URL.revokeObjectURL(capturedImage);
            }
        };
    }, [capturedImage]);

    // Effect to attach stream to video element once it's rendered
    React.useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            console.log('🔗 Attaching camera stream to video element');
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    // Fallback timeout for video loading
    React.useEffect(() => {
        if (isCameraOpen && !videoLoaded) {
            const timeout = setTimeout(() => {
                console.log('Fallback: Setting video as loaded after timeout');
                setVideoLoaded(true);
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [isCameraOpen, videoLoaded]);

    // Auto-start camera when modal opens
    React.useEffect(() => {
        if (isModalOpen && !isCameraOpen && !capturedImage) {
            console.log('Auto-starting camera when modal opens...');
            startCamera();
        }
    }, [isModalOpen, isCameraOpen, capturedImage, startCamera]);

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isModalOpen) {
                handleCloseModal();
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen, handleCloseModal]);

    // Debug logging
    console.log('🔍 Component state:', { isModalOpen, isCameraOpen, videoLoaded, capturedImage, busy, error });

    return (
        <>
            {/* Trigger Button */}
            <button
                type="button"
                className={styles["selfie__button"]}
                onClick={handleOpenModal}
                disabled={busy}
                style={buttonStyle}
            >
                {buttonText}
            </button>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className={styles["selfie__modal-overlay"]} onClick={handleCloseModal}>
                    <div
                        className={styles["selfie__modal-content"]}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={styles["selfie__modal-header"]}>
                            <h3 className={styles["selfie__modal-title"]}>Take a Selfie</h3>
                            <button
                                type="button"
                                className={styles["selfie__modal-close"]}
                                onClick={handleCloseModal}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className={styles["selfie__modal-body"]}>
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            {!capturedImage ? (
                                <div className={styles["selfie__camera"]}>
                                    <div className={styles["selfie__mirror-control"]}>
                                        <label className={styles["selfie__mirror-checkbox"]}>
                                            <input
                                                type="checkbox"
                                                checked={isMirrored}
                                                onChange={toggleMirror}
                                            />
                                            <span className={styles["selfie__mirror-label"]}>
                                                Mirror view
                                            </span>
                                        </label>
                                    </div>
                                    <div className={styles["selfie__video-container"]}>
                                        {isCameraOpen && (
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                onLoadedMetadata={handleVideoLoaded}
                                                className={`${styles["selfie__video"]} ${isMirrored ? styles["selfie__video--mirrored"] : ""}`}
                                            />
                                        )}
                                        {!videoLoaded && (
                                            <div className={styles["selfie__video-placeholder"]}>
                                                <div className={styles["selfie__loading-spinner"]}></div>
                                                <p>Loading camera...</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles["selfie__controls"]}>
                                        <button
                                            type="button"
                                            className={styles["selfie__capture"]}
                                            onClick={capturePhoto}
                                            disabled={!videoLoaded}
                                        >
                                            📸 Capture {!videoLoaded && '(Loading...)'}
                                        </button>
                                        <button
                                            type="button"
                                            className={styles["selfie__cancel"]}
                                            onClick={handleCloseModal}
                                        >
                                            ❌ Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles["selfie__preview"]}>
                                    <img
                                        src={capturedImage}
                                        alt="Captured selfie"
                                        className={styles["selfie__image"]}
                                    />
                                    <div className={styles["selfie__actions"]}>
                                        <button
                                            type="button"
                                            className={styles["selfie__upload"]}
                                            onClick={uploadPhoto}
                                            disabled={busy}
                                        >
                                            {busy ? "Uploading…" : "Upload Photo"}
                                        </button>
                                        <button
                                            type="button"
                                            className={styles["selfie__retake"]}
                                            onClick={retakePhoto}
                                            disabled={busy}
                                        >
                                            🔄 Retake
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className={styles["selfie__error"]}>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Selfie;
