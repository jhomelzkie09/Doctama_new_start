import React, { useState, useRef } from 'react';
import { Check, Plus, X, Droplet, Upload, Camera, Loader } from 'lucide-react';

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
  { name: 'Orange', value: '#F97316' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Black', value: '#111827' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Brown', value: '#8B4513' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Navy', value: '#000080' },
  { name: 'Maroon', value: '#800000' },
  { name: 'Olive', value: '#808000' },
  { name: 'Coral', value: '#FF7F50' },
  { name: 'Lavender', value: '#E6E6FA' },
];

// Helper function to get color name from hex
const getColorName = (hex: string): string => {
  const color = predefinedColors.find(c => 
    c.value.toLowerCase() === hex.toLowerCase()
  );
  if (color) return color.name;
  
  // Generate a name for custom colors
  const customColors: { [key: string]: string } = {
    '#FF6B6B': 'Light Red',
    '#4ECDC4': 'Mint',
    '#45B7D1': 'Sky Blue',
    '#96CEB4': 'Sage',
    '#FFEAA7': 'Cream',
    '#DDA0DD': 'Plum',
    '#98D8C8': 'Seafoam',
    '#F7DC6F': 'Gold',
    '#E8D5B7': 'Wheat',
    '#C39BD3': 'Orchid',
  };
  
  return customColors[hex] || hex;
};

// Helper to extract prominent colors from image
const extractColorsFromImage = (imageUrl: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Sample pixels at intervals to avoid performance issues
      const step = Math.max(1, Math.floor((canvas.width * canvas.height) / 5000));
      const colorCounts: { [key: string]: number } = {};
      
      for (let i = 0; i < pixels.length; i += step * 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        // Skip transparent pixels
        if (a < 128) continue;
        
        // Quantize colors to reduce variation
        const quantizedR = Math.round(r / 32) * 32;
        const quantizedG = Math.round(g / 32) * 32;
        const quantizedB = Math.round(b / 32) * 32;
        
        const hex = `#${((1 << 24) + (quantizedR << 16) + (quantizedG << 8) + quantizedB).toString(16).slice(1)}`;
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
      
      // Sort colors by frequency and get top 5
      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => getColorName(color));
      
      resolve(sortedColors);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
};

const ColorSelector: React.FC<ColorSelectorProps> = ({ colors, onChange }) => {
  const [customColor, setCustomColor] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setExtractError('Please upload an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setExtractError('Image too large (max 5MB)');
      return;
    }
    
    setIsExtracting(true);
    setExtractError('');
    
    try {
      // Create object URL for preview
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      
      // Extract colors from the image
      const extractedColors = await extractColorsFromImage(imageUrl);
      
      // Add extracted colors that aren't already in the list
      const newColors = extractedColors.filter(color => !colors.includes(color));
      if (newColors.length > 0) {
        onChange([...colors, ...newColors]);
      } else if (extractedColors.length === 0) {
        setExtractError('No distinct colors found in the image');
      } else {
        setExtractError('All extracted colors are already in your list');
      }
    } catch (error) {
      console.error('Error extracting colors:', error);
      setExtractError('Failed to extract colors from image');
    } finally {
      setIsExtracting(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearSelectedImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected Colors */}
      {colors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Colors ({colors.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <div
                key={color}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full"
              >
                <span
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700">{color}</span>
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  className="ml-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color Dropper / Image Upload Section */}
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Droplet className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">Extract Colors from Image</span>
        </div>
        
        <p className="text-xs text-gray-500 mb-3">
          Upload a product image to automatically detect and add its colors
        </p>
        
        <div className="flex flex-col gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isExtracting ? 'Extracting Colors...' : 'Upload Image to Extract Colors'}
          </button>
          
          {/* Preview and error */}
          {selectedImage && (
            <div className="relative mt-2">
              <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                />
                <span className="text-xs text-gray-600 flex-1">Image loaded for color extraction</span>
                <button
                  onClick={clearSelectedImage}
                  className="p-1 text-gray-400 hover:text-red-500 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {extractError && (
            <p className="text-xs text-red-500 mt-2">{extractError}</p>
          )}
        </div>
      </div>

      {/* Predefined Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or choose from predefined colors
        </label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
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
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
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
              placeholder="Enter color name (e.g., Midnight Blue)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCustomColor();
                }
              }}
            />
            <button
              type="button"
              onClick={addCustomColor}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                setCustomColor('');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
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