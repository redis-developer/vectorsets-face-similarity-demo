'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Camera, Crop, RotateCcw, Check } from 'lucide-react';
import styles from './Selfie.module.scss';
import { apiImageUpload } from '../../../utils/api';
import type { ImageDoc } from '../../../types';
import { showErrorToast } from '../../../utils/toast';
import { useCrop } from '../../../hooks/useCrop';

type Props = {
  onUploaded?: (image: ImageDoc) => void; // parent can update the grid/selection
  fileSizeMax?: number;
  width?: number | string;
  maxWidth?: number | string;
  buttonText?: string; // Custom button text
  icon?: React.ReactNode;
  buttonClassName?: string; // Optional override for the trigger button class
};

const Selfie: React.FC<Props> = ({
  onUploaded,
  fileSizeMax,
  width,
  maxWidth,
  buttonText = '📷 Take selfie',
  icon,
  buttonClassName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true); // Default to mirrored (like a real mirror)

  // Use the crop hook
  const crop = useCrop({
    onCropComplete: (croppedImageUrl: string) => {
      setCapturedImage(croppedImageUrl);
    },
  });

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Stop camera and reset state when modal closes
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCapturedImage(null);
    setVideoLoaded(false);
    setError(null);
    setIsMirrored(true); // Reset to default mirrored state
    crop.resetCrop();
  }, [crop]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream; // Store stream immediately
      setIsCameraOpen(true); // Set camera open, this will cause video element to render
      setVideoLoaded(false); // Reset video loaded state
    } catch (err: unknown) {
      const errorMessage = 'Unable to access camera. Please check permissions.';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('❌ Camera access error:', err);
    }
  }, []);

  const capturePhoto = useCallback(() => {
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

    // Convert canvas to blob and start cropping
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage(imageUrl);

          // Start cropping with the captured image
          crop.startCropping(canvasRef as React.RefObject<HTMLCanvasElement>);

          // Stop camera stream and enter cropping mode
          if (streamRef.current) {
            for (const track of streamRef.current.getTracks()) {
              track.stop();
            }
            streamRef.current = null;
          }
          setIsCameraOpen(false);
          setVideoLoaded(false);
        } else {
          console.error('❌ Failed to create blob from canvas');
        }
      },
      'image/jpeg',
      0.8,
    );
  }, [isMirrored, crop]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    crop.resetCrop();
    startCamera();
  }, [startCamera, crop]);

  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  const handleVideoLoaded = useCallback(() => {
    setVideoLoaded(true);
  }, []);

  const uploadPhoto = useCallback(async () => {
    // Use crop canvas ONLY if it has valid dimensions AND we're not in cropping mode
    // This ensures we don't use a stale or empty crop canvas
    const canvasToUse =
      !crop.isCropping &&
      crop.cropCanvasRef.current &&
      crop.cropCanvasRef.current.width > 0 &&
      crop.cropCanvasRef.current.height > 0
        ? crop.cropCanvasRef.current
        : canvasRef.current;

    if (!canvasToUse) {
      console.error('❌ No canvas available for upload');
      return;
    }

    setBusy(true);
    try {
      // Convert canvas to file
      const blob = await new Promise<Blob>((resolve) => {
        canvasToUse!.toBlob(
          (blob: Blob | null) => {
            resolve(blob!);
          },
          'image/jpeg',
          0.8,
        );
      });

      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

      if (fileSizeMax && file.size > fileSizeMax) {
        const errorMessage =
          'Photo is larger than ' +
          (fileSizeMax / 1024 / 1024).toFixed(2) +
          ' MB';
        showErrorToast(errorMessage);
        console.error('❌ File too large:', file.size, 'max:', fileSizeMax);
        return;
      }

      const uploaded = await apiImageUpload(file);

      if (uploaded.data) {
        if (onUploaded && typeof onUploaded === 'function') {
          onUploaded({
            id: uploaded.data?.id || '',
            src: uploaded.data?.url || '',
            filename: uploaded.data?.filename || '',
          });
        }
        // Close modal after successful upload
        handleCloseModal();
      } else {
        console.error('❌ Upload failed:', uploaded.error);
      }
    } catch (err: unknown) {
      console.error('❌ Unexpected error in uploadPhoto:', err);
    } finally {
      setBusy(false);
    }
  }, [fileSizeMax, onUploaded, handleCloseModal, crop]);

  const buttonStyle: React.CSSProperties = {};
  if (width) {
    buttonStyle.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (maxWidth) {
    buttonStyle.maxWidth =
      typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [capturedImage]);

  // Effect to attach stream to video element once it's rendered
  React.useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  // Fallback timeout for video loading
  React.useEffect(() => {
    if (isCameraOpen && !videoLoaded) {
      const timeout = setTimeout(() => {
        setVideoLoaded(true);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isCameraOpen, videoLoaded]);

  // Auto-start camera when modal opens
  React.useEffect(() => {
    if (isModalOpen && !isCameraOpen && !capturedImage) {
      startCamera();
    }
  }, [isModalOpen, isCameraOpen, capturedImage, startCamera]);

  // Add mouse event listeners for crop dragging
  React.useEffect(() => {
    if (crop.isCropping) {
      const handleMouseMoveWrapper = (e: MouseEvent) =>
        crop.handleMouseMove(
          e,
          canvasRef as React.RefObject<HTMLCanvasElement>,
        );

      document.addEventListener('mousemove', handleMouseMoveWrapper);
      document.addEventListener('mouseup', crop.handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMoveWrapper);
        document.removeEventListener('mouseup', crop.handleMouseUp);
      };
    }
  }, [
    crop.isCropping,
    crop.handleMouseMove,
    crop.handleMouseUp,
    crop,
    canvasRef,
  ]);

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

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        className={buttonClassName || styles['selfie__button']}
        onClick={handleOpenModal}
        disabled={busy}
        style={buttonStyle}
      >
        {icon && <span className={styles['selfie__icon']}>{icon}</span>}
        {buttonText}
      </button>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div
          className={styles['selfie__modal-overlay']}
          onClick={handleCloseModal}
        >
          <div
            className={styles['selfie__modal-content']}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles['selfie__modal-header']}>
              <h3 className={styles['selfie__modal-title']}>Take a selfie</h3>
              <button
                type="button"
                className={styles['selfie__modal-close']}
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles['selfie__modal-body']}>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <canvas ref={crop.cropCanvasRef} style={{ display: 'none' }} />

              {!capturedImage ? (
                <div className={styles['selfie__camera']}>
                  <div className={styles['selfie__mirror-control']}>
                    <label className={styles['selfie__mirror-checkbox']}>
                      <span className={styles['selfie__mirror-box']}>
                        <input
                          id="mirror-toggle"
                          type="checkbox"
                          checked={isMirrored}
                          onChange={toggleMirror}
                        />
                        {isMirrored && (
                          <Check
                            size={12}
                            strokeWidth={3}
                            aria-hidden="true"
                            className={styles['selfie__mirror-check']}
                          />
                        )}
                      </span>
                      <span className={styles['selfie__mirror-label']}>
                        Mirror view
                      </span>
                    </label>
                  </div>
                  <div className={styles['selfie__video-container']}>
                    {isCameraOpen && (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={handleVideoLoaded}
                        className={`${styles['selfie__video']} ${isMirrored ? styles['selfie__video--mirrored'] : ''}`}
                      />
                    )}
                    {!videoLoaded && (
                      <div className={styles['selfie__video-placeholder']}>
                        <div
                          className={styles['selfie__loading-spinner']}
                        ></div>
                        <p>Loading camera...</p>
                      </div>
                    )}
                  </div>
                  <div className={styles['selfie__controls']}>
                    <button
                      type="button"
                      className={styles['selfie__capture']}
                      onClick={capturePhoto}
                      disabled={!videoLoaded}
                    >
                      <Camera size={16} aria-hidden="true" />
                      <span>Capture {!videoLoaded && '(Loading...)'}</span>
                    </button>
                    <button
                      type="button"
                      className={styles['selfie__cancel']}
                      onClick={handleCloseModal}
                    >
                      <X size={16} aria-hidden="true" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : crop.isCropping ? (
                <div className={styles['selfie__crop']}>
                  <div
                    className={styles['selfie__crop-container']}
                    ref={crop.cropContainerRef}
                  >
                    <img
                      src={capturedImage}
                      alt="Captured selfie for cropping"
                      className={styles['selfie__crop-image']}
                    />
                    <div
                      className={styles['selfie__crop-overlay']}
                      style={{
                        left: `${(crop.cropData.x / (canvasRef.current?.width || 1)) * 100}%`,
                        top: `${(crop.cropData.y / (canvasRef.current?.height || 1)) * 100}%`,
                        width: `${(crop.cropData.width / (canvasRef.current?.width || 1)) * 100}%`,
                        height: `${(crop.cropData.height / (canvasRef.current?.height || 1)) * 100}%`,
                      }}
                      onMouseDown={crop.handleCropMouseDown}
                    >
                      <div
                        className={styles['selfie__crop-handle']}
                        data-handle="nw"
                        onMouseDown={(e) =>
                          crop.handleCropHandleMouseDown(e, 'nw')
                        }
                      ></div>
                      <div
                        className={styles['selfie__crop-handle']}
                        data-handle="ne"
                        onMouseDown={(e) =>
                          crop.handleCropHandleMouseDown(e, 'ne')
                        }
                      ></div>
                      <div
                        className={styles['selfie__crop-handle']}
                        data-handle="sw"
                        onMouseDown={(e) =>
                          crop.handleCropHandleMouseDown(e, 'sw')
                        }
                      ></div>
                      <div
                        className={styles['selfie__crop-handle']}
                        data-handle="se"
                        onMouseDown={(e) =>
                          crop.handleCropHandleMouseDown(e, 'se')
                        }
                      ></div>
                    </div>
                  </div>
                  <div className={styles['selfie__crop-actions']}>
                    <button
                      type="button"
                      className={styles['selfie__apply-crop']}
                      onClick={() =>
                        crop.applyCrop(
                          canvasRef as React.RefObject<HTMLCanvasElement>,
                          capturedImage,
                        )
                      }
                    >
                      <Crop size={16} aria-hidden="true" />
                      <span>Apply crop</span>
                    </button>
                    <button
                      type="button"
                      className={styles['selfie__cancel-crop']}
                      onClick={() =>
                        crop.cancelCrop(
                          canvasRef as React.RefObject<HTMLCanvasElement>,
                        )
                      }
                    >
                      <X size={16} aria-hidden="true" />
                      <span>Cancel crop</span>
                    </button>
                    <button
                      type="button"
                      className={styles['selfie__retake']}
                      onClick={retakePhoto}
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                      <span>Retake</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles['selfie__preview']}>
                  <div className={styles['selfie__image-container']}>
                    <img
                      src={capturedImage}
                      alt="Captured selfie"
                      className={styles['selfie__image']}
                    />
                  </div>
                  <div className={styles['selfie__actions']}>
                    <button
                      type="button"
                      className={styles['selfie__upload']}
                      onClick={uploadPhoto}
                      disabled={busy}
                    >
                      {busy ? 'Uploading…' : 'Upload photo'}
                    </button>
                    {!crop.hasCroppedImage && (
                      <button
                        type="button"
                        className={styles['selfie__crop-button']}
                        onClick={() =>
                          crop.startCropping(
                            canvasRef as React.RefObject<HTMLCanvasElement>,
                          )
                        }
                        disabled={busy}
                      >
                        <Crop size={16} aria-hidden="true" />
                        <span>Crop</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles['selfie__retake']}
                      onClick={retakePhoto}
                      disabled={busy}
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                      <span>Retake</span>
                    </button>
                  </div>
                </div>
              )}

              {error && <div className={styles['selfie__error']}>{error}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { Selfie };
