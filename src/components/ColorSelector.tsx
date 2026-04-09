import React, { useState } from 'react';
import { Pipette } from 'lucide-react';

interface ColorSelectorProps {
  color: string | null;
  onChange: (color: string) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ color, onChange }) => {
  const [isPicking, setIsPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  const pickColor = async () => {
    if (!('EyeDropper' in window)) {
      setUnsupported(true);
      return;
    }

    setIsPicking(true);
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
    } catch {
      // User cancelled
    } finally {
      setIsPicking(false);
    }
  };

  const copyColor = () => {
    if (!color) return;
    navigator.clipboard.writeText(color.toUpperCase()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };

  if (unsupported) {
    return (
      <p className="text-sm text-gray-500">
        EyeDropper requires Chrome or Edge 95+.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={pickColor}
        disabled={isPicking}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        <Pipette className="w-4 h-4" />
        {isPicking ? 'Click anywhere to sample…' : 'Pick color from screen'}
      </button>

      {color && !isPicking && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white">
          <div
            className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 font-mono">
              {color.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500 font-mono">{hexToRgb(color)}</p>
          </div>
          <button
            type="button"
            onClick={copyColor}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ColorSelector;