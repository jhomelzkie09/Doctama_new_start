import React, { useState, useRef, useEffect } from 'react';
import { Check, Plus, X, Droplet, Eye, Loader } from 'lucide-react';

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

// Helper to get color name from hex
const getColorNameFromHex = (hex: string): string => {
  const color = predefinedColors.find(c => 
    c.value.toLowerCase() === hex.toLowerCase()
  );
  if (color) return color.name;
  
  // Generate a name for custom colors
  const customColorNames: { [key: string]: string } = {
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
    '#2C3E50': 'Dark Navy',
    '#E74C3C': 'Vibrant Red',
    '#27AE60': 'Forest Green',
    '#F39C12': 'Amber',
    '#9B59B6': 'Deep Purple',
  };
  
  return customColorNames[hex] || hex;
};

// Helper to convert RGB to Hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const ColorSelector: React.FC<ColorSelectorProps> = ({ colors, onChange }) => {
  const [customColor, setCustomColor] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [pickedColorName, setPickedColorName] = useState<string>('');
  const dropperRef = useRef<HTMLDivElement>(null);

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

  // Start color picking mode
  const startColorPicking = () => {
    setIsPickingColor(true);
    setPickedColor(null);
    
    // Change cursor to crosshair
    document.body.style.cursor = 'crosshair';
    document.body.style.userSelect = 'none';
  };

  // Handle color pick from screen
  useEffect(() => {
    if (!isPickingColor) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Preview color under cursor (optional - shows tooltip)
      const x = e.clientX;
      const y = e.clientY;
      
      // Get element at position for potential tooltip
      const element = document.elementFromPoint(x, y);
      if (element && element !== dropperRef.current) {
        // Optional: Show color preview near cursor
        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          // You could show a tooltip here if desired
        }
      }
    };

    const handleClick = async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        // Check if EyeDropper API is supported
        if ('EyeDropper' in window) {
          // Use native EyeDropper API (Chrome/Edge)
          const eyeDropper = new (window as any).EyeDropper();
          const result = await eyeDropper.open();
          const hexColor = result.sRGBHex;
          
          const colorName = getColorNameFromHex(hexColor);
          setPickedColor(hexColor);
          setPickedColorName(colorName);
          
          // Add the picked color
          if (!colors.includes(colorName)) {
            onChange([...colors, colorName]);
          }
        } else {
          // Fallback: Use canvas to get pixel color at cursor
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            alert('Color picking not supported. Please use a modern browser.');
            return;
          }
          
          // Capture screenshot of the viewport
          const screenshot = await (window as any).domtoimage?.toJpeg(document.body, { quality: 0.8 });
          
          if (screenshot) {
            const img = new Image();
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              
              const x = e.clientX;
              const y = e.clientY;
              const pixel = ctx.getImageData(x, y, 1, 1).data;
              const hexColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
              const colorName = getColorNameFromHex(hexColor);
              
              setPickedColor(hexColor);
              setPickedColorName(colorName);
              
              if (!colors.includes(colorName)) {
                onChange([...colors, colorName]);
              }
            };
            img.src = screenshot;
          } else {
            alert('Click on any color to pick it from the page');
          }
        }
      } catch (error) {
        // User cancelled the eye dropper
        console.log('Color picking cancelled');
      } finally {
        // Exit picking mode
        setIsPickingColor(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPickingColor(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPickingColor, colors, onChange]);

  return (
    <div className="space-y-4" ref={dropperRef}>
      {/* Color Picker / Eyedropper Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">Pick Color from Screen</span>
        </div>
        
        <p className="text-xs text-gray-500 mb-3">
          Click the button below, then click anywhere on the page to pick a color
        </p>
        
        {!isPickingColor ? (
          <button
            type="button"
            onClick={startColorPicking}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            <Droplet className="w-4 h-4" />
            Pick Color from Screen
          </button>
        ) : (
          <div className="text-center p-3 bg-purple-100 rounded-lg">
            <Loader className="w-5 h-5 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-purple-700 font-medium">Color picking mode active</p>
            <p className="text-xs text-purple-600 mt-1">Click anywhere to pick a color, or press ESC to cancel</p>
          </div>
        )}
        
        {/* Show last picked color */}
        {pickedColor && !isPickingColor && (
          <div className="mt-3 p-2 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: pickedColor }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{pickedColorName}</p>
                <p className="text-xs text-gray-500">{pickedColor}</p>
              </div>
              <span className="text-xs text-green-600">✓ Added</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Colors */}
      {colors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Colors ({colors.length})
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 border border-gray-100 rounded-lg bg-gray-50">
            {colors.map((color) => {
              // Find the hex value for the color name
              const colorHex = predefinedColors.find(c => c.name === color)?.value || '#CCCCCC';
              return (
                <div
                  key={color}
                  className="flex items-center gap-1 px-3 py-1 bg-white rounded-full shadow-sm"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className="text-sm text-gray-700">{color}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Instructions for native EyeDropper */}
      <div className="text-xs text-gray-400 border-t pt-3 mt-2">
        <p>💡 <strong>Tip:</strong> Click "Pick Color from Screen" then click any color on the page to add it instantly.</p>
        <p className="mt-1">🎨 Supports native EyeDropper in Chrome/Edge browsers for best experience.</p>
      </div>
    </div>
  );
};

export default ColorSelector;