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
      // Check if Google Maps is already loaded
      if (!window.google?.maps?.places) {
        // Load Google Maps if not already loaded
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error('❌ Google Places API key not found. Please set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY in your .env.local file');
          return;
        }

        console.log('🔑 Using API key:', apiKey.substring(0, 20) + '...');
        console.log('📍 Loading Google Maps with Places API...');

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('✅ Google Maps API loaded successfully');
          initializeServices();
        };
        
        script.onerror = () => {
          console.error('❌ Failed to load Google Maps API.');
          console.error('🔧 Make sure you have enabled both:');
          console.error('1. Places API (legacy) - for JavaScript library');
          console.error('2. Places API (New) - for new features');
          console.error('3. Maps JavaScript API - for maps');
        };
        
        document.head.appendChild(script);
        return;
      }

      // Initialize services
      try {
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
        console.log('✅ Google Places services initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing Google Places services:', error);
      }
    };

    initializeServices();
  }, []);

  // Debounced search function
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search input with debouncing
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setSelectedIndex(-1);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!value.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    // Check if services are ready
    if (!autocompleteService.current) {
      console.warn('AutocompleteService not initialized yet');
      return;
    }

    setIsLoading(true);

    // Debounce the search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const request: google.maps.places.AutocompletionRequest = {
          input: value,
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: [] }, // Allow all countries
        };

        autocompleteService.current!.getPlacePredictions(request, (predictions, status) => {
          setIsLoading(false);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions.slice(0, 5)); // Limit to 5 suggestions
            setShowSuggestions(true);
            console.log('✅ Found', predictions.length, 'predictions');
          } else {
            setPredictions([]);
            setShowSuggestions(false);
            
            // Enhanced error logging
            console.error('❌ Places API error:', {
              status: status,
              statusText: google.maps.places.PlacesServiceStatus[status],
              input: value
            });
            
            if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
              console.error('🔧 To fix REQUEST_DENIED:');
              console.error('1. Enable "Places API" (legacy) in Google Cloud Console');
              console.error('2. Enable billing for your project');
              console.error('3. Check API key restrictions');
              console.error('4. Restart your dev server');
            }
          }
        });
      } catch (error) {
        console.error('❌ Error fetching predictions:', error);
        setIsLoading(false);
        setPredictions([]);
        setShowSuggestions(false);
      }
    }, 300);
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
          // Create destination object
          const newDestination: Destination = {
            id: crypto.randomUUID(),
            tripId: tripId,
            locationName: place.name || description,
            address: place.formatted_address || '',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            day: selectedDay,
            notes: '',
            orderIndex: 1, // Will be adjusted by parent component
            placeId: place.place_id,
            category: place.types?.[0] || 'place',
            rating: place.rating,
            priceLevel: place.price_level,
            photos: place.photos?.slice(0, 3).map(photo => 
              photo.getUrl({ maxWidth: 400, maxHeight: 300 })
            ) || [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          console.log('✅ Selected place:', newDestination);
          onLocationSelect(newDestination);
          setSearchValue('');
          setShowSuggestions(false);
        } else {
          console.error('❌ Place details error:', status);
          setSearchValue('');
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('❌ Error selecting place:', error);
      setSearchValue('');
      setShowSuggestions(false);
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => {
            e.preventDefault();
            handleSearch(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowSuggestions(true);
            } else if (searchValue.trim() && autocompleteService.current) {
              // Trigger search if there's a value but no predictions
              handleSearch(searchValue);
            }
          }}
          placeholder={placeholder}
          className="input-field pr-10"
          disabled={false}
          autoComplete="off"
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
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 mt-1 max-h-64 overflow-y-auto z-50"
        >
          {isLoading && (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent mx-auto mb-2"></div>
              <span className="text-sm">Searching...</span>
            </div>
          )}
          
          {!isLoading && predictions.length === 0 && searchValue.trim() && (
            <div className="px-4 py-3 text-center text-gray-500">
              <span className="text-sm">No places found</span>
            </div>
          )}
          
          {!isLoading && predictions.length > 0 && predictions.map((prediction, index) => (
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
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {prediction.structured_formatting?.secondary_text || ''}
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