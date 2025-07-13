'use client';

import { useEffect, useRef, useState } from 'react';

export default function MapTest() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testGoogleMaps = async () => {
      try {
        setStatus('Checking API key...');
        
        // Check if API key exists
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found in environment variables');
        }
        
        setStatus('Loading Google Maps API...');
        
        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setStatus('Creating map...');
          
          if (!mapRef.current) {
            setError('Map container not found');
            return;
          }
          
          // Test basic map creation
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 40.7128, lng: -74.0060 },
            zoom: 10,
          });
          
          // Test marker creation
          const marker = new google.maps.Marker({
            position: { lat: 40.7128, lng: -74.0060 },
            map: map,
            title: 'Test Marker - NYC',
          });
          
          // Test geocoding
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: 'New York, NY' }, (results, status) => {
            if (status === 'OK') {
              setStatus('✅ All APIs working correctly!');
              setError('');
            } else {
              setError(`Geocoding failed: ${status}`);
            }
          });
        };
        
        script.onerror = () => {
          setError('Failed to load Google Maps script. Check your API key and network connection.');
        };
        
        document.head.appendChild(script);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setStatus('❌ Setup failed');
      }
    };

    testGoogleMaps();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Google Maps API Test</h2>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700">Status: {status}</span>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ Error: {error}</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">API Key Check:</h3>
          <div className="text-sm text-gray-600">
            API Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 
              `${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 20)}...` : 
              '❌ Not found'}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Required APIs:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Maps JavaScript API</li>
            <li>• Places API (New)</li>
            <li>• Geocoding API</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Map Test:</h3>
        <div 
          ref={mapRef} 
          className="w-full h-96 bg-gray-100 rounded-lg"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
} 