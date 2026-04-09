import React, { useState } from 'react';
import { Pipette, X } from 'lucide-react';

interface ColorSelectorProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

const ColorSelector: React.FC<ColorSelectorProps> = ({ colors, onChange }) => {
  const [isPicking, setIsPicking] = useState(false);
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
      const hex = result.sRGBHex.toUpperCase();
      if (!colors.includes(hex)) {
        onChange([...colors, hex]);
      }
    } catch {
      // User cancelled
    } finally {
      setIsPicking(false);
    }
  };

  const removeColor = (hex: string) => {
    onChange(colors.filter((c) => c !== hex));
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

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((hex) => (
            <div
              key={hex}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full border border-gray-200 bg-white"
            >
              <div
                className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: hex }}
              />
              <span className="text-xs font-mono text-gray-700">{hex}</span>
              <button
                type="button"
                onClick={() => removeColor(hex)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorSelector;