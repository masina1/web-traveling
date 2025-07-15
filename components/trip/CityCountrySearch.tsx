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
  // Use inputValue for the input field, searchQuery only for triggering search
  const [inputValue, setInputValue] = useState(value);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSelectingRef = useRef(false); // Flag to prevent input change from triggering search during selection

  // Initialize Google Places service
  useEffect(() => {
    const initializeServices = async () => {
      if (!window.google?.maps?.places) {
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

  // ONLY search based on searchQuery, not displayValue
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!searchQuery.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    console.log('🔍 Searching for:', searchQuery);
    
    searchTimeout.current = setTimeout(() => {
      if (autocompleteService.current) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]); // Only depends on searchQuery

  const handleSearch = async (query: string) => {
    if (!autocompleteService.current) {
      console.warn('⚠️ Autocomplete service not initialized');
      return;
    }

    setIsLoading(true);

    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      types: ['(cities)'],
    };

    try {
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
        
        const filteredPredictions = response.predictions.filter((prediction: google.maps.places.AutocompletePrediction) => {
          const types = prediction.types || [];
          // Only allow cities and countries
          return types.includes('locality') || types.includes('country');
        });

        setPredictions(filteredPredictions.slice(0, 5));
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

  // Only update searchQuery on user typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchQuery(newValue); // Only here!
  };

  // On suggestion click, set inputValue but do NOT update searchQuery
  const handleSuggestionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    const selectedLocation = prediction.description;
    setInputValue(selectedLocation);
    setSearchQuery(''); // Clear searchQuery so no search is triggered
    setShowSuggestions(false);
    setPredictions([]);
    setSelectedIndex(-1);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = null;
    }
    onLocationSelect(selectedLocation);
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
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleInputFocus = () => {
    if (predictions.length > 0 && searchQuery.trim()) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
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