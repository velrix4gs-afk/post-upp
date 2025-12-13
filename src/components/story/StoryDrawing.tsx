import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Undo2 } from 'lucide-react';

interface StoryDrawingProps {
  canvasWidth: number;
  canvasHeight: number;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const colors = [
  '#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00',
  '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'
];

const brushSizes = [4, 8, 12, 20];

export const StoryDrawing = ({ canvasWidth, canvasHeight, onSave, onClose }: StoryDrawingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(8);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save initial state
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialState]);
  }, []);

  const getCoords = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoords(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = color;
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save to history
    const newState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev, newState]);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length <= 1) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];
    
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-6 w-6 text-white" />
        </Button>
        <span className="text-white font-medium">Draw</span>
        <Button variant="ghost" size="icon" onClick={handleSave}>
          <Check className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="max-w-full max-h-full touch-none"
          style={{ 
            backgroundColor: 'transparent',
            width: 'min(100%, 400px)',
            height: 'auto',
            aspectRatio: `${canvasWidth}/${canvasHeight}`
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Undo */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={history.length <= 1}
            className="text-white"
          >
            <Undo2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Brush Size */}
        <div className="flex gap-3 justify-center items-center">
          {brushSizes.map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={`rounded-full bg-white transition ${
                brushSize === size ? 'ring-2 ring-primary' : ''
              }`}
              style={{ width: size + 16, height: size + 16 }}
            />
          ))}
        </div>

        {/* Colors */}
        <div className="flex gap-2 justify-center">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 ${
                color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
