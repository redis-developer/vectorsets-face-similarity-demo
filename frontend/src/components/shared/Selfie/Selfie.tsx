"use client";

import React, { useRef, useState, useCallback } from "react";
import styles from "./Selfie.module.scss";
import { apiImageUpload } from "@/utils/api";
import type { IImageDoc } from "@/types";
import { showErrorToast } from '@/utils/toast';

type Props = {
    onUploaded?: (image: IImageDoc) => void; // parent can update the grid/selection
    fileSizeMax?: number;
    width?: number | string;
    maxWidth?: number | string;
};

const Selfie: React.FC<Props> = ({ onUploaded, fileSizeMax, width, maxWidth }) => {
    console.log('🚀 Selfie component rendered with props:', { onUploaded: !!onUploaded, fileSizeMax, width, maxWidth });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoLoaded, setVideoLoaded] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            console.log('🎥 Starting camera...');
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user', // Front camera
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            console.log('📹 Camera stream obtained:', stream);
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
        console.log(`📐 Canvas dimensions: ${canvas.width}x${canvas.height}`);

        // Draw the current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (blob) {
                console.log('🖼️ Photo captured, blob size:', blob.size);
                const imageUrl = URL.createObjectURL(blob);
                setCapturedImage(imageUrl);

                // Stop camera stream but don't reset captured image
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                setIsCameraOpen(false);
                setVideoLoaded(false);
                console.log('📸 Photo captured and camera stopped');
            } else {
                console.error('❌ Failed to create blob from canvas');
            }
        }, 'image/jpeg', 0.8);
    }, []);

    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
        startCamera();
    }, [startCamera]);

    const handleVideoLoaded = useCallback(() => {
        console.log('🎬 Video loaded and ready');
        console.log('📹 Video element:', videoRef.current);
        console.log('📐 Video dimensions:', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            clientWidth: videoRef.current?.clientWidth,
            clientHeight: videoRef.current?.clientHeight
        });
        setVideoLoaded(true);
    }, []);

    const uploadPhoto = useCallback(async () => {
        console.log('⬆️ Starting photo upload...');
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
            console.log('📁 File created:', { name: file.name, size: file.size, type: file.type });

            if (fileSizeMax && file.size > fileSizeMax) {
                const errorMessage = "Photo is larger than " + (fileSizeMax / 1024 / 1024).toFixed(2) + " MB";
                showErrorToast(errorMessage);
                console.error('❌ File too large:', file.size, 'max:', fileSizeMax);
                return;
            }

            console.log('🚀 Calling apiImageUpload...');
            const uploaded = await apiImageUpload(file);
            console.log('📤 Upload response:', uploaded);

            if (uploaded.data) {
                console.log('✅ Upload successful:', uploaded.data);
                if (onUploaded && typeof onUploaded === "function") {
                    onUploaded({
                        id: uploaded.data?.id || "",
                        src: uploaded.data?.url || "",
                        filename: uploaded.data?.filename || "",
                    });
                }
                // Reset component state after successful upload
                setCapturedImage(null);
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
                console.log('⏰ Fallback: Setting video as loaded after timeout');
                setVideoLoaded(true);
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [isCameraOpen, videoLoaded]);

    // Debug logging
    console.log('🔍 Component state:', { isCameraOpen, videoLoaded, capturedImage, busy, error });

    return (
        <div className={styles.selfie}>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {!isCameraOpen && !capturedImage && (
                <button
                    type="button"
                    className={styles["selfie__button"]}
                    onClick={() => {
                        console.log('🔘 Take Selfie button clicked');
                        startCamera();
                    }}
                    disabled={busy}
                    style={buttonStyle}
                >
                    📷 Take Selfie
                </button>
            )}

            {isCameraOpen && (
                <div className={styles["selfie__camera"]}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={handleVideoLoaded}
                        className={styles["selfie__video"]}
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            height: 'auto',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: '#f3f4f6'
                        }}
                    />
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
                            onClick={stopCamera}
                        >
                            ❌ Cancel
                        </button>
                    </div>
                    {!videoLoaded && (
                        <div style={{ textAlign: 'center', padding: '10px', color: '#6b7280', fontSize: '14px' }}>
                            Loading camera... (Check console for details)
                        </div>
                    )}
                </div>
            )}

            {capturedImage && (
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
    );
};

export default Selfie;
