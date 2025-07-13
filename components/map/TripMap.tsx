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
}

export default function TripMap({
  trip,
  destinations,
  tripDays,
  selectedDestination,
  selectedDay,
  onDestinationSelect,
  onDestinationAdd,
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Debug function
  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${timestamp}: ${info}`);
    setDebugInfo(prev => [...prev, `${timestamp}: ${info}`]);
  };

  // Ensure component is mounted before trying to access DOM
  useEffect(() => {
    setIsMounted(true);
    addDebugInfo('Component mounted');
    return () => {
      setIsMounted(false);
    };
  }, []);

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

        // Create map instance
        addDebugInfo('Creating map instance...');
        const mapInstance = new google.maps.Map(container, {
          center: { lat: 40.7128, lng: -74.0060 },
          zoom: 10,
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
      addDebugInfo(`Skipping markers: map=${!!map}, destinations=${destinations.length}${isLoading ? ' map is in loading' : ''}`);
      return;
    }

    addDebugInfo(`Updating ${destinations.length} markers`);

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    destinations.forEach((destination, index) => {
      const dayColor = tripDays.find(d => d.day === destination.day)?.color;
      
      // Create marker with simple icon
      const marker = new google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng },
        map: map,
        title: destination.locationName,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: dayColor?.pin || '#6B7280',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        label: {
          text: destination.orderIndex?.toString() || (index + 1).toString(),
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      });

      // Add click listener
      marker.addListener('click', () => {
        onDestinationSelect(destination);
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 250px;">
            <h3 style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">${destination.locationName}</h3>
            <p style="font-size: 14px; color: #6B7280; margin-bottom: 8px;">${destination.address}</p>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #9CA3AF;">
              <span>Day ${destination.day}</span>
              ${destination.startTime ? `<span>${destination.startTime}</span>` : ''}
            </div>
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

    setMarkers(newMarkers);
    addDebugInfo(`Created ${newMarkers.length} markers`);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      map.fitBounds(bounds);
      
      // Prevent over-zooming for single marker
      if (newMarkers.length === 1) {
        map.setZoom(Math.min(map.getZoom() || 15, 15));
      }
    }
  }, [map, destinations, tripDays, onDestinationSelect, isLoading]);

  // Highlight selected destination
  useEffect(() => {
    if (!selectedDestination || !markers.length) return;

    markers.forEach(marker => {
      const position = marker.getPosition();
      if (
        position &&
        position.lat() === selectedDestination.lat &&
        position.lng() === selectedDestination.lng
      ) {
        // Highlight selected marker
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          marker.setAnimation(null);
        }, 1500);
        
        // Center map on selected destination
        map?.panTo(position);
      }
    });
  }, [selectedDestination, markers, map]);

  // Handle map click to add new destination
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Use reverse geocoding to get address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const address = results[0].formatted_address;
        const locationName = results[0].address_components?.[0]?.long_name || address;

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
  };

  // Add click listener to map
  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', handleMapClick);
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, selectedDay, trip.id, tripDays, onDestinationAdd]);

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
        className="w-full bg-gray-100 rounded-lg"
        style={{ height: '600px', minHeight: '400px' }}
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 bg-opacity-95 rounded-lg">
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-95 rounded-lg">
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
      
      {/* Map Controls - Only show when map is loaded */}
      {!isLoading && !error && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-2">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">Day {selectedDay}</span>
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tripDays.find(d => d.day === selectedDay)?.color.pin }}
            />
            <span className="text-gray-600">Click to add destination</span>
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