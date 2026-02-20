import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';

interface ColorSelectorProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

const predefinedColors = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Black', value: '#111827' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Brown', value: '#8B4513' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Navy', value: '#000080' },
];

const ColorSelector: React.FC<ColorSelectorProps> = ({ colors, onChange }) => {
  const [customColor, setCustomColor] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const addColor = (color: string) => {
    if (!colors.includes(color)) {
      onChange([...colors, color]);
    }
  };

  const removeColor = (color: string) => {
    onChange(colors.filter(c => c !== color));
  };

  const addCustomColor = () => {
    if (customColor && !colors.includes(customColor)) {
      onChange([...colors, customColor]);
      setCustomColor('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Colors */}
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <div
            key={color}
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-700">{color}</span>
            <button
              onClick={() => removeColor(color)}
              className="ml-1 text-gray-500 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Predefined Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose from predefined colors
        </label>
        <div className="flex flex-wrap gap-2">
          {predefinedColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => addColor(color.name)}
              className={`group relative w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                colors.includes(color.name) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {colors.includes(color.name) && (
                <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Input */}
      <div>
        {!showCustomInput ? (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add custom color
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="Enter color name"
              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addCustomColor}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowCustomInput(false)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorSelector;