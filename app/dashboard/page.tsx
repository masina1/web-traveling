'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user]);

  const fetchTrips = async () => {
    if (!user) return;
    
    try {
      const tripsCollection = collection(db, 'trips');
      const tripsSnapshot = await getDocs(tripsCollection);
      const tripsData = tripsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Trip))
        .filter(trip => trip.userId === user.uid);
      
      setTrips(tripsData);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    
    try {
      await deleteDoc(doc(db, 'trips', tripId));
      setTrips(trips.filter(trip => trip.id !== tripId));
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  if (loading || loadingTrips) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/trip/new')}
                className="btn-primary"
              >
                + Create New Trip
              </button>
              <button
                onClick={() => router.push('/login')}
                className="btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="container mx-auto px-4 py-8">
        {trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
            <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
            <button
              onClick={() => router.push('/trip/new')}
              className="btn-primary"
            >
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div key={trip.id} className="card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{trip.name}</h3>
                  <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-gray-600">
                    <span className="font-medium">📍 Location:</span> {trip.location}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">📅 Dates:</span> {trip.startDate} - {trip.endDate}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">👥 Visibility:</span> {trip.isPublic ? 'Public' : 'Private'}
                  </p>
                </div>
                
                <button
                  onClick={() => router.push(`/trip/${trip.id}`)}
                  className="w-full btn-primary"
                >
                  View & Edit Trip
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 