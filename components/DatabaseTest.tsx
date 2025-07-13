'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createDestination } from '@/lib/destination-service';
import { CreateDestinationData } from '@/types';

export default function DatabaseTest() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testDatabaseConnection = async () => {
    if (!user) {
      setTestResult('❌ No user logged in');
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const testDestination: CreateDestinationData = {
        tripId: 'test-trip-id',
        locationName: 'Test Location',
        address: '123 Test Street, Test City',
        lat: 40.7128,
        lng: -74.0060,
        day: 1,
        orderIndex: 1,
      };

      console.log('Testing database connection...');
      const destinationId = await createDestination(testDestination);
      
      setTestResult(`✅ Database connection successful! Created test destination with ID: ${destinationId}`);
    } catch (error) {
      console.error('Database test failed:', error);
      setTestResult(`❌ Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          This will test the Firebase database connection by attempting to create a test destination.
        </p>
        <button
          onClick={testDatabaseConnection}
          disabled={isLoading || !user}
          className={`btn-primary ${isLoading || !user ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Testing...' : 'Test Database Connection'}
        </button>
      </div>

      {testResult && (
        <div className={`p-3 rounded-lg ${testResult.startsWith('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${testResult.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>
            {testResult}
          </p>
        </div>
      )}

      {!user && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm">
            ⚠️ Please log in to test the database connection
          </p>
        </div>
      )}
    </div>
  );
} 