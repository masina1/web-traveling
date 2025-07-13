'use client';

import { useState } from 'react';
import { Trip, Destination, TripDay } from '@/types';
import { format, parseISO } from 'date-fns';

interface ItineraryPanelProps {
  trip: Trip;
  tripDays: TripDay[];
  selectedDay: number;
  selectedDestination: Destination | null;
  onDaySelect: (day: number) => void;
  onDestinationSelect: (destination: Destination) => void;
  onDestinationsChange: (destinations: Destination[]) => void;
}

export default function ItineraryPanel({
  trip,
  tripDays,
  selectedDay,
  selectedDestination,
  onDaySelect,
  onDestinationSelect,
  onDestinationsChange,
}: ItineraryPanelProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
    onDaySelect(day);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Itinerary</h2>
        <p className="text-sm text-gray-600">
          {tripDays.length} days • {tripDays.reduce((acc, day) => acc + day.destinations.length, 0)} destinations
        </p>
      </div>

      {/* Days List */}
      <div className="flex-1 overflow-y-auto">
        {tripDays.map((day) => (
          <div key={day.day} className="border-b border-gray-100 last:border-b-0">
            {/* Day Header */}
            <button
              onClick={() => toggleDay(day.day)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selectedDay === day.day ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium`}
                    style={{ backgroundColor: day.color.pin }}
                  >
                    {day.day}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Day {day.day}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(day.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {day.destinations.length} stops
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedDays.has(day.day) ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Destinations List */}
            {expandedDays.has(day.day) && (
              <div className="bg-gray-50">
                {day.destinations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">No destinations added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click on the map to add destinations</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {day.destinations.map((destination, index) => (
                      <div key={destination.id || index}>
                        <button
                          onClick={() => onDestinationSelect(destination)}
                          className={`w-full p-4 text-left hover:bg-gray-100 transition-colors ${
                            selectedDestination?.id === destination.id ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: day.color.pin }}
                            >
                              {destination.orderIndex}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {destination.locationName}
                                </h4>
                                {destination.startTime && (
                                  <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                                    {formatTime(destination.startTime)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {destination.address}
                              </p>
                              {destination.notes && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {destination.notes}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                {destination.category && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {destination.category}
                                  </span>
                                )}
                                {destination.rating && (
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-sm text-gray-600">{destination.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        {/* Connector line */}
                        {index < day.destinations.length - 1 && (
                          <div className="flex justify-start ml-7">
                            <div className="w-0.5 h-4 bg-gray-300"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Destination Button */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => onDaySelect(day.day)}
                    className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm text-gray-600">Add destination</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-gray-500">Click on the map to add destinations</span>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700">
            Export
          </button>
        </div>
      </div>
    </div>
  );
} 