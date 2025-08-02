import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Trip, CreateTripData, UpdateTripData } from '@/types';
import { deleteAllTripDestinations } from './destination-service';

const TRIPS_COLLECTION = 'trips';

// Create a new trip
export async function createTrip(tripData: CreateTripData): Promise<string> {
  try {
    const tripWithTimestamps = {
      ...tripData,
      shareSettings: tripData.shareSettings || {
        isPublic: tripData.isPublic || false,
        allowPublicView: tripData.isPublic || false,
        allowPublicEdit: false,
        sharedUsers: [],
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, TRIPS_COLLECTION), tripWithTimestamps);
    return docRef.id;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
}

// Get all trips for a user
export async function getUserTrips(userId: string): Promise<Trip[]> {
  try {
    const q = query(
      collection(db, TRIPS_COLLECTION),
      where('userId', '==', userId)
      // Removed orderBy to avoid composite index requirement
    );
    
    const querySnapshot = await getDocs(q);
    const trips: Trip[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      trips.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Trip);
    });
    
    // Sort by createdAt in descending order (newest first)
    return trips.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching user trips:', error);
    throw error;
  }
}

// Get a single trip by ID
export async function getTrip(tripId: string): Promise<Trip | null> {
  try {
    const docRef = doc(db, TRIPS_COLLECTION, tripId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Trip;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw error;
  }
}

// Update a trip
export async function updateTrip(tripId: string, updates: UpdateTripData): Promise<void> {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(tripRef, updateData);
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
}

// Delete a trip
export async function deleteTrip(tripId: string): Promise<void> {
  try {
    // First delete all destinations associated with this trip
    await deleteAllTripDestinations(tripId);
    
    // Then delete the trip itself
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    await deleteDoc(tripRef);
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
}

// Get public trips (for future sharing feature)
export async function getPublicTrips(): Promise<Trip[]> {
  try {
    const q = query(
      collection(db, TRIPS_COLLECTION),
      where('isPublic', '==', true)
      // Removed orderBy to avoid composite index requirement
    );
    
    const querySnapshot = await getDocs(q);
    const trips: Trip[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      trips.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Trip);
    });
    
    // Sort by createdAt in descending order (newest first)
    return trips.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching public trips:', error);
    throw error;
  }
} 