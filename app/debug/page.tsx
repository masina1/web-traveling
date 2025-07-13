'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserTrips } from '@/lib/trip-service';
import { Trip } from '@/types';
import Link from 'next/link';

export default function DebugPage() {
  const { user, loading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      loadTrips();
    }
  }, [user, loading]);

  const loadTrips = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const userTrips = await getUserTrips(user.uid);
      setTrips(userTrips);
    } catch (err) {
      console.error('Error loading trips:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view debug information</p>
          <Link href="/login" className="btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Debug Information</h1>
            <div className="flex space-x-2">
              <Link href="/dashboard" className="btn-secondary">
                Dashboard
              </Link>
              <Link href="/test-map" className="btn-secondary">
                Test Map
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Authentication Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">User Info</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">UID:</span> {user.uid}</div>
                <div><span className="font-medium">Email:</span> {user.email}</div>
                <div><span className="font-medium">Display Name:</span> {user.displayName || 'Not set'}</div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Firebase Status</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Auth State:</span> ✅ Authenticated</div>
                <div><span className="font-medium">Project ID:</span> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</div>
                <div><span className="font-medium">API Key:</span> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Environment Variables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Firebase Config</h3>
              <div className="text-sm space-y-1">
                <div>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</div>
                <div>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing'}</div>
                <div>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</div>
                <div>Storage Bucket: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing'}</div>
                <div>Messaging Sender ID: {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing'}</div>
                <div>App ID: {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}</div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Maps Config</h3>
              <div className="text-sm space-y-1">
                <div>Google Maps API Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing'}</div>
                <div>Google Places API Key: {process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? '✅ Set' : '❌ Missing'}</div>
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                  <div>Key Preview: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 20)}...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Trip Data</h2>
            <button
              onClick={loadTrips}
              disabled={isLoading}
              className={`btn-secondary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Loading...' : 'Reload Trips'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ Error: {error}</p>
            </div>
          )}

          {trips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No trips found in your account.</p>
              <p className="text-sm mt-2">
                <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
                  Go to Dashboard
                </Link> to create your first trip.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Found {trips.length} trip{trips.length === 1 ? '' : 's'} in your account:
              </div>
              
              {trips.map((trip) => (
                <div key={trip.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{trip.name}</h3>
                    <div className="flex space-x-2">
                      <Link 
                        href={`/trip/${trip.id}`}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        View Trip
                      </Link>
                      <button
                        onClick={() => navigator.clipboard.writeText(trip.id)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Copy ID
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">ID:</span> {trip.id}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {trip.location}
                    </div>
                    <div>
                      <span className="font-medium">Dates:</span> {trip.startDate} to {trip.endDate}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Public:</span> {trip.isPublic ? 'Yes' : 'No'} |{' '}
                    <span className="font-medium">Created:</span> {trip.createdAt.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/test-map" className="btn-secondary text-center">
              Test Map Functionality
            </Link>
            <Link href="/dashboard" className="btn-secondary text-center">
              Go to Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 