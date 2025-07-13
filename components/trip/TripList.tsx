'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserTrips, deleteTrip } from '@/lib/trip-service';
import { Trip } from '@/types';
import { format } from 'date-fns';

interface TripListProps {
  onEditTrip?: (trip: Trip) => void;
  onCreateTrip?: () => void;
  refreshTrigger?: number;
}

export default function TripList({ onEditTrip, onCreateTrip, refreshTrigger }: TripListProps) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTrips = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userTrips = await getUserTrips(user.uid);
      setTrips(userTrips);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user, refreshTrigger]);

  const handleDeleteTrip = async (tripId: string, tripName: string) => {
    if (!confirm(`Are you sure you want to delete "${tripName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setDeletingId(tripId);
      await deleteTrip(tripId);
      setTrips(prev => prev.filter(trip => trip.id !== tripId));
    } catch (error: any) {
      setError(error.message || 'Failed to delete trip');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = format(new Date(startDate), 'MMM d');
      const end = format(new Date(endDate), 'MMM d, yyyy');
      return `${start} - ${end}`;
    } catch {
      return 'Invalid date range';
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your trips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="rounded-xl bg-red-50 p-4 mb-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
        <button onClick={fetchTrips} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
        <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
        {onCreateTrip && (
          <button onClick={onCreateTrip} className="btn-primary">
            Create Your First Trip
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Trips</h2>
        {onCreateTrip && (
          <button onClick={onCreateTrip} className="btn-primary">
            + New Trip
          </button>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <div key={trip.id} className="card hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {trip.name}
              </h3>
              {trip.isPublic && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Public
                </span>
              )}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-gray-600">
                <span className="text-lg mr-2">📍</span>
                <span className="text-sm truncate">{trip.location}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <span className="text-lg mr-2">📅</span>
                <span className="text-sm">{formatDateRange(trip.startDate, trip.endDate)}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <span className="text-lg mr-2">⏱️</span>
                <span className="text-sm">{calculateDuration(trip.startDate, trip.endDate)} days</span>
              </div>
            </div>
            
            {trip.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {trip.description}
              </p>
            )}
            
            <div className="flex gap-2">
              {onEditTrip && (
                <button
                  onClick={() => onEditTrip(trip)}
                  className="flex-1 btn-secondary text-sm"
                >
                  Edit
                </button>
              )}
              
              <button
                onClick={() => handleDeleteTrip(trip.id, trip.name)}
                disabled={deletingId === trip.id}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
              >
                {deletingId === trip.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 