import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader, Search, X } from 'lucide-react';

interface AddressPrediction {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
    barangay?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, addressData?: any) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

// Philippine cities and regions for local fallback
const philippineLocations = [
  // Metro Manila
  'Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Mandaluyong', 'San Juan',
  'Caloocan', 'Malabon', 'Navotas', 'Valenzuela', 'Marikina', 'Pasay', 'Parañaque',
  'Las Piñas', 'Muntinlupa', 'Pateros',
  // Luzon
  'Baguio', 'Angeles', 'San Fernando (Pampanga)', 'Olongapo', 'Batangas City', 'Lucena',
  'Naga City', 'Legazpi', 'Tuguegarao', 'Cabanatuan', 'Tarlac City', 'Dagupan',
  // Visayas
  'Cebu City', 'Mandaue', 'Lapu-Lapu City', 'Iloilo City', 'Bacolod', 'Tacloban',
  'Roxas City', 'Tagbilaran', 'Dumaguete', 'Ormoc',
  // Mindanao
  'Davao City', 'Zamboanga City', 'Cagayan de Oro', 'General Santos', 'Butuan',
  'Cotabato City', 'Pagadian', 'Koronadal', 'Surigao City', 'Dipolog'
];

const PhilippineAddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter your address",
  className = "",
  error
}) => {
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(value || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // ✅ Fixed: Added null as initial value
  const inputRef = useRef<HTMLInputElement | null>(null); // ✅ Fixed: Added null as initial value

  // Sync searchTerm with value prop when it changes externally
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value || '');
    }
  }, [value, searchTerm]);

  // Parse address to extract components
  const parseAddressComponents = (prediction: AddressPrediction): {
    barangay?: string;
    city?: string;
    province?: string;
    zipCode?: string;
  } => {
    const addr = prediction.address;
    return {
      barangay: addr?.neighbourhood || addr?.suburb || addr?.barangay,
      city: addr?.city || addr?.town || addr?.municipality,
      province: addr?.state,
      zipCode: addr?.postcode
    };
  };

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ', Philippines'
        )}&limit=5&addressdetails=1&countrycodes=ph&accept-language=en`,
        {
          headers: {
            'User-Agent': 'DoctamaMarketing/1.0'
          }
        }
      );
      
      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        setPredictions(data);
        setShowPredictions(true);
      } else {
        // Fallback to local city search
        const filteredLocations = philippineLocations.filter(location =>
          location.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filteredLocations.length > 0) {
          const localPredictions: AddressPrediction[] = filteredLocations.map(location => ({
            display_name: location,
            lat: '',
            lon: '',
            address: { 
              city: location, 
              country: 'Philippines' 
            }
          }));
          setPredictions(localPredictions);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      // Fallback to local search on error
      const filteredLocations = philippineLocations.filter(location =>
        location.toLowerCase().includes(query.toLowerCase())
      );
      
      if (filteredLocations.length > 0) {
        const localPredictions: AddressPrediction[] = filteredLocations.map(location => ({
          display_name: location,
          lat: '',
          lon: '',
          address: { 
            city: location, 
            country: 'Philippines' 
          }
        }));
        setPredictions(localPredictions);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    
    // Debounce search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (newValue.length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        searchAddress(newValue);
      }, 500);
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePredictionClick = (prediction: AddressPrediction) => {
    const fullAddress = prediction.display_name;
    const components = parseAddressComponents(prediction);
    
    setSearchTerm(fullAddress);
    onChange(fullAddress, {
      fullAddress,
      ...components
    });
    setShowPredictions(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setPredictions([]);
    setShowPredictions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>
      
      {/* Predictions Dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {predictions.map((prediction, index) => (
            <button
              key={index}
              onClick={() => handlePredictionClick(prediction)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-start gap-3 border-b border-gray-100 last:border-0"
              type="button"
            >
              <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 break-words">{prediction.display_name}</p>
                {prediction.address?.city && (
                  <p className="text-xs text-gray-400 mt-1">
                    {prediction.address.city}
                    {prediction.address.state && `, ${prediction.address.state}`}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default PhilippineAddressAutocomplete;