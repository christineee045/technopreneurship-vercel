import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImage: string) => Promise<void>;
  imageSrc: string;
}

const CANVAS_SIZE = 300;

export function AvatarCropModal({ isOpen, onClose, onSave, imageSrc }: AvatarCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [minZoom, setMinZoom] = useState(1);

  useEffect(() => {
    if (isOpen && imageSrc && imageRef.current) {
      const img = imageRef.current;
      
      const handleLoad = () => {
        // Calculate minimum zoom to fit image in canvas
        const maxDim = Math.max(img.width, img.height);
        const initialZoom = CANVAS_SIZE / maxDim;
        setMinZoom(initialZoom);
        setZoom(initialZoom);
        setOffsetX(0);
        setOffsetY(0);
        drawImage();
      };

      img.onload = handleLoad;
      img.src = imageSrc;

      if (img.complete) {
        handleLoad();
      }
    }
  }, [isOpen, imageSrc]);

  const drawImage = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const img = imageRef.current;
    const imgWidth = img.width * zoom;
    const imgHeight = img.height * zoom;

    // Center the image if it's smaller than canvas
    const centerOffsetX = Math.max(0, (CANVAS_SIZE - imgWidth) / 2);
    const centerOffsetY = Math.max(0, (CANVAS_SIZE - imgHeight) / 2);

    ctx.drawImage(img, offsetX + centerOffsetX, offsetY + centerOffsetY, imgWidth, imgHeight);

    // Draw circle
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    drawImage();
  }, [zoom, offsetX, offsetY]);

  const handleSave = async () => {
    if (!canvasRef.current) return;

    setIsSaving(true);
    try {
      const croppedImage = canvasRef.current.toDataURL('image/jpeg', 0.9);
      await onSave(croppedImage);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Crop Your Profile Picture</h2>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Drag to move, use zoom to adjust</p>
            <div
              className="bg-gray-100 rounded-lg overflow-hidden cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
              />
            </div>
            <img ref={imageRef} className="hidden" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(minZoom, zoom - 0.2))}
                className="p-2 hover:bg-gray-100 rounded"
                disabled={isSaving}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={minZoom}
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1"
                disabled={isSaving}
              />
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                className="p-2 hover:bg-gray-100 rounded"
                disabled={isSaving}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">Zoom: {zoom.toFixed(1)}x</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Picture'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
