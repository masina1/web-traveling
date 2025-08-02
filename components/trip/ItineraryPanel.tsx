'use client';

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Trip, Destination, TripDay } from '@/types';
import { format, parseISO } from 'date-fns';
import LocationSearch from './LocationSearch';
import SmartRecommendations from './SmartRecommendations';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  UniqueIdentifier,
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
import { reorderDestinations, moveDestinationToDay, updateDestination } from '@/lib/destination-service';
import { PhotoIcon, Bars3Icon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline';
import UngroupedDestinations from './UngroupedDestinations';

interface ItineraryPanelProps {
  trip: Trip;
  destinations: Destination[];
  onDestinationsChange: (destinations: Destination[]) => void;
  readOnly?: boolean;
  // Legacy props for backward compatibility
  tripDays?: TripDay[];
  selectedDay?: number;
  selectedDestination?: Destination | null;
  onDaySelect?: (day: number) => void;
  onDestinationSelect?: (destination: Destination) => void;
  onLocationSelect?: (destination: Destination) => void;
  onDestinationDelete?: (destinationId: string) => void;
}

// Droppable day container component
function DroppableDay({ 
  day, 
  children, 
  isOver 
}: { 
  day: TripDay; 
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: `day-${day.day}`,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-blue-50' : ''}`}
    >
      {children}
    </div>
  );
}

// Sortable destination item component
function SortableDestination({ 
  destination, 
  dayColor, 
  selectedDestination,
  onDestinationSelect,
  onDestinationDelete,
  isLastItem, 
  selectedPinIds,
  handleCheckboxChange
}: {
  destination: Destination;
  dayColor: any;
  selectedDestination: Destination | null;
  onDestinationSelect: (destination: Destination) => void;
  onDestinationDelete: (destinationId: string) => void;
  isLastItem: boolean;
  selectedPinIds: string[];
  handleCheckboxChange: (id: string, checked: boolean) => void;
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

  const isSelected = selectedDestination?.id === destination.id;

  return (
    <div ref={setNodeRef} style={style} className={`w-full ${isDragging ? 'opacity-50' : ''}`}> 
      <div
        className="flex items-center group mb-2 cursor-grab"
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          className="mr-2 ml-4"
          checked={selectedPinIds.includes(destination.id)}
          onChange={e => handleCheckboxChange(destination.id, e.target.checked)}
        />
        {/* Drag handle on the far left (outside gray box) */}
        <button
          className="flex-shrink-0 mr-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
          type="button"
          onClick={e => e.stopPropagation()}
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        {/* Gray box with pin, name, right drag handle */}
        <div className="relative flex items-center space-x-3 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-0">
          {/* Pin Number - Teardrop shape matching map */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
            <svg 
              width="39" 
              height="51" 
              viewBox="0 0 39 51" 
              className="w-6 h-6"
            >
              <path 
                d="M19.5 51C19.5 51 39 32.179 39 19.5C39 8.618 30.382 0 19.5 0C8.618 0 0 8.618 0 19.5C0 32.179 19.5 51 19.5 51Z"
                fill={isSelected ? '#3B82F6' : dayColor.pin}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x="19.5"
                y={destination.orderIndex.toString().length > 1 ? "23" : "21"}
                textAnchor="middle"
                fill="white"
                fontWeight="bold"
                fontSize={destination.orderIndex.toString().length > 1 ? "17px" : "20px"}
                alignmentBaseline="middle"
              >
                {destination.orderIndex}
              </text>
            </svg>
          </div>
          <div className="flex-1 min-w-0 ml-6">
            <h4 className="font-medium text-gray-900 truncate">
              {destination.locationName}
            </h4>
          </div>
          {/* Drag handle on the right inside the gray box */}
          <button
            className="flex-shrink-0 ml-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Drag to reorder"
            type="button"
            onClick={e => e.stopPropagation()}
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
        {/* Trash can (delete button) outside the gray box, right-aligned, visible on group hover */}
        <button
          onClick={e => {
            e.stopPropagation();
            onDestinationDelete(destination.id);
          }}
          className="mx-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-1 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          title="Delete destination"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Refactor SortableDestinationPicture to match Compact View structure, only adding extra info
function SortableDestinationPicture({
  destination,
  dayColor,
  selectedDestination,
  onDestinationSelect,
  onDestinationDelete,
  isLastItem,
  selectedPinIds,
  handleCheckboxChange
}: {
  destination: Destination;
  dayColor: any;
  selectedDestination: Destination | null;
  onDestinationSelect: (destination: Destination) => void;
  onDestinationDelete: (destinationId: string) => void;
  isLastItem: boolean;
  selectedPinIds: string[];
  handleCheckboxChange: (id: string, checked: boolean) => void;
}) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: destination.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedDestination?.id === destination.id;
  const imageUrl = destination.photos && destination.photos[0] ? destination.photos[0] : '/default-location.jpg';
  const [imgError, setImgError] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        className="flex items-center group mb-2 cursor-grab"
        {...attributes}
        {...listeners}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          className="mr-2 ml-4"
          checked={selectedPinIds.includes(destination.id)}
          onChange={e => handleCheckboxChange(destination.id, e.target.checked)}
        />
        {/* Drag handle on the far left (outside gray box) */}
        <button
          className="flex-shrink-0 mr-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
          type="button"
          onClick={e => e.stopPropagation()}
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        {/* Gray box with pin, name, right drag handle, and extra info */}
        <div className="relative flex items-center space-x-3 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-0">
          {/* Pin Number - Teardrop shape matching map */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
            <svg 
              width="39" 
              height="51" 
              viewBox="0 0 39 51" 
              className="w-6 h-6"
            >
              <path 
                d="M19.5 51C19.5 51 39 32.179 39 19.5C39 8.618 30.382 0 19.5 0C8.618 0 0 8.618 0 19.5C0 32.179 19.5 51 19.5 51Z"
                fill={isSelected ? '#3B82F6' : dayColor.pin}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x="19.5"
                y={destination.orderIndex.toString().length > 1 ? "21" : "19"}
                textAnchor="middle"
                fill="white"
                fontWeight="bold"
                fontSize={destination.orderIndex.toString().length > 1 ? "17px" : "20px"}
                alignmentBaseline="middle"
              >
                {destination.orderIndex}
              </text>
            </svg>
          </div>
          <div className="flex-1 min-w-0 ml-6">
            <div className="flex items-center">
              <h4 className="font-medium text-gray-900 truncate">
                {destination.locationName}
              </h4>
              {/* Time (if present) */}
              {destination.startTime && (
                <span className="ml-2 text-sm text-gray-500 flex-shrink-0">
                  {destination.startTime}
                </span>
              )}
            </div>
            {/* Address, description, tags, etc. only in Picture View */}
            {destination.address && (
              <div className="text-xs text-gray-500 truncate mt-1">{destination.address}</div>
            )}
            {destination.notes && (
              <div className="text-xs text-gray-600 mt-1 line-clamp-2">{destination.notes}</div>
            )}
            {/* Category/Tag */}
            {destination.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                {destination.category}
              </span>
            )}
          </div>
          {/* Image (right side, only in Picture View) */}
          <div className="flex-shrink-0 flex items-center group">
            {!imgError ? (
              <img
                src={imageUrl}
                alt={destination.locationName}
                className="w-28 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-28 h-20 flex items-center justify-center bg-gray-200 border border-gray-200 rounded-lg text-gray-400 text-xs">
                No Image
              </div>
            )}
          </div>
          {/* Drag handle on the right inside the gray box */}
          <button
            className="flex-shrink-0 ml-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Drag to reorder"
            type="button"
            onClick={e => e.stopPropagation()}
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
        {/* Trash can (delete button) outside the gray box, right-aligned, visible on group hover */}
        <button
          onClick={e => {
            e.stopPropagation();
            onDestinationDelete(destination.id);
          }}
          className="mx-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-1 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          title="Delete destination"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Helper: PlusButtonWithMenu
function PlusButtonWithMenu({ onAddPlace, onAddNote }: { onAddPlace: () => void; onAddNote: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex flex-col items-center justify-center z-10 h-full w-8 overflow-visible">
      {/* Continuous vertical dotted line */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-0.5 border-l-2 border-dotted border-gray-300 pointer-events-none" />
      {/* White overlay to hide the last dot but keep the space */}
      {/* Remove the white overlay div at the bottom of the vertical dotted line */}
      {/* 50px invisible space at the bottom */}
      <div className="w-full h-[50px] invisible" />
      {/* + button overlays the line, invisible by default, appears on hover */}
      <button
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition bg-gray-100 opacity-0 hover:opacity-100 focus:opacity-100 group"
        style={{ boxShadow: '0 0 0 0 transparent', zIndex: 2 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Add"
        type="button"
      >
        <span className="text-lg text-gray-500">+</span>
      </button>
      {/* Popover menu */}
      {open && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 px-3 flex flex-col space-y-1 min-w-[120px] z-20">
          <button
            className="text-sm text-gray-700 hover:bg-gray-100 rounded px-2 py-1 text-left"
            onClick={() => { setOpen(false); onAddPlace(); }}
            type="button"
          >
            Add a Place
          </button>
          <button
            className="text-sm text-gray-700 hover:bg-gray-100 rounded px-2 py-1 text-left"
            onClick={() => { setOpen(false); onAddNote(); }}
            type="button"
          >
            Add a Note
          </button>
        </div>
      )}
    </div>
  );
}

const ItineraryPanel = forwardRef(function ItineraryPanel({
  trip,
  destinations,
  onDestinationsChange,
  readOnly = false,
  // Legacy props for backward compatibility
  tripDays,
  selectedDay,
  selectedDestination,
  onDaySelect,
  onDestinationSelect,
  onLocationSelect,
  onDestinationDelete,
}: ItineraryPanelProps, ref) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [isReordering, setIsReordering] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [viewMode, setViewMode] = useState<'picture' | 'compact'>('compact');
  // 1. Add state to track selected pins
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>([]);
  // In ItineraryPanel, add state for which dropdown is open
  const [bulkDropdown, setBulkDropdown] = useState<'copy' | 'move' | null>(null);
  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<Destination[][]>([]);
  const [redoStack, setRedoStack] = useState<Destination[][]>([]);

  // Helper to push current state to undo stack
  const pushToUndo = (current: Destination[]) => {
    setUndoStack((prev) => [...prev, current.map(d => ({ ...d }))]);
    setRedoStack([]); // Clear redo on new action
  };

  // Wrap onDestinationsChange to support undo
  const handleDestinationsChange = (newDestinations: Destination[], pushUndo = true) => {
    if (pushUndo) pushToUndo(allDestinations);
    onDestinationsChange(newDestinations);
  };

  // Undo handler
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setRedoStack((prev) => [allDestinations.map(d => ({ ...d })), ...prev]);
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    onDestinationsChange(prevState);
  };
  // Redo handler
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setUndoStack((prev) => [...prev, allDestinations.map(d => ({ ...d }))]);
    const nextState = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    onDestinationsChange(nextState);
  };

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
    onDaySelect?.(day);
  };

  // 2. Add a checkbox to the left of each pin in both SortableDestination and SortableDestinationPicture
  // 3. Checkbox is checked if the pin's id is in selectedPinIds
  // 4. On change, add/remove the pin's id from selectedPinIds
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedPinIds((prev) =>
      checked ? [...prev, id] : prev.filter((pid) => pid !== id)
    );
  };

  // Add logic for Copy to, Move to, and Delete actions
  const handleBulkCopyTo = (dayNum: number) => {
    const toCopy = allDestinations.filter(dest => selectedPinIds.includes(dest.id));
    const maxOrder = Math.max(0, ...(tripDays?.find(d => d.day === dayNum)?.destinations.map(d => d.orderIndex) || []));
    const copied = toCopy.map((dest, i) => ({
      ...dest,
      id: `${dest.id}-copy-${Date.now()}-${i}`,
      day: dayNum,
      orderIndex: maxOrder + i + 1
    }));
    handleDestinationsChange([...allDestinations, ...copied]);
    setSelectedPinIds([]);
    setBulkDropdown(null);
  };
  const handleBulkMoveTo = (dayNum: number) => {
    const toMove = allDestinations.filter(dest => selectedPinIds.includes(dest.id));
    const notMoved = allDestinations.filter(dest => !selectedPinIds.includes(dest.id));
    const maxOrder = Math.max(0, ...(tripDays?.find(d => d.day === dayNum)?.destinations.map(d => d.orderIndex) || []));
    const moved = toMove.map((dest, i) => ({
      ...dest,
      day: dayNum,
      orderIndex: maxOrder + i + 1
    }));
    handleDestinationsChange([...notMoved, ...moved]);
    setSelectedPinIds([]);
    setBulkDropdown(null);
  };
  const handleBulkDelete = () => {
    const remaining = allDestinations.filter(dest => !selectedPinIds.includes(dest.id));
    handleDestinationsChange(remaining);
    setSelectedPinIds([]);
    setBulkDropdown(null);
  };

  // Get all destinations for sortable context (support both new and legacy interfaces)
  const allDestinations = destinations || (tripDays ? tripDays.flatMap(day => day.destinations) : []);
  
  // Separate ungrouped destinations (day = 0) from grouped ones
  const ungroupedDestinations = allDestinations.filter(dest => dest.day === 0);
  const groupedDestinations = allDestinations.filter(dest => dest.day > 0);

  // Handler to convert ungrouped destination to timed destination
  const handleAddTimeToDestination = async (destination: Destination) => {
    // For now, move to day 1 and add basic times - in the future, show a modal to select day and times
    const targetDay = 1;
    const targetDayData = tripDays?.find(d => d.day === targetDay);
    const newOrderIndex = (targetDayData?.destinations.length || 0) + 1;
    
    try {
      // Update the destination with day, order, and default times
      const updatedDestination = {
        ...destination,
        day: targetDay,
        orderIndex: newOrderIndex,
        startTime: '09:00', // Default start time
        endTime: '10:00'    // Default end time
      };

      // Update in database
      await updateDestination(destination.id, {
        day: targetDay,
        orderIndex: newOrderIndex,
        startTime: '09:00',
        endTime: '10:00'
      });

      // Update local state
      const updatedDestinations = allDestinations.map(dest => 
        dest.id === destination.id ? updatedDestination : dest
      );
      
      handleDestinationsChange(updatedDestinations);
    } catch (error) {
      console.error('Error converting ungrouped destination:', error);
    }
  };

  // Handler to reorder ungrouped destinations
  const handleReorderUngroupedDestinations = async (newDestinations: Destination[]) => {
    const updatedAllDestinations = allDestinations.map(dest => {
      const updated = newDestinations.find(newDest => newDest.id === dest.id);
      return updated || dest;
    });
    
    handleDestinationsChange(updatedAllDestinations);
    
    // Update in database
    try {
      const destinationIds = newDestinations.map(dest => dest.id);
      await reorderDestinations(trip.id, 0, destinationIds); // Use day 0 for ungrouped
    } catch (error) {
      console.error('Error reordering ungrouped destinations:', error);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);
    
    if (!over || active.id === over.id) {
      return;
    }

    const draggedDestination = allDestinations.find(dest => dest.id === active.id);
    if (!draggedDestination) return;

    setIsReordering(true);

    try {
      // Check if we're dropping on a day container or another destination
      const isDroppedOnDay = over.id.toString().startsWith('day-');
      
      if (isDroppedOnDay) {
        // Cross-day drop - move to end of target day
        const targetDay = parseInt(over.id.toString().replace('day-', ''));
        const targetDayData = tripDays?.find(d => d.day === targetDay);
        
        if (targetDayData && targetDay !== draggedDestination.day) {
          // Calculate proper sequential order index
          const newOrderIndex = targetDayData.destinations.length + 1;
          
          // Update in database
          await moveDestinationToDay(draggedDestination.id, targetDay, newOrderIndex);
          
          // Create updated destinations with proper renumbering
          const updatedDestinations = allDestinations.map(dest => {
            if (dest.id === draggedDestination.id) {
              return {
                ...dest,
                day: targetDay,
                orderIndex: newOrderIndex
              };
            }
            return dest;
          });

          // Renumber all destinations in both source and target days
          const finalDestinations = renumberDestinationsInDays(updatedDestinations, [draggedDestination.day, targetDay]);
          
          handleDestinationsChange(finalDestinations);
        }
      } else {
        // Same day or destination-to-destination drop
        const targetDestination = allDestinations.find(dest => dest.id === over.id);
        if (!targetDestination) return;

        const sourceDay = draggedDestination.day;
        const targetDay = targetDestination.day;

        if (sourceDay === targetDay) {
          // Same day reordering
          const dayData = tripDays?.find(d => d.day === sourceDay);
          if (!dayData) return;

          const oldIndex = dayData.destinations.findIndex(dest => dest.id === active.id);
          const newIndex = dayData.destinations.findIndex(dest => dest.id === over.id);

          if (oldIndex === newIndex) return;

          // Create new order array
          const newDestinations = [...dayData.destinations];
          const [movedItem] = newDestinations.splice(oldIndex, 1);
          newDestinations.splice(newIndex, 0, movedItem);

          // Update order indices sequentially
          const reorderedDestinations = newDestinations.map((dest, index) => ({
            ...dest,
            orderIndex: index + 1
          }));

          // Update destinations in parent component
          const updatedAllDestinations = allDestinations.map(dest => {
            const updated = reorderedDestinations.find(rd => rd.id === dest.id);
            return updated || dest;
          });
          
          handleDestinationsChange(updatedAllDestinations);

          // Save to database
          const destinationIds = reorderedDestinations.map(dest => dest.id);
          await reorderDestinations(trip.id, sourceDay, destinationIds);
        } else {
          // Cross-day drop next to specific destination
          const targetDayData = tripDays?.find(d => d.day === targetDay);
          if (!targetDayData) return;

          const targetIndex = targetDayData.destinations.findIndex(dest => dest.id === over.id);
          
          // Insert the destination at the target position
          const updatedTargetDestinations = [...targetDayData.destinations];
          updatedTargetDestinations.splice(targetIndex + 1, 0, {
            ...draggedDestination,
            day: targetDay,
            orderIndex: targetIndex + 2 // Temporary index, will be renumbered
          });

          // Update in database with proper order index
          await moveDestinationToDay(draggedDestination.id, targetDay, targetIndex + 2);

          // Create updated destinations array
          const updatedDestinations = allDestinations
            .filter(dest => dest.id !== draggedDestination.id) // Remove from source
            .map(dest => {
              // Update target day destinations
              if (dest.day === targetDay) {
                const updated = updatedTargetDestinations.find(rd => rd.id === dest.id);
                return updated || dest;
              }
              return dest;
            })
            .concat([{
              ...draggedDestination,
              day: targetDay,
              orderIndex: targetIndex + 2 // Temporary, will be renumbered
            }]);

          // Renumber all destinations in both affected days
          const finalDestinations = renumberDestinationsInDays(updatedDestinations, [sourceDay, targetDay]);
          
          handleDestinationsChange(finalDestinations);

          // Reorder target day in database with proper sequential IDs
          const targetDayDestinations = finalDestinations.filter(dest => dest.day === targetDay);
          const targetDayIds = targetDayDestinations
            .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
            .map(dest => dest.id);
          await reorderDestinations(trip.id, targetDay, targetDayIds);
        }
      }
    } catch (error) {
      console.error('Error handling drag:', error);
    } finally {
      setIsReordering(false);
    }
  };

  // Helper function to renumber destinations sequentially within specified days
  const renumberDestinationsInDays = (destinations: Destination[], daysToRenumber: number[]): Destination[] => {
    return destinations.map(dest => {
      if (daysToRenumber.includes(dest.day)) {
        // Get all destinations for this day and sort by current order
        const dayDestinations = destinations
          .filter(d => d.day === dest.day)
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        
        // Find the new sequential index
        const newIndex = dayDestinations.findIndex(d => d.id === dest.id) + 1;
        
        return {
          ...dest,
          orderIndex: newIndex
        };
      }
      return dest;
    });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => scrollRef.current as HTMLDivElement);
  // View toggle buttons
  const renderViewToggle = () => (
    <div className="flex gap-2 items-center ml-auto">
      <button
        className={`p-2 rounded-full hover:bg-gray-100 transition ${viewMode === 'picture' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
        onClick={() => setViewMode('picture')}
        title="Picture View"
        aria-label="Picture View"
        type="button"
      >
        <PhotoIcon className="w-5 h-5" />
      </button>
      <button
        className={`p-2 rounded-full hover:bg-gray-100 transition ${viewMode === 'compact' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
        onClick={() => setViewMode('compact')}
        title="Compact View"
        aria-label="Compact View"
        type="button"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>
    </div>
  );
  return (
    <div className="h-full flex flex-col min-h-0 bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center">
        <h2 className="text-lg font-semibold text-gray-900">Itinerary</h2>
        <div className="flex items-center gap-2 ml-auto">
          <button
            className={`p-2 rounded-full hover:bg-gray-100 transition ${undoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : 'text-gray-400'}`}
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo"
            aria-label="Undo"
            type="button"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
          <button
            className={`p-2 rounded-full hover:bg-gray-100 transition ${redoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : 'text-gray-400'}`}
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo"
            aria-label="Redo"
            type="button"
          >
            <ArrowUturnRightIcon className="w-5 h-5" />
          </button>
          {renderViewToggle()}
        </div>
      </div>
      {/* In ItineraryPanel, render a gray overlay above the title if selectedPinIds.length > 0 */}
      {/* Place this just before the header/title */}
      {selectedPinIds.length > 0 && (
        <div className="absolute left-0 top-0 w-full flex flex-col items-center z-30">
          <div className="ml-6 mt-0 bg-gray-200/80 border-b border-gray-300 py-3 px-4 flex items-center justify-between shadow-md rounded-b-xl" style={{ maxWidth: '700px', width: '100%' }}>
            <div className="flex items-center gap-4 relative">
              <div className="relative">
                <button className="text-gray-700 text-base font-medium hover:underline hover:text-primary-600 transition" onClick={() => setBulkDropdown(bulkDropdown === 'copy' ? null : 'copy')}>Copy to</button>
                {bulkDropdown === 'copy' && (
                  <div className="absolute left-0 mt-2 bg-white border border-gray-300 rounded shadow z-40 min-w-[120px]">
                    {tripDays?.map(day => (
                      <button key={day.day} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => handleBulkCopyTo(day.day)}>
                        Day {day.day}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button className="text-gray-700 text-base font-medium hover:underline hover:text-primary-600 transition" onClick={() => setBulkDropdown(bulkDropdown === 'move' ? null : 'move')}>Move to</button>
                {bulkDropdown === 'move' && (
                  <div className="absolute left-0 mt-2 bg-white border border-gray-300 rounded shadow z-40 min-w-[120px]">
                    {tripDays?.map(day => (
                      <button key={day.day} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => handleBulkMoveTo(day.day)}>
                        Day {day.day}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="text-red-500 text-base font-medium hover:underline hover:text-red-700 transition" onClick={handleBulkDelete}>Delete</button>
            </div>
            <button className="text-gray-400 hover:text-gray-700 text-2xl font-bold px-2" onClick={() => setSelectedPinIds([])} title="Clear selection">×</button>
          </div>
        </div>
      )}
      {/* Days and Destinations */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-native-scrollbar">
        {/* Quick Add Location - Always visible for ungrouped destinations */}
        {!readOnly && (
          <div className="border-b border-gray-200 p-4 bg-white">
            <LocationSearch
              onLocationSelect={(destination) => {
                // Add as ungrouped destination
                const ungroupedDestination = {
                  ...destination,
                  day: 0,
                  orderIndex: ungroupedDestinations.length + 1,
                };
                onLocationSelect?.(ungroupedDestination);
              }}
              selectedDay={0}
              tripId={trip.id}
              placeholder="Add a place to your trip (will be ungrouped initially)..."
              className="w-full"
              allowUngrouped={true}
            />
          </div>
        )}

        {/* Ungrouped Destinations Section */}
        {ungroupedDestinations.length > 0 && (
          <UngroupedDestinations
            destinations={ungroupedDestinations}
            onDestinationSelect={onDestinationSelect}
            onDestinationDelete={onDestinationDelete}
            onAddTimeToDestination={handleAddTimeToDestination}
            onReorderDestinations={handleReorderUngroupedDestinations}
            selectedPinIds={selectedPinIds}
            handleCheckboxChange={handleCheckboxChange}
            viewMode={viewMode}
            readOnly={readOnly}
          />
        )}

        {tripDays?.map((day) => (
          <div key={day.day} className="border-b border-gray-100">
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
                      items={day.destinations.map((d) => d.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {day.destinations.map((destination, idx) => (
                        <div key={destination.id}>
                          {viewMode === 'compact' ? (
                            <SortableDestination
                              destination={destination}
                              dayColor={day.color}
                              selectedDestination={selectedDestination || null}
                              onDestinationSelect={onDestinationSelect || (() => {})}
                              onDestinationDelete={onDestinationDelete || (() => {})}
                              isLastItem={idx === day.destinations.length - 1}
                              selectedPinIds={selectedPinIds}
                              handleCheckboxChange={handleCheckboxChange}
                            />
                          ) : (
                            <SortableDestinationPicture
                              destination={destination}
                              dayColor={day.color}
                              selectedDestination={selectedDestination || null}
                              onDestinationSelect={onDestinationSelect || (() => {})}
                              onDestinationDelete={onDestinationDelete || (() => {})}
                              isLastItem={idx === day.destinations.length - 1}
                              selectedPinIds={selectedPinIds}
                              handleCheckboxChange={handleCheckboxChange}
                            />
                          )}
                          {/* Only render between-pins area between two gray containers, not after the last pin */}
                          {idx < day.destinations.length - 1 && (
                            <div className="flex flex-col items-center justify-center ml-6 relative z-10 h-10" style={{ alignItems: 'center' }}>
                              <PlusButtonWithMenu onAddPlace={() => {}} onAddNote={() => {}} />
                            </div>
                          )}
                        </div>
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
                
                {/* Add Destination - Location Search */}
                <div className="p-4 border-t border-gray-200">
                  <LocationSearch
                    onLocationSelect={(destination) => {
                      // Set the destination's day and order index
                      const updatedDestination = {
                        ...destination,
                        day: day.day,
                        orderIndex: day.destinations.length + 1,
                      };
                      onLocationSelect?.(updatedDestination);
                      onDaySelect?.(day.day);
                    }}
                    selectedDay={day.day}
                    tripId={trip.id}
                    placeholder={`Search places for Day ${day.day}...`}
                    className="w-full"
                  />
                  

                </div>
                
                {/* Smart Recommendations for this day */}
                <SmartRecommendations
                  trip={trip}
                  tripDays={tripDays || []}
                  selectedDay={day.day}
                  onDestinationAdd={onLocationSelect || (() => {})}
                  existingDestinations={tripDays?.flatMap(d => d.destinations) || []}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ItineraryPanel;

/* Add this to the bottom or in a global CSS file */
// .hide-native-scrollbar {
//   scrollbar-width: none; /* Firefox */
// }
// .hide-native-scrollbar::-webkit-scrollbar {
//   display: none; /* Chrome, Safari */
// } 