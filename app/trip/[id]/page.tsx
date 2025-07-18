'use client';

import { useRef, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getTrip } from '@/lib/trip-service';
import { getTripDestinations, createDestination, deleteDestination } from '@/lib/destination-service';
import { Trip, Destination, TripDay, getDayColor, CreateDestinationData } from '@/types';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import Link from 'next/link';
import TripMap from '@/components/map/TripMap';
import ItineraryPanel from '@/components/trip/ItineraryPanel';
import CustomScrollbar from '@/components/ui/CustomScrollbar';

export default function TripDetailPage() {
  const itineraryRef = useRef<HTMLDivElement>(null);
  const [splitHeight, setSplitHeight] = useState(0);
  const splitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (splitRef.current) {
        setSplitHeight(splitRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isAddingDestination, setIsAddingDestination] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Mobile responsive state
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);
  const [isMobileItineraryOpen, setIsMobileItineraryOpen] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load trip and destinations
  useEffect(() => {
    async function loadTripData() {
      if (!id || !user) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load trip
        const tripData = await getTrip(id as string);
        if (!tripData) {
          setError('Trip not found');
          return;
        }

        // Check if user owns this trip
        if (tripData.userId !== user.uid) {
          setError('You do not have permission to view this trip');
          return;
        }

        setTrip(tripData);

        // Load destinations
        const destinationsData = await getTripDestinations(id as string);
        setDestinations(destinationsData);

        // Generate trip days
        const startDate = parseISO(tripData.startDate);
        const endDate = parseISO(tripData.endDate);
        const totalDays = differenceInDays(endDate, startDate) + 1;

        const days: TripDay[] = [];
        for (let i = 0; i < totalDays; i++) {
          const dayNumber = i + 1;
          const dayDate = addDays(startDate, i);
          const dayDestinations = destinationsData.filter(d => d.day === dayNumber);
          
          days.push({
            day: dayNumber,
            date: format(dayDate, 'yyyy-MM-dd'),
            destinations: dayDestinations,
            color: getDayColor(dayNumber),
          });
        }

        setTripDays(days);
      } catch (err) {
        console.error('Error loading trip:', err);
        setError('Failed to load trip data');
      } finally {
        setIsLoading(false);
      }
    }

    loadTripData();
  }, [id, user]);

  // Handle destination selection from map
  const handleDestinationSelect = (destination: Destination) => {
    setSelectedDestination(destination);
    setSelectedDay(destination.day);
  };

  // Handle day selection from itinerary
  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    setSelectedDestination(null);
  };

  // Handle destinations change (reordering, etc.)
  const handleDestinationsChange = (newDestinations: Destination[]) => {
    // Update destinations state
    setDestinations(newDestinations);
    
    // Update tripDays state to reflect the new order
    const updatedTripDays = tripDays.map(day => ({
      ...day,
      destinations: newDestinations
        .filter(dest => dest.day === day.day)
        .sort((a, b) => a.orderIndex - b.orderIndex)
    }));
    
    setTripDays(updatedTripDays);
  };

  // Handle adding a new destination from map
  const handleDestinationAdd = async (destinationData: Destination) => {
    try {
      setIsAddingDestination(true);
      setError(null);
      setSuccessMessage(null);

      console.log('Adding destination from map:', destinationData);

      // Validate the destination data before sending to database
      if (!destinationData.tripId || !destinationData.locationName || !destinationData.address) {
        throw new Error('Missing required destination information');
      }

      // Create the destination data for saving to database
      const createData: CreateDestinationData = {
        tripId: destinationData.tripId,
        locationName: destinationData.locationName,
        address: destinationData.address,
        lat: destinationData.lat,
        lng: destinationData.lng,
        day: destinationData.day,
        orderIndex: destinationData.orderIndex,
        startTime: destinationData.startTime,
        endTime: destinationData.endTime,
        notes: destinationData.notes,
        placeId: destinationData.placeId,
        category: destinationData.category,
        rating: destinationData.rating,
        priceLevel: destinationData.priceLevel,
        photos: destinationData.photos,
      };

      console.log('Sending to database:', createData);

      // Save to database
      const newDestinationId = await createDestination(createData);
      
      console.log('Destination created with ID:', newDestinationId);

      // Create the full destination object with the new ID
      const newDestination: Destination = {
        ...destinationData,
        id: newDestinationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update destinations state
      setDestinations(prev => [...prev, newDestination]);

      // Update tripDays state to include the new destination in the correct day
      setTripDays(prev => prev.map(day => 
        day.day === newDestination.day 
          ? { 
              ...day, 
              destinations: [...day.destinations, newDestination]
                .sort((a, b) => a.orderIndex - b.orderIndex)
            }
          : day
      ));

      // Auto-select the new destination
      setSelectedDestination(newDestination);
      
      // Show success message
      setSuccessMessage(`Added "${newDestination.locationName}" to Day ${newDestination.day}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
      console.log('Destination added successfully');
      
    } catch (error) {
      console.error('Error adding destination:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to add destination. ';
      
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage += 'Permission denied. Please check your login status.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Network error. Please check your internet connection.';
        } else if (error.message.includes('required')) {
          errorMessage += 'Missing required information from the location.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsAddingDestination(false);
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

  const handleDestinationDelete = async (destinationId: string) => {
    try {
      setError(null);
      
      // Find the destination to delete
      const destinationToDelete = destinations.find(d => d.id === destinationId);
      if (!destinationToDelete) {
        setError('Destination not found');
        return;
      }

      // Show confirmation dialog
      const isConfirmed = window.confirm(
        `Are you sure you want to delete "${destinationToDelete.locationName}"? This action cannot be undone.`
      );
      
      if (!isConfirmed) {
        return;
      }

      // Delete from database
      await deleteDestination(destinationId);

      // Update destinations state and renumber
      const updatedDestinations = destinations.filter(d => d.id !== destinationId);
      const finalDestinations = renumberDestinationsInDays(updatedDestinations, [destinationToDelete.day]);
      
      setDestinations(finalDestinations);

      // Update tripDays state to remove the destination and renumber remaining ones
      setTripDays(prev => prev.map(day => {
        if (day.day === destinationToDelete.day) {
          const dayDestinations = finalDestinations
            .filter(d => d.day === day.day)
            .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
          
          return {
            ...day,
            destinations: dayDestinations
          };
        }
        return day;
      }));

      // Clear selected destination if it was the deleted one
      if (selectedDestination?.id === destinationId) {
        setSelectedDestination(null);
      }
      
      console.log('Destination deleted successfully');
      
    } catch (error) {
      console.error('Error deleting destination:', error);
      
      let errorMessage = 'Failed to delete destination. ';
      
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage += 'Permission denied. Please check your login status.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Network error. Please check your internet connection.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again.';
      }
      
      setError(errorMessage);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 w-full">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
                <p className="text-gray-600 flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{trip.location}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')}
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{tripDays.length} days</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="btn-secondary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </button>
              <button className="btn-secondary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Trip
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages - Only show on mobile or when constrained */}
      <div className="lg:hidden px-4">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">✅ {successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Mobile Toggle Buttons */}
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex">
              <button
                onClick={() => {
                  setIsMobileItineraryOpen(true);
                  setIsMobileMapOpen(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isMobileItineraryOpen
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Itinerary
              </button>
              <button
                onClick={() => {
                  setIsMobileMapOpen(true);
                  setIsMobileItineraryOpen(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isMobileMapOpen
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: Success/Error Messages - Fixed position overlay */}
        <div className="hidden lg:block fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-96">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg shadow-lg">
              <p className="text-green-700 text-sm">✅ {successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}
        </div>

      {/* Full-width layout - Seamless edge-to-edge panels */}
      <div ref={splitRef} className="lg:flex lg:h-[calc(100vh-120px)] xl:h-[calc(100vh-120px)] 2xl:h-[calc(100vh-120px)] min-h-0 overflow-y-auto relative">
        {/* Left Panel - Itinerary (50%) - Scrollable */}
        <div className={`
          w-1/2 lg:block
          ${isMobileItineraryOpen ? 'block' : 'hidden lg:block'}
          h-full bg-white flex flex-col min-h-0
        `}>
          <ItineraryPanel
            ref={itineraryRef}
            trip={trip}
            tripDays={tripDays}
            selectedDay={selectedDay}
            selectedDestination={selectedDestination}
            onDaySelect={handleDaySelect}
            onDestinationSelect={handleDestinationSelect}
            onDestinationsChange={handleDestinationsChange}
            onLocationSelect={handleDestinationAdd}
            onDestinationDelete={handleDestinationDelete}
          />
        </div>

        {/* Right Panel - Map (50%) - Full Height */}
        <div className={`
          w-1/2 lg:block
          ${isMobileMapOpen ? 'block' : 'hidden lg:block'}
          h-full bg-white flex flex-col min-h-0
        `}>
          <TripMap
            trip={trip}
            destinations={destinations}
            tripDays={tripDays}
            selectedDestination={selectedDestination}
            selectedDay={selectedDay}
            onDestinationSelect={handleDestinationSelect}
            onDestinationAdd={handleDestinationAdd}
            isAddingDestination={isAddingDestination}
          />
        </div>
        {/* Custom Scrollbar (desktop only) */}
        <div className="hidden lg:block">
          <CustomScrollbar
            containerRef={itineraryRef}
            height={splitHeight}
            top={splitRef.current ? splitRef.current.getBoundingClientRect().top : 0}
          />
        </div>
      </div>
    </div>
  );
} 