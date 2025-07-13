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
import { Destination, CreateDestinationData, UpdateDestinationData } from '@/types';

const DESTINATIONS_COLLECTION = 'destinations';

// Create a new destination
export async function createDestination(destinationData: CreateDestinationData): Promise<string> {
  try {
    const destinationWithTimestamps = {
      ...destinationData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, DESTINATIONS_COLLECTION), destinationWithTimestamps);
    return docRef.id;
  } catch (error) {
    console.error('Error creating destination:', error);
    throw error;
  }
}

// Get all destinations for a trip
export async function getTripDestinations(tripId: string): Promise<Destination[]> {
  try {
    const q = query(
      collection(db, DESTINATIONS_COLLECTION),
      where('tripId', '==', tripId)
    );
    
    const querySnapshot = await getDocs(q);
    const destinations: Destination[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      destinations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Destination);
    });
    
    // Sort by day first, then by orderIndex within each day
    return destinations.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.orderIndex - b.orderIndex;
    });
  } catch (error) {
    console.error('Error fetching trip destinations:', error);
    throw error;
  }
}

// Get destinations for a specific day of a trip
export async function getTripDestinationsByDay(tripId: string, day: number): Promise<Destination[]> {
  try {
    const q = query(
      collection(db, DESTINATIONS_COLLECTION),
      where('tripId', '==', tripId),
      where('day', '==', day)
    );
    
    const querySnapshot = await getDocs(q);
    const destinations: Destination[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      destinations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Destination);
    });
    
    // Sort by orderIndex within the day
    return destinations.sort((a, b) => a.orderIndex - b.orderIndex);
  } catch (error) {
    console.error('Error fetching destinations by day:', error);
    throw error;
  }
}

// Get a single destination by ID
export async function getDestination(destinationId: string): Promise<Destination | null> {
  try {
    const docRef = doc(db, DESTINATIONS_COLLECTION, destinationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Destination;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching destination:', error);
    throw error;
  }
}

// Update a destination
export async function updateDestination(destinationId: string, updates: UpdateDestinationData): Promise<void> {
  try {
    const destinationRef = doc(db, DESTINATIONS_COLLECTION, destinationId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(destinationRef, updateData);
  } catch (error) {
    console.error('Error updating destination:', error);
    throw error;
  }
}

// Delete a destination
export async function deleteDestination(destinationId: string): Promise<void> {
  try {
    const destinationRef = doc(db, DESTINATIONS_COLLECTION, destinationId);
    await deleteDoc(destinationRef);
  } catch (error) {
    console.error('Error deleting destination:', error);
    throw error;
  }
}

// Reorder destinations within a day
export async function reorderDestinations(tripId: string, day: number, destinationIds: string[]): Promise<void> {
  try {
    const updatePromises = destinationIds.map((destinationId, index) => {
      return updateDestination(destinationId, { orderIndex: index + 1 });
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error reordering destinations:', error);
    throw error;
  }
}

// Move destination to a different day
export async function moveDestinationToDay(
  destinationId: string, 
  newDay: number, 
  newOrderIndex: number
): Promise<void> {
  try {
    await updateDestination(destinationId, { 
      day: newDay, 
      orderIndex: newOrderIndex 
    });
  } catch (error) {
    console.error('Error moving destination to day:', error);
    throw error;
  }
}

// Get next available order index for a day
export async function getNextOrderIndex(tripId: string, day: number): Promise<number> {
  try {
    const destinations = await getTripDestinationsByDay(tripId, day);
    return destinations.length + 1;
  } catch (error) {
    console.error('Error getting next order index:', error);
    return 1;
  }
}

// Delete all destinations for a trip (used when deleting a trip)
export async function deleteAllTripDestinations(tripId: string): Promise<void> {
  try {
    const destinations = await getTripDestinations(tripId);
    const deletePromises = destinations.map(destination => 
      deleteDestination(destination.id)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting all trip destinations:', error);
    throw error;
  }
} 