'use client';

import { useEffect, useRef, useState } from 'react';
import { Trip, Destination, TripDay } from '@/types';

interface TripMapProps {
  trip: Trip;
  destinations: Destination[];
  tripDays: TripDay[];
  selectedDestination: Destination | null;
  selectedDay: number;
  onDestinationSelect: (destination: Destination) => void;
  onDestinationAdd: (destination: Destination) => void;
  isAddingDestination?: boolean;
}

export default function TripMap({
  trip,
  destinations,
  tripDays,
  selectedDestination,
  selectedDay,
  onDestinationSelect,
  onDestinationAdd,
  isAddingDestination = false,
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isClickToAddEnabled, setIsClickToAddEnabled] = useState(false);

  // Debug function
  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`TripMap: ${info}`);
    setDebugInfo(prev => [...prev.slice(-5), `${timestamp}: ${info}`]); // Keep only last 5 messages
  };

  // Ensure component is mounted before trying to access DOM
  useEffect(() => {
    setIsMounted(true);
    addDebugInfo('Component mounted');
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Geocode trip location to get coordinates
  const geocodeTripLocation = async (location: string): Promise<{ lat: number; lng: number; zoom?: number }> => {
    const defaultCenter = { lat: 40.7128, lng: -74.0060, zoom: 10 }; // NYC fallback
    
    if (!location || !location.trim()) {
      addDebugInfo('No location provided, using default center (NYC)');
      return defaultCenter;
    }

    // Check if Google Maps is loaded
    if (!window.google?.maps?.Geocoder) {
      addDebugInfo('Google Maps Geocoder not available, using default center (NYC)');
      return defaultCenter;
    }

    try {
      addDebugInfo(`Geocoding location: "${location}"`);
      
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: location }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (result && result[0]) {
        const coords = result[0].geometry.location;
        const addressComponents = result[0].address_components;
        
        // Determine zoom level based on location type
        let zoom = 10; // Default city zoom
        
        // Check if it's a country (lower zoom) or city (higher zoom)
        const hasCountry = addressComponents.some(comp => comp.types.includes('country'));
        const hasCity = addressComponents.some(comp => 
          comp.types.includes('locality') || comp.types.includes('administrative_area_level_1')
        );
        
        if (hasCountry && !hasCity) {
          zoom = 5; // Country level
        } else if (hasCity) {
          zoom = 11; // City level
        }

        const center = {
          lat: coords.lat(),
          lng: coords.lng(),
          zoom: zoom
        };

        addDebugInfo(`✅ Geocoded "${location}" to: ${center.lat}, ${center.lng} (zoom: ${center.zoom})`);
        return center;
      }
    } catch (error) {
      addDebugInfo(`❌ Geocoding failed for "${location}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    addDebugInfo('Falling back to default center (NYC)');
    return defaultCenter;
  };

  // Initialize Google Maps
  useEffect(() => {
    if (!isMounted) {
      addDebugInfo('Component not mounted yet, waiting...');
      return;
    }

    if (mapInitialized) {
      addDebugInfo('Map already initialized, skipping');
      return;
    }

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        addDebugInfo('Starting map initialization...');

        // Check for API key
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }
        addDebugInfo(`API Key present: ${apiKey.substring(0, 20)}...`);

        // Wait for DOM element with retry logic
        const waitForContainer = (): Promise<HTMLDivElement> => {
          return new Promise((resolve, reject) => {
            let retryCount = 0;
            const maxRetries = 20; // Increased retries
            const retryDelay = 100;

            const checkContainer = () => {
              addDebugInfo(`Checking container (attempt ${retryCount + 1}/${maxRetries})`);
              
              if (!isMounted) {
                addDebugInfo('Component unmounted during container check');
                reject(new Error('Component unmounted'));
                return;
              }

              if (mapRef.current) {
                const rect = mapRef.current.getBoundingClientRect();
                addDebugInfo(`Container found: ${rect.width}x${rect.height}`);
                
                if (rect.width > 0 && rect.height > 0) {
                  addDebugInfo('Container has valid dimensions');
                  resolve(mapRef.current);
                } else {
                  addDebugInfo('Container exists but has zero dimensions');
                  retryCount++;
                  if (retryCount < maxRetries) {
                    setTimeout(checkContainer, retryDelay);
                  } else {
                    reject(new Error('Container never got proper dimensions'));
                  }
                }
              } else {
                addDebugInfo(`Container not found (attempt ${retryCount + 1}/${maxRetries})`);
                retryCount++;
                if (retryCount < maxRetries) {
                  setTimeout(checkContainer, retryDelay);
                } else {
                  reject(new Error('Container element never appeared'));
                }
              }
            };

            // Start checking after a small delay to ensure DOM is ready
            setTimeout(checkContainer, 50);
          });
        };

        const container = await waitForContainer();
        addDebugInfo('Container ready, loading Google Maps...');

        // Load Google Maps if not already loaded
        if (!window.google?.maps) {
          addDebugInfo('Loading Google Maps API...');
          await loadGoogleMapsScript(apiKey);
        } else {
          addDebugInfo('Google Maps already loaded');
        }

        // Get trip location coordinates (after Google Maps is loaded)
        addDebugInfo(`Getting coordinates for trip location: "${trip.location}"`);
        const tripCenter = await geocodeTripLocation(trip.location);
        
        // Create map instance
        addDebugInfo(`Creating map instance centered on: ${tripCenter.lat}, ${tripCenter.lng}`);
        const mapInstance = new google.maps.Map(container, {
          center: tripCenter,
          zoom: tripCenter.zoom || 10,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        setMap(mapInstance);
        setMapInitialized(true);
        setIsLoading(false);
        addDebugInfo('✅ Map initialization complete!');

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        addDebugInfo(`❌ Error: ${errorMessage}`);
        setError(`Failed to load map: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    // Load Google Maps script
    const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          addDebugInfo('Google Maps script loaded');
          resolve();
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Google Maps script'));
        };
        
        document.head.appendChild(script);
      });
    };

    addDebugInfo('Map initialization effect triggered');
    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
      if (isMounted) {
        initMap();
      }
    }, 100);
  }, [isMounted, mapInitialized]);

  // Update markers when destinations change
  useEffect(() => {
    if (!map || !destinations.length) {
      addDebugInfo(`Skipping markers: map=${!!map}, destinations=${destinations.length}${isLoading ? ', map is loading' : ''}`);
      return;
    }

    addDebugInfo(`Recreating ${destinations.length} markers completely`);

    // Clear existing markers completely and forcefully
    markers.forEach(marker => {
      marker.setMap(null);
      // Remove all event listeners to prevent memory leaks
      google.maps.event.clearInstanceListeners(marker);
    });
    
    // Clear markers array immediately
    setMarkers([]);

    // Force a slight delay to ensure Google Maps processes the removal
    const timeoutId = setTimeout(() => {
      // Double-check we still have the map and destinations
      if (!map || !destinations.length) return;

      // Create completely new markers array
      const newMarkers: google.maps.Marker[] = [];
      const bounds = new google.maps.LatLngBounds();

          // Sort destinations by day and order index to ensure proper numbering
    const sortedDestinations = [...destinations].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });

    addDebugInfo(`Creating markers for ${sortedDestinations.length} sorted destinations`);

    // Create a map of day -> sequential pin numbers
    const dayCounters = new Map<number, number>();
    sortedDestinations.forEach(destination => {
      const dayCount = dayCounters.get(destination.day) || 0;
      dayCounters.set(destination.day, dayCount + 1);
    });

    sortedDestinations.forEach((destination, index) => {
      const dayColor = tripDays.find(d => d.day === destination.day)?.color;
      
      // Calculate proper sequential pin number within the day
      const destinationsInDay = sortedDestinations.filter(d => d.day === destination.day);
      const pinNumber = destinationsInDay.findIndex(d => d.id === destination.id) + 1;
      
      // Create completely new marker instance
      const marker = new google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng },
        map: map,
        title: destination.locationName,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
          fillColor: dayColor?.pin || '#6B7280',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 1.5,
          anchor: new google.maps.Point(12, 22),
          labelOrigin: new google.maps.Point(12, 9),
        },
        label: {
          text: pinNumber.toString(),
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        // Ensure no animations interfere during creation
        animation: null,
        // Force marker to be draggable: false to prevent conflicts
        draggable: false,
      });

      addDebugInfo(`Created marker ${pinNumber} for ${destination.locationName} on day ${destination.day} (orderIndex: ${destination.orderIndex})`);

        // Add click listener
        marker.addListener('click', () => {
          onDestinationSelect(destination);
        });

        // Create info window with photos
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; max-width: 300px;">
              ${destination.photos && destination.photos.length > 0 ? `
                <div style="margin-bottom: 8px;">
                  <img 
                    src="${destination.photos[0]}" 
                    alt="${destination.locationName}"
                    style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;"
                    onerror="this.style.display='none'"
                  />
                </div>
              ` : ''}
              <h3 style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">${destination.locationName}</h3>
              <p style="font-size: 14px; color: #6B7280; margin-bottom: 8px;">${destination.address}</p>
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #9CA3AF; margin-bottom: 8px;">
                <span>Day ${destination.day}</span>
                ${destination.startTime ? `<span>${destination.startTime}</span>` : ''}
              </div>
              ${destination.rating ? `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #F59E0B; font-size: 14px;">★</span>
                  <span style="font-size: 12px; color: #6B7280; margin-left: 4px;">${destination.rating}</span>
                  ${destination.category ? `<span style="font-size: 12px; color: #9CA3AF; margin-left: 8px;">${destination.category}</span>` : ''}
                </div>
              ` : ''}
              ${destination.notes ? `<p style="font-size: 14px; color: #374151; margin-top: 8px;">${destination.notes}</p>` : ''}
            </div>
          `,
        });

        // Show info window on marker click
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
        bounds.extend(marker.getPosition()!);
      });

      // Update markers state
      setMarkers(newMarkers);
      addDebugInfo(`✅ Successfully created ${newMarkers.length} new markers`);

      // Fit map to show all markers
      if (newMarkers.length > 0) {
        map.fitBounds(bounds);
        
        // Prevent over-zooming for single marker
        if (newMarkers.length === 1) {
          map.setZoom(Math.min(map.getZoom() || 15, 15));
        }
      }
    }, 100); // 100ms delay for proper marker recreation

    // Cleanup timeout on unmount or dependency change
    return () => {
      clearTimeout(timeoutId);
    };

  }, [map, destinations, tripDays, onDestinationSelect, isLoading]);

  // Handle map click to add new destination
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng || isAddingDestination || !isClickToAddEnabled) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Use Places API first, then fall back to reverse geocoding
    const placesService = new google.maps.places.PlacesService(map!);
    
    // Try to find nearby places first with a larger radius
    placesService.nearbySearch(
      {
        location: { lat, lng },
        radius: 100, // Increased to 100 meters
        type: 'establishment' as any, // Cast to any to avoid TypeScript issues
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          // Found a business/place
          const place = results[0];
          const locationName = place.name || 'Unknown Place';
          const address = place.vicinity || place.formatted_address || '';
          
          addDebugInfo(`Found business: ${locationName} at ${address}`);
          
          // Create new destination object
          const selectedDayData = tripDays.find(d => d.day === selectedDay);
          const newDestination: Destination = {
            id: '', // Will be set by server
            tripId: trip.id,
            locationName, // Use the business name from Places API
            address,
            lat,
            lng,
            day: selectedDay,
            orderIndex: (selectedDayData?.destinations.length || 0) + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          addDebugInfo(`Creating destination with business name: ${locationName}`);
          onDestinationAdd(newDestination);
        } else {
          // Try findPlaceFromQuery as a second attempt
          addDebugInfo('No nearby business found, trying findPlaceFromQuery');
          
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (geocodeResults, geocodeStatus) => {
            if (geocodeStatus === 'OK' && geocodeResults?.[0]) {
              const address = geocodeResults[0].formatted_address;
              
              // Try to search for a place using the address
              const request = {
                query: address,
                fields: ['name', 'formatted_address', 'place_id', 'geometry'],
                locationBias: new google.maps.Circle({
                  center: { lat, lng },
                  radius: 100
                })
              };
              
              placesService.findPlaceFromQuery(request, (queryResults, queryStatus) => {
                if (queryStatus === google.maps.places.PlacesServiceStatus.OK && queryResults && queryResults[0]) {
                  const place = queryResults[0];
                  const locationName = place.name || 'Unknown Place';
                  const placeAddress = place.formatted_address || address;
                  
                  addDebugInfo(`Found place from query: ${locationName} at ${placeAddress}`);
                  
                  // Create new destination object
                  const selectedDayData = tripDays.find(d => d.day === selectedDay);
                  const newDestination: Destination = {
                    id: '', // Will be set by server
                    tripId: trip.id,
                    locationName, // Use the business name from Places API
                    address: placeAddress,
                    lat,
                    lng,
                    day: selectedDay,
                    orderIndex: (selectedDayData?.destinations.length || 0) + 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };

                  addDebugInfo(`Creating destination with query result: ${locationName}`);
                  onDestinationAdd(newDestination);
                } else {
                  // Fall back to reverse geocoding with improved name extraction
                  addDebugInfo('No place found from query, falling back to reverse geocoding');
                  
                  // Try to extract a meaningful name from the address components
                  let locationName = address;
                  const components = geocodeResults[0].address_components;
                  
                  if (components && components.length > 0) {
                    // Look for business name, route name, or neighborhood
                    const businessComponent = components.find(c => 
                      c.types.includes('establishment') || 
                      c.types.includes('point_of_interest') ||
                      c.types.includes('premise')
                    );
                    
                    if (businessComponent) {
                      locationName = businessComponent.long_name;
                    } else {
                      // Use street number + route if available
                      const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name;
                      const route = components.find(c => c.types.includes('route'))?.long_name;
                      
                      if (streetNumber && route) {
                        locationName = `${streetNumber} ${route}`;
                      } else if (route) {
                        locationName = route;
                      } else {
                        // Use first component as fallback
                        locationName = components[0].long_name;
                      }
                    }
                  }

                  addDebugInfo(`Using geocoded name: ${locationName}`);

                  // Create new destination object
                  const selectedDayData = tripDays.find(d => d.day === selectedDay);
                  const newDestination: Destination = {
                    id: '', // Will be set by server
                    tripId: trip.id,
                    locationName,
                    address,
                    lat,
                    lng,
                    day: selectedDay,
                    orderIndex: (selectedDayData?.destinations.length || 0) + 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };

                  onDestinationAdd(newDestination);
                }
              });
            }
          });
        }
      }
    );
  };

  // Highlight selected destination
  useEffect(() => {
    if (!selectedDestination || !markers.length) return;

    // Clear all previous animations first to prevent interference
    markers.forEach(marker => {
      marker.setAnimation(null);
    });

    // Small delay to ensure animations are cleared
    setTimeout(() => {
      // Find and animate only the selected marker based on both coordinates and destination ID
      markers.forEach(marker => {
        const position = marker.getPosition();
        if (
          position &&
          Math.abs(position.lat() - selectedDestination.lat) < 0.0001 &&
          Math.abs(position.lng() - selectedDestination.lng) < 0.0001
        ) {
          // Only animate if this marker corresponds to the selected destination
          addDebugInfo(`Animating selected marker: ${selectedDestination.locationName} (ID: ${selectedDestination.id})`);
          
          // Create a custom animation that keeps icon and label synchronized
          let animationFrame = 0;
          const animationDuration = 1500; // 1.5 seconds
          const originalPosition = marker.getPosition();
          
          if (!originalPosition) return;
          
          const animationInterval = setInterval(() => {
            animationFrame += 50; // 50ms intervals
            
            if (animationFrame >= animationDuration) {
              clearInterval(animationInterval);
              // Reset to original position
              marker.setPosition(originalPosition);
              return;
            }
            
            // Calculate bounce effect (sine wave for smooth animation)
            const bounceHeight = Math.abs(Math.sin(animationFrame / 150)) * 0.0001; // Small lat/lng offset
            
            // Move the entire marker (icon + label) slightly up and down
            const newPosition = new google.maps.LatLng(
              originalPosition.lat() + bounceHeight,
              originalPosition.lng()
            );
            
            marker.setPosition(newPosition);
          }, 50);
          
          // Center map on selected destination
          map?.panTo(position);
        }
      });
    }, 100);
  }, [selectedDestination?.id, markers, map]); // Use selectedDestination.id as dependency

  // Add click listener to map
  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', handleMapClick);
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, selectedDay, trip.id, tripDays, onDestinationAdd, isAddingDestination, isClickToAddEnabled]);

  const handleRetry = () => {
    addDebugInfo('Retry button clicked');
    setMapInitialized(false);
    setError(null);
    setDebugInfo([]);
    setIsLoading(true);
  };

  return (
    <div className="h-full relative">
      {/* Map Container - Always rendered */}
      <div 
        ref={mapRef}
        className="w-full h-full bg-gray-100"
        style={{ minHeight: '400px' }}
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 bg-opacity-95">
          <div className="text-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
          
          {/* Debug Info */}
          <div className="bg-white rounded-lg shadow p-3 max-w-md text-xs">
            <h4 className="font-semibold mb-2">Debug Log:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {debugInfo.slice(-10).map((info, index) => (
                <div key={index} className="text-gray-600">{info}</div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t">
              <div>Mounted: {isMounted ? '✅ Yes' : '❌ No'}</div>
              <div>Container: {mapRef.current ? '✅ Found' : '❌ Not found'}</div>
              <div>Initialized: {mapInitialized ? '✅ Yes' : '❌ No'}</div>
              <div>API Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Present' : '❌ Missing'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-95">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4 text-sm">{error}</p>
            
            {/* Debug Info */}
            <div className="bg-white rounded-lg shadow p-3 mb-4 text-xs text-left">
              <h4 className="font-semibold mb-2">Debug Log:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {debugInfo.slice(-10).map((info, index) => (
                  <div key={index} className="text-gray-600">{info}</div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t">
                <div>Mounted: {isMounted ? '✅ Yes' : '❌ No'}</div>
                <div>Container: {mapRef.current ? '✅ Found' : '❌ Not found'}</div>
                <div>Initialized: {mapInitialized ? '✅ Yes' : '❌ No'}</div>
              </div>
            </div>
            
            <button onClick={handleRetry} className="btn-primary">
              Retry
            </button>
            <div className="mt-4 text-xs text-gray-500">
              <p>Make sure your Google Maps API key has these services enabled:</p>
              <ul className="mt-2 text-left">
                <li>• Maps JavaScript API</li>
                <li>• Places API (New)</li>
                <li>• Geocoding API</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Map Controls */}
      {!isLoading && !error && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Day {selectedDay}</span>
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tripDays.find(d => d.day === selectedDay)?.color.pin }}
              />
            </div>
            
            {isAddingDestination ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-gray-600">Adding destination...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsClickToAddEnabled(!isClickToAddEnabled)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isClickToAddEnabled 
                      ? 'bg-primary-600 text-white hover:bg-primary-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isClickToAddEnabled ? 'Click to Add ON' : 'Click to Add OFF'}
                </button>
                <span className="text-gray-500 text-xs">
                  {isClickToAddEnabled ? 'Click map to add destination' : 'Enable to add destinations by clicking'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend - Only show when map is loaded */}
      {!isLoading && !error && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-2">Trip Days</h3>
          <div className="space-y-1">
            {tripDays.slice(0, 5).map((day) => (
              <div key={day.day} className="flex items-center space-x-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: day.color.pin }}
                />
                <span className="text-gray-700">Day {day.day}</span>
                <span className="text-gray-500">({day.destinations.length} stops)</span>
              </div>
            ))}
            {tripDays.length > 5 && (
              <div className="text-xs text-gray-500">+{tripDays.length - 5} more days</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 