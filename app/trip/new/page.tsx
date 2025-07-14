'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CreateTripForm from '@/components/trip/CreateTripForm';
import Link from 'next/link';

export default function NewTripPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleTripCreated = (tripId: string) => {
    // Redirect to the newly created trip
    router.push(`/trip/${tripId}`);
  };

  const handleCancel = () => {
    router.push('/dashboard');
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-2xl font-bold text-gray-900">Create New Trip</h1>
                <p className="text-sm text-gray-600">Plan your next adventure</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <CreateTripForm
          onSuccess={handleTripCreated}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
} 