'use client';

import { useState, useEffect, useRef } from 'react';
import { Trip, Destination, TripDay } from '@/types';

interface SmartRecommendationsProps {
  trip: Trip;
  tripDays: TripDay[];
  selectedDay: number;
  onDestinationAdd: (destination: Destination) => void;
  existingDestinations: Destination[];
}

interface RecommendationItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  description: string;
  source: 'places' | 'curated';
  placeId?: string;
  isCurated?: boolean; // Added for curated recommendations
  photo?: string; // Added for photo URL
}

// Curated recommendations based on location and context
const CURATED_RECOMMENDATIONS = {
  tokyo: [
    {
      name: 'Senso-ji Temple',
      address: '2-3-1 Asakusa, Taito City, Tokyo',
      lat: 35.7148,
      lng: 139.7967,
      category: 'tourist_attraction',
      description: 'Ancient Buddhist temple and Tokyo\'s oldest temple',
      photo: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop',
    },
    {
      name: 'Shibuya Crossing',
      address: 'Shibuya City, Tokyo',
      lat: 35.6598,
      lng: 139.7006,
      category: 'point_of_interest',
      description: 'Famous scramble crossing and bustling district',
      photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
    },
    {
      name: 'Tsukiji Outer Market',
      address: 'Tsukiji, Chuo City, Tokyo',
      lat: 35.6654,
      lng: 139.7707,
      category: 'food',
      description: 'Fresh seafood market with street food',
      photo: 'https://images.unsplash.com/photo-1554797589-7241bb691973?w=400&h=300&fit=crop',
    },
  ],
  paris: [
    {
      name: 'Eiffel Tower',
      address: 'Champ de Mars, 5 Avenue Anatole France, Paris',
      lat: 48.8584,
      lng: 2.2945,
      category: 'tourist_attraction',
      description: 'Iconic iron lattice tower and symbol of Paris',
      photo: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&h=300&fit=crop',
    },
    {
      name: 'Louvre Museum',
      address: 'Rue de Rivoli, Paris',
      lat: 48.8606,
      lng: 2.3376,
      category: 'museum',
      description: 'World\'s largest art museum and historic monument',
      photo: 'https://images.unsplash.com/photo-1564399580075-5dfe19c205f3?w=400&h=300&fit=crop',
    },
  ],
  london: [
    {
      name: 'Big Ben',
      address: 'Westminster, London',
      lat: 51.5007,
      lng: -0.1246,
      category: 'tourist_attraction',
      description: 'Famous clock tower at Palace of Westminster',
      photo: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
    },
    {
      name: 'Tower Bridge',
      address: 'Tower Bridge Rd, London',
      lat: 51.5055,
      lng: -0.0754,
      category: 'tourist_attraction',
      description: 'Victorian Gothic bascule and suspension bridge',
      photo: 'https://images.unsplash.com/photo-1515920892043-e8b3b7b13bee?w=400&h=300&fit=crop',
    },
  ],
};

export default function SmartRecommendations({
  trip,
  tripDays,
  selectedDay,
  onDestinationAdd,
  existingDestinations,
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Google Places service
  useEffect(() => {
    const initPlacesService = () => {
      if (window.google?.maps?.places) {
        const mapDiv = document.createElement('div');
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);
        
        const map = new google.maps.Map(mapDiv, {
          center: { lat: 0, lng: 0 },
          zoom: 1
        });
        
        placesService.current = new google.maps.places.PlacesService(map);
      }
    };

    if (window.google?.maps?.places) {
      initPlacesService();
    } else {
      // Wait for Google Maps to load
      const checkGoogle = () => {
        if (window.google?.maps?.places) {
          initPlacesService();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
    }
  }, []);

  // Generate recommendations based on existing destinations and trip context
  useEffect(() => {
    generateRecommendations();
  }, [selectedDay, existingDestinations, trip]);

  const generateRecommendations = async () => {
    if (!existingDestinations.length) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newRecommendations: RecommendationItem[] = [];
      
      // Get curated recommendations based on trip location
      const curatedRecs = getCuratedRecommendations();
      newRecommendations.push(...curatedRecs);
      
      // Get Google Places recommendations near existing destinations
      if (placesService.current) {
        const placesRecs = await getPlacesRecommendations();
        newRecommendations.push(...placesRecs);
      }
      
      // Filter out destinations that already exist in the trip
      const filteredRecs = newRecommendations.filter(rec => 
        !existingDestinations.some(dest => 
          Math.abs(dest.lat - rec.lat) < 0.001 && 
          Math.abs(dest.lng - rec.lng) < 0.001
        )
      );
      
      // Sort by rating and remove duplicates
      const uniqueRecs = filteredRecs.reduce((acc, current) => {
        const exists = acc.find(item => 
          item.name === current.name || 
          (Math.abs(item.lat - current.lat) < 0.0001 && Math.abs(item.lng - current.lng) < 0.0001)
        );
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, [] as RecommendationItem[]);
      
      setRecommendations(uniqueRecs.slice(0, 12)); // Limit to 12 recommendations
      
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getCuratedRecommendations = (): RecommendationItem[] => {
    const location = trip.location.toLowerCase();
    const curated: RecommendationItem[] = [];
    
    // Check if trip location matches any curated locations
    Object.entries(CURATED_RECOMMENDATIONS).forEach(([city, recs]) => {
      if (location.includes(city)) {
        recs.forEach((rec, index) => {
          curated.push({
            id: `curated-${city}-${index}`,
            ...rec,
            source: 'curated',
            isCurated: true,
            photo: rec.photo, // Use the photo URL from curated data
          });
        });
      }
    });
    
    return curated;
  };

  const getPlacesRecommendations = (): Promise<RecommendationItem[]> => {
    return new Promise((resolve) => {
      if (!placesService.current || !existingDestinations.length) {
        resolve([]);
        return;
      }

      const recommendations: RecommendationItem[] = [];
      let completedSearches = 0;
      const totalSearches = Math.min(existingDestinations.length, 3); // Limit API calls
      
      if (totalSearches === 0) {
        resolve([]);
        return;
      }

      // Search near each existing destination
      existingDestinations.slice(0, 3).forEach((destination, index) => {
        const request: google.maps.places.PlaceSearchRequest = {
          location: new google.maps.LatLng(destination.lat, destination.lng),
          radius: 2000, // 2km radius
          type: 'tourist_attraction',
        };

        placesService.current!.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.slice(0, 4).forEach((place, placeIndex) => {
              if (place.geometry?.location && place.name) {
                recommendations.push({
                  id: `places-${index}-${placeIndex}`,
                  name: place.name,
                  address: place.vicinity || place.formatted_address || '',
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                  category: place.types?.[0] || 'tourist_attraction',
                  rating: place.rating,
                  priceLevel: place.price_level,
                  photos: place.photos?.slice(0, 1).map(photo => 
                    photo.getUrl({ maxWidth: 300, maxHeight: 200 })
                  ) || [],
                  description: `Popular ${place.types?.[0]?.replace(/_/g, ' ') || 'attraction'} near ${destination.locationName}`,
                  source: 'places',
                  placeId: place.place_id,
                  isCurated: false,
                  photo: place.photos?.[0]?.getUrl({ maxWidth: 300, maxHeight: 200 }),
                });
              }
            });
          }
          
          completedSearches++;
          if (completedSearches === totalSearches) {
            resolve(recommendations);
          }
        });
      });
    });
  };

  const handleAddRecommendation = (rec: RecommendationItem) => {
    const selectedDayData = tripDays.find(d => d.day === selectedDay);
    
    const photos = (rec.photos && rec.photos.length > 0)
      ? rec.photos
      : (rec.photo ? [rec.photo] : []);
    const newDestination: Destination = {
      id: crypto.randomUUID(),
      tripId: trip.id,
      locationName: rec.name,
      address: rec.address,
      lat: rec.lat,
      lng: rec.lng,
      day: selectedDay,
      orderIndex: (selectedDayData?.destinations.length || 0) + 1,
      notes: rec.description,
      placeId: rec.placeId,
      category: rec.category,
      rating: rec.rating,
      priceLevel: rec.priceLevel,
      photos,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    onDestinationAdd(newDestination);
  };

  // Check scroll position and update arrow visibility
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };



  const categories = [
    { value: 'all', label: 'All' },
    { value: 'tourist_attraction', label: 'Attractions' },
    { value: 'restaurant', label: 'Restaurants' },
    { value: 'museum', label: 'Museums' },
    { value: 'shopping_mall', label: 'Shopping' },
    { value: 'park', label: 'Parks' },
  ];

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  // Update arrow visibility when recommendations, category, or expansion state change
  useEffect(() => {
    if (isExpanded && scrollContainerRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        handleScroll();
      }, 100);
    } else {
      // Hide arrows when collapsed
      setShowLeftArrow(false);
      setShowRightArrow(false);
    }
  }, [recommendations, selectedCategory, isExpanded]);

  if (!existingDestinations.length) {
    return (
      <div className="p-4 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm">Add destinations to see smart recommendations</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-sm text-gray-600">Finding recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Category Filter - Hidden for now */}
      <div className="hidden p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Recommended places</h3>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="attractions">Attractions</option>
            <option value="restaurants">Restaurants</option>
            <option value="museums">Museums</option>
            <option value="shopping">Shopping</option>
            <option value="parks">Parks</option>
          </select>
        </div>
      </div>

      {/* Collapsible Header */}
      <div className="px-3 py-2 border-b border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center w-full text-left hover:bg-gray-50 transition-colors rounded-md p-1 -m-1"
        >
          <h3 className="text-sm font-medium text-gray-700">Recommended places</h3>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Horizontal Scrollable Cards - Much Smaller */}
      {isExpanded && (
        <div className="px-2 pt-2 pb-3">
          {filteredRecommendations.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-xs">No recommendations found.</p>
            </div>
          ) : (
            <div className="relative">
            <div 
              ref={scrollContainerRef}
              className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              onScroll={handleScroll}
            >
              {filteredRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-md hover:shadow-sm transition-shadow"
                >
                  {/* Horizontal Layout: Square image + Content rectangle */}
                  <div className="flex h-24">
                    {/* Square Image */}
                    <div className="w-24 h-24 bg-gray-200 rounded-l-md overflow-hidden flex-shrink-0">
                      {rec.photo ? (
                        <img
                          src={rec.photo}
                          alt={rec.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content Rectangle - Much Longer */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-xs truncate">{rec.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{rec.description}</p>
                        
                        {/* Rating and Curated badge on same line */}
                        <div className="flex items-center justify-between mt-2">
                          {rec.rating && (
                            <div className="flex items-center">
                              <svg className="w-2.5 h-2.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="ml-0.5 text-xs text-gray-600">{rec.rating}</span>
                            </div>
                          )}
                          
                          {/* Curated badge - Smaller */}
                          {rec.isCurated && (
                            <span className="inline-block px-1 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                              Curated
                            </span>
                          )}
                          
                          {/* Add button - Right aligned */}
                          <button
                            onClick={() => handleAddRecommendation(rec)}
                            className="w-4 h-4 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors ml-1"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Left scroll arrow */}
            {showLeftArrow && (
              <div className="absolute left-0 top-0 bottom-0 flex items-center z-10">
                <button
                  onClick={scrollLeft}
                  className="bg-gradient-to-r from-white via-white to-transparent w-8 h-full flex items-center justify-start pl-1 hover:from-gray-50"
                >
                  <svg className="w-4 h-4 text-gray-600 hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Right scroll arrow */}
            {showRightArrow && (
              <div className="absolute right-0 top-0 bottom-0 flex items-center z-10">
                <button
                  onClick={scrollRight}
                  className="bg-gradient-to-l from-white via-white to-transparent w-8 h-full flex items-center justify-end pr-1 hover:from-gray-50"
                >
                  <svg className="w-4 h-4 text-gray-600 hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}; 