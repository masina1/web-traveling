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
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { Destination, CreateDestinationData, UpdateDestinationData } from '@/types';
import { logTripActivity, getUserTripPermission } from './sharing-service';

const DESTINATIONS_COLLECTION = 'destinations';

// Create a new destination
export async function createDestination(destinationData: CreateDestinationData): Promise<string> {
  try {
    // Validate required fields
    if (!destinationData.tripId) {
      throw new Error('Trip ID is required');
    }
    if (!destinationData.locationName) {
      throw new Error('Location name is required');
    }
    if (!destinationData.address) {
      throw new Error('Address is required');
    }
    if (typeof destinationData.lat !== 'number' || typeof destinationData.lng !== 'number') {
      throw new Error('Valid coordinates are required');
    }
    if (typeof destinationData.day !== 'number' || destinationData.day < 0) {
      throw new Error('Valid day number is required (0 for ungrouped, 1+ for specific days)');
    }
    if (!destinationData.orderIndex || destinationData.orderIndex < 1) {
      throw new Error('Valid order index is required');
    }

    // Clean the data - remove undefined values that might cause Firestore issues
    const cleanedData: any = {
      tripId: destinationData.tripId,
      locationName: destinationData.locationName,
      address: destinationData.address,
      lat: destinationData.lat,
      lng: destinationData.lng,
      day: destinationData.day,
      orderIndex: destinationData.orderIndex,
    };

    // Add optional fields only if they have valid values
    if (destinationData.startTime) cleanedData.startTime = destinationData.startTime;
    if (destinationData.endTime) cleanedData.endTime = destinationData.endTime;
    if (destinationData.notes) cleanedData.notes = destinationData.notes;
    if (destinationData.placeId) cleanedData.placeId = destinationData.placeId;
    if (destinationData.category) cleanedData.category = destinationData.category;
    if (typeof destinationData.rating === 'number') cleanedData.rating = destinationData.rating;
    if (typeof destinationData.priceLevel === 'number') cleanedData.priceLevel = destinationData.priceLevel;
    if (destinationData.photos && destinationData.photos.length > 0) cleanedData.photos = destinationData.photos;

    const destinationWithTimestamps = {
      ...cleanedData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, DESTINATIONS_COLLECTION), destinationWithTimestamps);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating destination:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
    });
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

// Collaborative editing functions with permission checks and conflict resolution

// Create destination with permission check and activity logging
export async function createDestinationWithAuth(
  destinationData: CreateDestinationData,
  userId: string,
  userDisplayName?: string
): Promise<string> {
  try {
    // Check user permission
    const permission = await getUserTripPermission(destinationData.tripId, userId);
    if (permission !== 'owner' && permission !== 'edit') {
      throw new Error('Insufficient permissions to add destinations');
    }

    const destinationId = await createDestination(destinationData);
    
    // Log activity
    await logTripActivity(
      destinationData.tripId,
      userId,
      'added_destination',
      `Added destination: ${destinationData.locationName}`,
      userDisplayName
    );

    return destinationId;
  } catch (error) {
    console.error('Error creating destination with auth:', error);
    throw error;
  }
}

// Update destination with permission check and conflict resolution
export async function updateDestinationWithAuth(
  destinationId: string,
  updates: UpdateDestinationData,
  userId: string,
  userDisplayName?: string
): Promise<void> {
  try {
    return await runTransaction(db, async (transaction) => {
      const destinationRef = doc(db, DESTINATIONS_COLLECTION, destinationId);
      const destinationDoc = await transaction.get(destinationRef);
      
      if (!destinationDoc.exists()) {
        throw new Error('Destination not found');
      }

      const destinationData = destinationDoc.data() as Destination;
      
      // Check user permission
      const permission = await getUserTripPermission(destinationData.tripId, userId);
      if (permission !== 'owner' && permission !== 'edit') {
        throw new Error('Insufficient permissions to edit destinations');
      }

      // Check for conflicts (simple last-writer-wins for now)
      if (updates.updatedAt && destinationData.updatedAt) {
        const localUpdate = updates.updatedAt instanceof Date ? updates.updatedAt : updates.updatedAt.toDate();
        const serverUpdate = destinationData.updatedAt instanceof Date ? destinationData.updatedAt : destinationData.updatedAt.toDate();
        
        if (localUpdate < serverUpdate) {
          console.warn('Potential conflict detected, server version is newer');
          // For now, we'll proceed with last-writer-wins
          // In the future, we could implement more sophisticated conflict resolution
        }
      }

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      transaction.update(destinationRef, updateData);

      // Log activity (outside transaction)
      setTimeout(() => {
        logTripActivity(
          destinationData.tripId,
          userId,
          'updated_destination',
          `Updated destination: ${destinationData.locationName}`,
          userDisplayName
        );
      }, 0);
    });
  } catch (error) {
    console.error('Error updating destination with auth:', error);
    throw error;
  }
}

// Delete destination with permission check
export async function deleteDestinationWithAuth(
  destinationId: string,
  userId: string,
  userDisplayName?: string
): Promise<void> {
  try {
    // Get destination first to check trip and log activity
    const destinationRef = doc(db, DESTINATIONS_COLLECTION, destinationId);
    const destinationDoc = await getDoc(destinationRef);
    
    if (!destinationDoc.exists()) {
      throw new Error('Destination not found');
    }

    const destinationData = destinationDoc.data() as Destination;
    
    // Check user permission
    const permission = await getUserTripPermission(destinationData.tripId, userId);
    if (permission !== 'owner' && permission !== 'edit') {
      throw new Error('Insufficient permissions to delete destinations');
    }

    await deleteDestination(destinationId);
    
    // Log activity
    await logTripActivity(
      destinationData.tripId,
      userId,
      'removed_destination',
      `Removed destination: ${destinationData.locationName}`,
      userDisplayName
    );
  } catch (error) {
    console.error('Error deleting destination with auth:', error);
    throw error;
  }
}

// Reorder destinations with permission check
export async function reorderDestinationsWithAuth(
  destinations: Destination[],
  userId: string,
  userDisplayName?: string
): Promise<void> {
  try {
    if (destinations.length === 0) return;
    
    // Check user permission for the trip
    const permission = await getUserTripPermission(destinations[0].tripId, userId);
    if (permission !== 'owner' && permission !== 'edit') {
      throw new Error('Insufficient permissions to reorder destinations');
    }

    await reorderDestinations(destinations);
    
    // Log activity
    await logTripActivity(
      destinations[0].tripId,
      userId,
      'updated_destination',
      `Reordered destinations`,
      userDisplayName
    );
  } catch (error) {
    console.error('Error reordering destinations with auth:', error);
    throw error;
  }
}

// Move destination to different day with permission check
export async function moveDestinationToDayWithAuth(
  destinationId: string,
  newDay: number,
  userId: string,
  userDisplayName?: string
): Promise<void> {
  try {
    // Get destination first to check trip and log activity
    const destinationRef = doc(db, DESTINATIONS_COLLECTION, destinationId);
    const destinationDoc = await getDoc(destinationRef);
    
    if (!destinationDoc.exists()) {
      throw new Error('Destination not found');
    }

    const destinationData = destinationDoc.data() as Destination;
    
    // Check user permission
    const permission = await getUserTripPermission(destinationData.tripId, userId);
    if (permission !== 'owner' && permission !== 'edit') {
      throw new Error('Insufficient permissions to move destinations');
    }

    await moveDestinationToDay(destinationId, newDay);
    
    // Log activity
    await logTripActivity(
      destinationData.tripId,
      userId,
      'moved_destination',
      `Moved ${destinationData.locationName} to day ${newDay}`,
      userDisplayName
    );
  } catch (error) {
    console.error('Error moving destination with auth:', error);
    throw error;
  }
} 