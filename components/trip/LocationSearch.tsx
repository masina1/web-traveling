'use client';

import { useState, useEffect, useRef } from 'react';
import { Destination } from '@/types';

interface LocationSearchProps {
  onLocationSelect: (destination: Destination) => void;
  selectedDay: number;
  tripId: string;
  placeholder?: string;
  className?: string;
}

export default function LocationSearch({
  onLocationSelect,
  selectedDay,
  tripId,
  placeholder = "Search for places...",
  className = ""
}: LocationSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize Google Places services
  useEffect(() => {
    const initializeServices = async () => {
      if (!window.google?.maps?.places) {
        // Load Google Maps if not already loaded
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          initializeServices();
        };
        
        document.head.appendChild(script);
        return;
      }

      autocompleteService.current = new google.maps.places.AutocompleteService();
      
      // Create a hidden div for PlacesService
      const mapDiv = document.createElement('div');
      mapDiv.style.display = 'none';
      document.body.appendChild(mapDiv);
      
      const map = new google.maps.Map(mapDiv, {
        center: { lat: 0, lng: 0 },
        zoom: 1
      });
      
      placesService.current = new google.maps.places.PlacesService(map);
    };

    initializeServices();
  }, []);

  // Handle search input
  const handleSearch = async (value: string) => {
    setSearchValue(value);
    setSelectedIndex(-1);
    
    if (!value.trim() || !autocompleteService.current) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: value,
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: [] }, // Allow all countries
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions.slice(0, 5)); // Limit to 5 suggestions
          setShowSuggestions(true);
        } else {
          setPredictions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setIsLoading(false);
      setPredictions([]);
      setShowSuggestions(false);
    }
  };

  // Handle place selection
  const handlePlaceSelect = async (placeId: string, description: string) => {
    if (!placesService.current) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setSearchValue(description);

    try {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'types',
          'rating',
          'price_level',
          'photos'
        ]
      };

      placesService.current.getDetails(request, (place, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const destination: Destination = {
            id: '', // Will be set by server
            tripId,
            locationName: place.name || description,
            address: place.formatted_address || description,
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            day: selectedDay,
            orderIndex: 1, // Will be adjusted by parent component
            placeId: place.place_id,
            rating: place.rating,
            priceLevel: place.price_level,
            category: place.types?.[0] || 'place',
            photos: place.photos?.slice(0, 3).map(photo => 
              photo.getUrl({ maxWidth: 400, maxHeight: 300 })
            ) || [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          onLocationSelect(destination);
          setSearchValue(''); // Clear search after selection
        }
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || predictions.length === 0) return;

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
          const prediction = predictions[selectedIndex];
          handlePlaceSelect(prediction.place_id, prediction.description);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="input-field pr-10"
          disabled={isLoading}
        />
        
        {/* Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
          ) : (
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && predictions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 mt-1 max-h-64 overflow-y-auto z-50"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 