'use client';

import { useState } from 'react';
import { Trip, Destination, TripDay } from '@/types';
import { format, parseISO } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { reorderDestinations } from '@/lib/destination-service';

interface ItineraryPanelProps {
  trip: Trip;
  tripDays: TripDay[];
  selectedDay: number;
  selectedDestination: Destination | null;
  onDaySelect: (day: number) => void;
  onDestinationSelect: (destination: Destination) => void;
  onDestinationsChange: (destinations: Destination[]) => void;
}

// Sortable destination item component
function SortableDestination({ 
  destination, 
  dayColor, 
  selectedDestination,
  onDestinationSelect,
  isLastItem 
}: {
  destination: Destination;
  dayColor: any;
  selectedDestination: Destination | null;
  onDestinationSelect: (destination: Destination) => void;
  isLastItem: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: destination.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <button
        onClick={() => onDestinationSelect(destination)}
        className={`w-full p-4 text-left hover:bg-gray-100 transition-colors ${
          selectedDestination?.id === destination.id ? 'bg-blue-100' : ''
        }`}
      >
        <div className="flex items-start space-x-3">
          {/* Drag Handle */}
          <div 
            {...attributes}
            {...listeners}
            className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>

          {/* Pin Number */}
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5"
            style={{ backgroundColor: dayColor.pin }}
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
      {!isLastItem && (
        <div className="flex justify-start ml-11">
          <div className="w-0.5 h-4 bg-gray-300"></div>
        </div>
      )}
    </div>
  );
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
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    // Find the day that contains the dragged item
    const draggedDestination = tripDays
      .flatMap(day => day.destinations)
      .find(dest => dest.id === active.id);
    
    if (!draggedDestination) return;

    const day = tripDays.find(d => d.day === draggedDestination.day);
    if (!day) return;

    const oldIndex = day.destinations.findIndex(dest => dest.id === active.id);
    const newIndex = day.destinations.findIndex(dest => dest.id === over.id);

    if (oldIndex === newIndex) return;

    setIsReordering(true);

    try {
      // Create new order array
      const newDestinations = [...day.destinations];
      const [movedItem] = newDestinations.splice(oldIndex, 1);
      newDestinations.splice(newIndex, 0, movedItem);

      // Update order indices
      const reorderedDestinations = newDestinations.map((dest, index) => ({
        ...dest,
        orderIndex: index + 1
      }));

      // Update local state immediately for better UX
      const updatedTripDays = tripDays.map(tripDay => {
        if (tripDay.day === day.day) {
          return {
            ...tripDay,
            destinations: reorderedDestinations
          };
        }
        return tripDay;
      });

      // Update destinations in parent component
      const allDestinations = updatedTripDays.flatMap(d => d.destinations);
      onDestinationsChange(allDestinations);

      // Save to database
      const destinationIds = reorderedDestinations.map(dest => dest.id);
      await reorderDestinations(trip.id, day.day, destinationIds);

    } catch (error) {
      console.error('Error reordering destinations:', error);
      // Optionally show error message to user
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Itinerary</h2>
            <p className="text-sm text-gray-600">
              {tripDays.length} days • {tripDays.reduce((acc, day) => acc + day.destinations.length, 0)} destinations
            </p>
          </div>
          {isReordering && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </div>
          )}
        </div>
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={day.destinations.map(dest => dest.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-0">
                        {day.destinations.map((destination, index) => (
                          <SortableDestination
                            key={destination.id}
                            destination={destination}
                            dayColor={day.color}
                            selectedDestination={selectedDestination}
                            onDestinationSelect={onDestinationSelect}
                            isLastItem={index === day.destinations.length - 1}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
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
            <span className="text-xs text-gray-500">
              {tripDays.some(day => day.destinations.length > 0) ? 'Drag destinations to reorder • ' : ''}
              Click on the map to add destinations
            </span>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700">
            Export
          </button>
        </div>
      </div>
    </div>
  );
} 