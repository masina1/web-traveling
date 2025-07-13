'use client';

import { useState } from 'react';
import TripMap from '@/components/map/TripMap';
import MapTest from '@/components/map/MapTest';
import { Trip, Destination, TripDay, getDayColor } from '@/types';

export default function TestMapPage() {
  const [activeTab, setActiveTab] = useState<'map-test' | 'trip-map'>('map-test');

  // Sample data for testing TripMap
  const sampleTrip: Trip = {
    id: 'test-trip-id',
    userId: 'test-user-id',
    name: 'Test Trip to New York',
    location: 'New York, NY',
    startDate: '2024-01-15',
    endDate: '2024-01-17',
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleDestinations: Destination[] = [
    {
      id: 'dest1',
      tripId: 'test-trip-id',
      locationName: 'Central Park',
      address: 'Central Park, New York, NY',
      lat: 40.7829,
      lng: -73.9654,
      day: 1,
      orderIndex: 1,
      startTime: '09:00',
      endTime: '11:00',
      notes: 'Morning walk in the park',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'dest2',
      tripId: 'test-trip-id',
      locationName: 'Times Square',
      address: 'Times Square, New York, NY',
      lat: 40.7580,
      lng: -73.9855,
      day: 1,
      orderIndex: 2,
      startTime: '14:00',
      endTime: '16:00',
      notes: 'Tourist photos and shopping',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'dest3',
      tripId: 'test-trip-id',
      locationName: 'Statue of Liberty',
      address: 'Statue of Liberty, New York, NY',
      lat: 40.6892,
      lng: -74.0445,
      day: 2,
      orderIndex: 1,
      startTime: '10:00',
      endTime: '13:00',
      notes: 'Ferry ride and tour',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const sampleTripDays: TripDay[] = [
    {
      day: 1,
      date: '2024-01-15',
      destinations: sampleDestinations.filter(d => d.day === 1),
      color: getDayColor(1),
    },
    {
      day: 2,
      date: '2024-01-16',
      destinations: sampleDestinations.filter(d => d.day === 2),
      color: getDayColor(2),
    },
    {
      day: 3,
      date: '2024-01-17',
      destinations: [],
      color: getDayColor(3),
    },
  ];

  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const handleDestinationSelect = (destination: Destination) => {
    setSelectedDestination(destination);
    setSelectedDay(destination.day);
  };

  const handleDestinationAdd = (destination: Destination) => {
    console.log('New destination added:', destination);
    // In a real app, this would save to the database
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Map Testing Page</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('map-test')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'map-test'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Basic Map Test
              </button>
              <button
                onClick={() => setActiveTab('trip-map')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'trip-map'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Trip Map Test
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {activeTab === 'map-test' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Basic Google Maps API Test</h2>
              <p className="text-sm text-gray-600 mt-1">
                This tests the basic Google Maps API functionality without any trip data.
              </p>
            </div>
            <div className="h-[600px]">
              <MapTest />
            </div>
          </div>
        )}

        {activeTab === 'trip-map' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Trip Map Test</h2>
              <p className="text-sm text-gray-600 mt-1">
                This tests the TripMap component with sample trip data.
              </p>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Sample Trip Data:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Trip: {sampleTrip.name}</div>
                    <div className="text-gray-600">Location: {sampleTrip.location}</div>
                    <div className="text-gray-600">Days: {sampleTripDays.length}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Destinations: {sampleDestinations.length}</div>
                    <div className="text-gray-600">Day 1: {sampleTripDays[0].destinations.length} places</div>
                    <div className="text-gray-600">Day 2: {sampleTripDays[1].destinations.length} places</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Selected Day: {selectedDay}</div>
                    <div className="text-gray-600">
                      Selected: {selectedDestination?.locationName || 'None'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden">
                <TripMap
                  trip={sampleTrip}
                  destinations={sampleDestinations}
                  tripDays={sampleTripDays}
                  selectedDestination={selectedDestination}
                  selectedDay={selectedDay}
                  onDestinationSelect={handleDestinationSelect}
                  onDestinationAdd={handleDestinationAdd}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 