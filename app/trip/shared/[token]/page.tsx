'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trip, Destination } from '@/types';
import { getTripByShareToken } from '@/lib/sharing-service';
import { getTripDestinations } from '@/lib/destination-service';
import { useAuth } from '@/lib/auth-context';
import ItineraryPanel from '@/components/trip/ItineraryPanel';
import TripMap from '@/components/map/TripMap';
import { TripDay, getDayColor } from '@/types';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { 
  GlobeAltIcon, 
  LockClosedIcon, 
  UserIcon,
  CalendarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export default function SharedTripPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = params.token as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    if (!token) return;
    
    loadSharedTrip();
  }, [token, user]);

  const loadSharedTrip = async () => {
    try {
      setLoading(true);
      setError(null);

      const { trip: sharedTrip, permission: tripPermission } = await getTripByShareToken(token);
      
      if (!sharedTrip) {
        setError('This trip link is invalid or has expired.');
        return;
      }

      // Check if edit permission requires authentication
      if (tripPermission === 'edit' && !sharedTrip.shareSettings?.allowPublicEdit && !user) {
        setRequiresAuth(true);
        return;
      }

      setTrip(sharedTrip);
      setPermission(tripPermission);

      // Load destinations
      const tripDestinations = await getTripDestinations(sharedTrip.id);
      setDestinations(tripDestinations);

      // Generate trip days
      const startDate = parseISO(sharedTrip.startDate);
      const endDate = parseISO(sharedTrip.endDate);
      const totalDays = differenceInDays(endDate, startDate) + 1;

      const generatedTripDays: TripDay[] = [];
      for (let i = 0; i < totalDays; i++) {
        const dayNumber = i + 1;
        const currentDate = addDays(startDate, i);
        const dayDestinations = tripDestinations
          .filter(dest => dest.day === dayNumber)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        generatedTripDays.push({
          day: dayNumber,
          date: format(currentDate, 'yyyy-MM-dd'),
          color: getDayColor(dayNumber),
          destinations: dayDestinations
        });
      }

      setTripDays(generatedTripDays);
    } catch (error) {
      console.error('Error loading shared trip:', error);
      setError('Failed to load trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationsChange = (newDestinations: Destination[]) => {
    if (permission !== 'edit') return;
    
    setDestinations(newDestinations);
    // Regenerate trip days
    regenerateTripDays(newDestinations);
  };

  const regenerateTripDays = (destinations: Destination[]) => {
    if (!trip) return;

    const startDate = parseISO(trip.startDate);
    const endDate = parseISO(trip.endDate);
    const totalDays = differenceInDays(endDate, startDate) + 1;

    const updatedTripDays: TripDay[] = [];
    for (let i = 0; i < totalDays; i++) {
      const dayNumber = i + 1;
      const currentDate = addDays(startDate, i);
      const dayDestinations = destinations
        .filter(dest => dest.day === dayNumber)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      updatedTripDays.push({
        day: dayNumber,
        date: format(currentDate, 'yyyy-MM-dd'),
        color: getDayColor(dayNumber),
        destinations: dayDestinations
      });
    }

    setTripDays(updatedTripDays);
  };

  const handleDestinationSelect = (destination: Destination) => {
    setSelectedDestination(destination);
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
  };

  const handleLocationSelect = (destination: Destination) => {
    // Add destination to the trip
    const newDestinations = [...destinations, destination];
    handleDestinationsChange(newDestinations);
  };

  const handleDestinationDelete = (destinationId: string) => {
    const filteredDestinations = destinations.filter(dest => dest.id !== destinationId);
    handleDestinationsChange(filteredDestinations);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared trip...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Trip Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (requiresAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            This trip allows editing but requires you to be logged in. Please sign in to continue.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="w-full px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const canEdit = permission === 'edit' && (user || trip.shareSettings?.allowPublicEdit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                  {permission === 'edit' ? (
                    <>
                      <LockClosedIcon className="w-3 h-3 text-blue-600" />
                      <span className="text-blue-600">Can Edit</span>
                    </>
                  ) : (
                    <>
                      <GlobeAltIcon className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">View Only</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {trip.location}
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </div>
              </div>
              
              {trip.description && (
                <p className="text-gray-600 mt-2">{trip.description}</p>
              )}
            </div>

            {!canEdit && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Want to create your own trips?</p>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Sign Up Free
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Itinerary Panel */}
        <div className="w-1/2 bg-white border-r border-gray-200">
          <ItineraryPanel
            trip={trip}
            tripDays={tripDays}
            selectedDay={selectedDay}
            selectedDestination={selectedDestination}
            onDaySelect={handleDaySelect}
            onDestinationSelect={handleDestinationSelect}
            onDestinationsChange={canEdit ? handleDestinationsChange : () => {}}
            onLocationSelect={canEdit ? handleLocationSelect : () => {}}
            onDestinationDelete={canEdit ? handleDestinationDelete : () => {}}
          />
        </div>

        {/* Map Panel */}
        <div className="w-1/2">
          <TripMap
            trip={trip}
            destinations={destinations}
            onDestinationAdd={canEdit ? (dest) => setDestinations([...destinations, dest]) : undefined}
            readOnly={!canEdit}
          />
        </div>
      </div>

      {/* Footer for shared view */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <div>
            Shared trip via <span className="font-medium">Travel Planner</span>
          </div>
          <div>
            {permission === 'view' ? 'Read-only access' : 'Collaborative editing enabled'}
          </div>
        </div>
      </div>
    </div>
  );
}