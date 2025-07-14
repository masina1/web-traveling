'use client';

import React, { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

interface CityCountrySearchProps {
  onLocationSelect: (location: string) => void;
  value: string;
  placeholder?: string;
  className?: string;
}

export default function CityCountrySearch({
  onLocationSelect,
  value,
  placeholder = "e.g., Paris, France",
  className = ""
}: CityCountrySearchProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSelectedValue = useRef<string>('');
  const isSelecting = useRef<boolean>(false);

  // Initialize Google Places service
  useEffect(() => {
    const initializeServices = async () => {
      if (!window.google?.maps?.places) {
        // Load Google Places API if not already loaded
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.onload = () => {
          setupServices();
        };
        script.onerror = () => {
          console.error('❌ Failed to load Google Places API');
        };
        
        document.head.appendChild(script);
      } else {
        setupServices();
      }
    };

    const setupServices = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        console.log('✅ City/Country autocomplete service initialized');
      }
    };

    initializeServices();
  }, []);

  // Handle search with debouncing and proper prevention logic
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Don't search if we're in the middle of a selection
    if (isSelecting.current) {
      console.log('🚫 Skipping search - selection in progress');
      return;
    }

    // Don't search if this is the same value we just selected
    if (searchValue === lastSelectedValue.current) {
      console.log('🚫 Skipping search - same as last selected value:', searchValue);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      if (searchValue.trim() && autocompleteService.current) {
        console.log('🔍 Searching for cities/countries:', searchValue.trim());
        handleSearch(searchValue.trim());
      } else {
        setPredictions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchValue]);

  const handleSearch = async (value: string) => {
    if (!autocompleteService.current) {
      console.warn('⚠️ Autocomplete service not initialized');
      return;
    }

    setIsLoading(true);

    const request: google.maps.places.AutocompletionRequest = {
      input: value,
      types: ['(cities)'], // Focus on cities and administrative areas
      // No componentRestrictions - allow worldwide search
    };

    try {
      // Use the promise-based approach to avoid the callback deprecation warning
      const response = await new Promise<{
        predictions: google.maps.places.AutocompletePrediction[];
        status: google.maps.places.PlacesServiceStatus;
      }>((resolve) => {
        autocompleteService.current!.getPlacePredictions(request, (predictions, status) => {
          resolve({ predictions: predictions || [], status });
        });
      });

      setIsLoading(false);
      
      if (response.status === google.maps.places.PlacesServiceStatus.OK && response.predictions.length > 0) {
        console.log('✅ Found predictions:', response.predictions.length);
        
        // Filter and sort predictions to prioritize cities and countries
        const filteredPredictions = response.predictions.filter((prediction: google.maps.places.AutocompletePrediction) => {
          const types = prediction.types || [];
          return types.includes('locality') || 
                 types.includes('administrative_area_level_1') || 
                 types.includes('country') ||
                 types.includes('political');
        });

        setPredictions(filteredPredictions.slice(0, 5)); // Limit to 5 suggestions
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        console.log('❌ No predictions found');
        setPredictions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('❌ Error fetching predictions:', error);
      setPredictions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Clear the last selected value when user starts typing something new
    if (lastSelectedValue.current && value !== lastSelectedValue.current) {
      lastSelectedValue.current = '';
      console.log('🗑️ Cleared last selected value - user is typing new input');
    }
    
    if (!value.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    const selectedLocation = prediction.description;
    console.log('✅ Selected location:', selectedLocation);
    
    // Set the selection flag to prevent any searches
    isSelecting.current = true;
    
    // Cancel any pending search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = null;
    }
    
    // Store the selected value to prevent future searches
    lastSelectedValue.current = selectedLocation;
    
    // Hide suggestions and update UI
    setShowSuggestions(false);
    setPredictions([]);
    setSelectedIndex(-1);
    
    // Set the input value
    setSearchValue(selectedLocation);
    
    // Call the selection handler
    onLocationSelect(selectedLocation);
    
    // Reset the selection flag after a short delay
    setTimeout(() => {
      isSelecting.current = false;
      console.log('🔄 Selection flag reset');
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handleSuggestionClick(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleInputFocus = () => {
    if (predictions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
          ) : (
            <span className="text-gray-400">▼</span>
          )}
        </div>
      </div>

      {showSuggestions && predictions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <div
              key={prediction.place_id}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSuggestionClick(prediction)}
            >
              <div className="font-medium text-gray-900">
                {prediction.structured_formatting?.main_text || prediction.description}
              </div>
              {prediction.structured_formatting?.secondary_text && (
                <div className="text-sm text-gray-500">
                  {prediction.structured_formatting.secondary_text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 