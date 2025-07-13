'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CreateTripForm from '@/components/trip/CreateTripForm';
import TripList from '@/components/trip/TripList';
import { Trip } from '@/types';

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleCreateTripSuccess = (tripId: string) => {
    setShowCreateForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    // For now, we'll just log this - edit functionality can be added later
    console.log('Edit trip:', trip);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🌍 Travel Planner
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.displayName}</span>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {showCreateForm ? (
            <div className="max-w-2xl mx-auto">
              <CreateTripForm
                onSuccess={handleCreateTripSuccess}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          ) : (
            <TripList
              onEditTrip={handleEditTrip}
              onCreateTrip={() => setShowCreateForm(true)}
              refreshTrigger={refreshTrigger}
            />
          )}
        </div>
      </main>
    </div>
  );
} 