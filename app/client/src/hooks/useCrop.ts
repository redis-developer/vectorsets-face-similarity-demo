import { useCallback, useRef, useState } from 'react';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseCropProps {
  onCropComplete?: (croppedImageUrl: string) => void;
}

export interface UseCropReturn {
  // State
  isCropping: boolean;
  cropData: CropData;
  hasCroppedImage: boolean;
  isDragging: boolean;
  isResizing: boolean;

  // Refs
  cropCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  cropContainerRef: React.RefObject<HTMLDivElement | null>;

  // Actions
  startCropping: (canvasRef: React.RefObject<HTMLCanvasElement>) => void;
  applyCrop: (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    capturedImage: string | null,
  ) => void;
  cancelCrop: (canvasRef: React.RefObject<HTMLCanvasElement>) => void;
  resetCrop: () => void;

  // Mouse handlers
  handleCropMouseDown: (e: React.MouseEvent) => void;
  handleCropHandleMouseDown: (e: React.MouseEvent, handle: string) => void;
  handleMouseMove: (
    e: MouseEvent,
    canvasRef: React.RefObject<HTMLCanvasElement>,
  ) => void;
  handleMouseUp: () => void;
}

export const useCrop = ({
  onCropComplete,
}: UseCropProps = {}): UseCropReturn => {
  // Crop state
  const [isCropping, setIsCropping] = useState(false);
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [hasCroppedImage, setHasCroppedImage] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Refs
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);

  const startCropping = useCallback(
    (canvasRef: React.RefObject<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;

      // Initialize crop area to center 80% of the image
      const cropWidth = Math.floor(canvas.width * 0.8);
      const cropHeight = Math.floor(canvas.height * 0.8);
      const cropX = Math.floor((canvas.width - cropWidth) / 2);
      const cropY = Math.floor((canvas.height - cropHeight) / 2);

      setCropData({
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      });

      setIsCropping(true);
    },
    [],
  );

  const applyCrop = useCallback(
    (
      canvasRef: React.RefObject<HTMLCanvasElement>,
      capturedImage: string | null,
    ) => {
      if (!canvasRef.current || !cropCanvasRef.current || !capturedImage) {
        console.error(
          '❌ Canvas refs or captured image not available for cropping',
        );
        return;
      }

      const canvas = canvasRef.current;
      const cropCanvas = cropCanvasRef.current;
      const cropContext = cropCanvas.getContext('2d');

      if (!cropContext) {
        console.error('❌ Crop canvas context not available');
        return;
      }

      // Set crop canvas dimensions to crop area size
      cropCanvas.width = cropData.width;
      cropCanvas.height = cropData.height;

      // Draw the cropped portion from the original canvas
      cropContext.drawImage(
        canvas,
        cropData.x,
        cropData.y,
        cropData.width,
        cropData.height,
        0,
        0,
        cropData.width,
        cropData.height,
      );

      // Create new image URL from cropped canvas
      cropCanvas.toBlob(
        (blob) => {
          if (blob) {
            // Clean up old image URL
            if (capturedImage) {
              URL.revokeObjectURL(capturedImage);
            }

            const croppedImageUrl = URL.createObjectURL(blob);
            setIsCropping(false);
            setHasCroppedImage(true);

            if (onCropComplete) {
              onCropComplete(croppedImageUrl);
            }

            console.log('✅ Crop applied successfully');
          } else {
            console.error('❌ Failed to create blob from cropped canvas');
          }
        },
        'image/jpeg',
        0.8,
      );
    },
    [cropData, onCropComplete],
  );

  const cancelCrop = useCallback(
    (canvasRef: React.RefObject<HTMLCanvasElement>) => {
      setIsCropping(false);

      // Always reset to original full image when canceling crop
      if (cropCanvasRef.current) {
        cropCanvasRef.current.width = 0;
        cropCanvasRef.current.height = 0;
      }

      // Reset crop data to full image
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        setCropData({
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
        });
      }
    },
    [],
  );

  const resetCrop = useCallback(() => {
    setIsCropping(false);
    setCropData({ x: 0, y: 0, width: 0, height: 0 });
    setHasCroppedImage(false);

    // Clear crop canvas
    if (cropCanvasRef.current) {
      cropCanvasRef.current.width = 0;
      cropCanvasRef.current.height = 0;
    }
  }, []);

  const handleCropMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!cropContainerRef.current) return;

      const rect = cropContainerRef.current.getBoundingClientRect();

      // We need the canvas ref to calculate scale, but we can't access it directly here
      // This will be handled in the component that uses this hook
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDragging(true);
      setDragStart({
        x: x - (cropData.x * rect.width) / 100,
        y: y - (cropData.y * rect.height) / 100,
      });
      e.preventDefault();
    },
    [cropData],
  );

  const handleCropHandleMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      setIsResizing(true);
      setResizeHandle(handle);

      if (!cropContainerRef.current) return;
      const rect = cropContainerRef.current.getBoundingClientRect();
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent, canvasRef: React.RefObject<HTMLCanvasElement>) => {
      if (!cropContainerRef.current || !canvasRef.current) return;

      const rect = cropContainerRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      if (isDragging) {
        const x = (e.clientX - rect.left) * scaleX - dragStart.x;
        const y = (e.clientY - rect.top) * scaleY - dragStart.y;

        // Constrain to image bounds
        const maxX = canvasRef.current.width - cropData.width;
        const maxY = canvasRef.current.height - cropData.height;

        setCropData((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(x, maxX)),
          y: Math.max(0, Math.min(y, maxY)),
        }));
      } else if (isResizing && resizeHandle) {
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const deltaX = (currentX - dragStart.x) * scaleX;
        const deltaY = (currentY - dragStart.y) * scaleY;

        let newCropData = { ...cropData };

        switch (resizeHandle) {
          case 'nw':
            newCropData.x = Math.max(0, cropData.x + deltaX);
            newCropData.y = Math.max(0, cropData.y + deltaY);
            newCropData.width = Math.max(50, cropData.width - deltaX);
            newCropData.height = Math.max(50, cropData.height - deltaY);
            break;
          case 'ne':
            newCropData.y = Math.max(0, cropData.y + deltaY);
            newCropData.width = Math.max(
              50,
              Math.min(
                canvasRef.current.width - cropData.x,
                cropData.width + deltaX,
              ),
            );
            newCropData.height = Math.max(50, cropData.height - deltaY);
            break;
          case 'sw':
            newCropData.x = Math.max(0, cropData.x + deltaX);
            newCropData.width = Math.max(50, cropData.width - deltaX);
            newCropData.height = Math.max(
              50,
              Math.min(
                canvasRef.current.height - cropData.y,
                cropData.height + deltaY,
              ),
            );
            break;
          case 'se':
            newCropData.width = Math.max(
              50,
              Math.min(
                canvasRef.current.width - cropData.x,
                cropData.width + deltaX,
              ),
            );
            newCropData.height = Math.max(
              50,
              Math.min(
                canvasRef.current.height - cropData.y,
                cropData.height + deltaY,
              ),
            );
            break;
          default:
            break;
        }

        setCropData(newCropData);
        setDragStart({ x: currentX, y: currentY });
      }
    },
    [isDragging, isResizing, resizeHandle, dragStart, cropData],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  return {
    // State
    isCropping,
    cropData,
    hasCroppedImage,
    isDragging,
    isResizing,

    // Refs
    cropCanvasRef,
    cropContainerRef,

    // Actions
    startCropping,
    applyCrop,
    cancelCrop,
    resetCrop,

    // Mouse handlers
    handleCropMouseDown,
    handleCropHandleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
