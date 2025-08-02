'use client';

import { useState } from 'react';
import { Destination } from '@/types';
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
import { CSS } from '@dnd-kit/utilities';
import { ClockIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface UngroupedDestinationsProps {
  destinations: Destination[];
  onDestinationSelect?: (destination: Destination) => void;
  onDestinationDelete?: (destinationId: string) => void;
  onAddTimeToDestination?: (destination: Destination) => void;
  onReorderDestinations?: (destinations: Destination[]) => void;
  selectedPinIds: string[];
  handleCheckboxChange: (id: string, checked: boolean) => void;
  viewMode: 'picture' | 'compact';
  readOnly?: boolean;
}

// Sortable ungrouped destination component
function SortableUngroupedDestination({ 
  destination, 
  onDestinationSelect,
  onDestinationDelete,
  onAddTimeToDestination,
  selectedPinIds,
  handleCheckboxChange,
  viewMode,
  readOnly = false
}: {
  destination: Destination;
  onDestinationSelect?: (destination: Destination) => void;
  onDestinationDelete?: (destinationId: string) => void;
  onAddTimeToDestination?: (destination: Destination) => void;
  selectedPinIds: string[];
  handleCheckboxChange: (id: string, checked: boolean) => void;
  viewMode: 'picture' | 'compact';
  readOnly?: boolean;
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

  const imageUrl = destination.photos && destination.photos.length > 0 
    ? destination.photos[0] 
    : '/default-location.jpg';

  if (viewMode === 'picture') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group mb-2 cursor-grab ${isDragging ? 'opacity-50' : ''}`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-start space-x-3">
          {/* Checkbox */}
          {!readOnly && (
            <input
              type="checkbox"
              className="mr-2 ml-4 mt-3"
              checked={selectedPinIds.includes(destination.id)}
              onChange={e => handleCheckboxChange(destination.id, e.target.checked)}
            />
          )}
          
          {/* Drag handle on the far left */}
          {!readOnly && (
            <button
              className="text-gray-400 hover:text-gray-600 pt-3 opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <Bars3Icon className="w-4 h-4" />
            </button>
          )}

          {/* Gray box with pin, name, and drag handle */}
          <div className="relative flex items-center space-x-3 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-0">
            {/* Ungrouped pin icon */}
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">•</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 ml-6">
              <h4 className="font-medium text-gray-900 truncate">
                {destination.locationName}
              </h4>
              <p className="text-sm text-gray-600 truncate">
                {destination.address}
              </p>
              {destination.category && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full mr-1 mt-1">
                  {destination.category}
                </span>
              )}
            </div>

            {/* Add time button */}
            {!readOnly && onAddTimeToDestination && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTimeToDestination(destination);
                }}
                className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                type="button"
              >
                <ClockIcon className="w-3 h-3" />
                <span>Add time</span>
              </button>
            )}

            {/* Drag handle on the right inside the gray box */}
            {!readOnly && (
              <button
                className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <Bars3Icon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Image */}
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={destination.locationName}
              className="w-16 h-16 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/default-location.jpg';
              }}
            />
          </div>

          {/* Trash can (delete button) */}
          {!readOnly && onDestinationDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDestinationDelete(destination.id);
              }}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact view
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group mb-2 cursor-grab ${isDragging ? 'opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center group mb-2">
        {/* Checkbox */}
        {!readOnly && (
          <input
            type="checkbox"
            className="mr-2 ml-4"
            checked={selectedPinIds.includes(destination.id)}
            onChange={e => handleCheckboxChange(destination.id, e.target.checked)}
          />
        )}
        
        {/* Drag handle on the far left */}
        {!readOnly && (
          <button
            className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            type="button"
          >
            <Bars3Icon className="w-4 h-4" />
          </button>
        )}

        {/* Gray box with pin, name, and controls */}
        <div className="relative flex items-center space-x-3 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-0">
          {/* Ungrouped pin icon */}
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">•</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 ml-6">
            <h4 className="font-medium text-gray-900 truncate">
              {destination.locationName}
            </h4>
          </div>

          {/* Add time button */}
          {!readOnly && onAddTimeToDestination && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddTimeToDestination(destination);
              }}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              type="button"
            >
              <ClockIcon className="w-3 h-3" />
              <span>Add time</span>
            </button>
          )}

          {/* Drag handle on the right inside the gray box */}
          {!readOnly && (
            <button
              className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <Bars3Icon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Trash can (delete button) outside the gray box, right-aligned */}
        {!readOnly && onDestinationDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDestinationDelete(destination.id);
            }}
            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function UngroupedDestinations({
  destinations,
  onDestinationSelect,
  onDestinationDelete,
  onAddTimeToDestination,
  onReorderDestinations,
  selectedPinIds,
  handleCheckboxChange,
  viewMode,
  readOnly = false
}: UngroupedDestinationsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && onReorderDestinations) {
      const oldIndex = destinations.findIndex(d => d.id === active.id);
      const newIndex = destinations.findIndex(d => d.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newDestinations = [...destinations];
        const [reorderedItem] = newDestinations.splice(oldIndex, 1);
        newDestinations.splice(newIndex, 0, reorderedItem);
        
        // Update order indices
        const updatedDestinations = newDestinations.map((dest, index) => ({
          ...dest,
          orderIndex: index + 1
        }));
        
        onReorderDestinations(updatedDestinations);
      }
    }
  };

  if (destinations.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200">
      {/* Header */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">•</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Ungrouped</h3>
            <p className="text-sm text-gray-600">
              Destinations without specific times
            </p>
          </div>
          <div className="flex-1"></div>
          <span className="text-sm text-gray-500">
            {destinations.length} {destinations.length === 1 ? 'place' : 'places'}
          </span>
        </div>
      </div>

      {/* Destinations List */}
      <div className="bg-gray-50 pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={destinations.map(d => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {destinations.map((destination) => (
              <SortableUngroupedDestination
                key={destination.id}
                destination={destination}
                onDestinationSelect={onDestinationSelect}
                onDestinationDelete={onDestinationDelete}
                onAddTimeToDestination={onAddTimeToDestination}
                selectedPinIds={selectedPinIds}
                handleCheckboxChange={handleCheckboxChange}
                viewMode={viewMode}
                readOnly={readOnly}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}