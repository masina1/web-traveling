import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Trip, SharedUser, ShareLink, TripActivity } from '@/types';

const TRIPS_COLLECTION = 'trips';
const SHARE_LINKS_COLLECTION = 'shareLinks';
const TRIP_ACTIVITY_COLLECTION = 'tripActivity';

// Generate a unique share token
function generateShareToken(): string {
  return Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
}

// Create or update a shareable link for a trip
export async function createShareLink(
  tripId: string, 
  permission: 'view' | 'edit',
  expiresAt?: Date
): Promise<string> {
  try {
    const token = generateShareToken();
    
    // Create share link document
    await addDoc(collection(db, SHARE_LINKS_COLLECTION), {
      tripId,
      token,
      permission,
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      createdAt: Timestamp.now(),
    });

    // Update trip with share token
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    await updateDoc(tripRef, {
      shareToken: token,
      updatedAt: Timestamp.now(),
    });

    return token;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
}

// Get trip by share token (for public access)
export async function getTripByShareToken(token: string): Promise<{
  trip: Trip | null;
  permission: 'view' | 'edit';
}> {
  try {
    // Find share link
    const shareLinksQuery = query(
      collection(db, SHARE_LINKS_COLLECTION),
      where('token', '==', token)
    );
    const shareLinksSnapshot = await getDocs(shareLinksQuery);
    
    if (shareLinksSnapshot.empty) {
      return { trip: null, permission: 'view' };
    }

    const shareLink = shareLinksSnapshot.docs[0].data() as ShareLink;
    
    // Check if link is expired
    if (shareLink.expiresAt && shareLink.expiresAt.toDate() < new Date()) {
      return { trip: null, permission: 'view' };
    }

    // Get the trip
    const tripRef = doc(db, TRIPS_COLLECTION, shareLink.tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (!tripDoc.exists()) {
      return { trip: null, permission: 'view' };
    }

    const tripData = tripDoc.data();
    const trip: Trip = {
      id: tripDoc.id,
      ...tripData,
      createdAt: tripData.createdAt.toDate(),
      updatedAt: tripData.updatedAt.toDate(),
      lastEditedAt: tripData.lastEditedAt?.toDate(),
    } as Trip;

    return { trip, permission: shareLink.permission };
  } catch (error) {
    console.error('Error fetching trip by share token:', error);
    throw error;
  }
}

// Share trip with specific user
export async function shareWithUser(
  tripId: string,
  userEmail: string,
  permission: 'view' | 'edit',
  sharedByUserId: string
): Promise<void> {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data() as Trip;
    const currentSharedUsers = tripData.shareSettings?.sharedUsers || [];
    
    // Check if user is already shared with
    const existingUser = currentSharedUsers.find(user => user.email === userEmail);
    
    if (existingUser) {
      // Update permission if different
      if (existingUser.permission !== permission) {
        const updatedUsers = currentSharedUsers.map(user =>
          user.email === userEmail ? { ...user, permission } : user
        );
        
        await updateDoc(tripRef, {
          'shareSettings.sharedUsers': updatedUsers,
          updatedAt: Timestamp.now(),
        });
      }
    } else {
      // Add new shared user
      const newSharedUser: SharedUser = {
        userId: '', // Will be filled when user accepts
        email: userEmail,
        displayName: '', // Will be filled when user accepts
        permission,
        invitedAt: new Date(),
      };
      
      const updatedUsers = [...currentSharedUsers, newSharedUser];
      
      await updateDoc(tripRef, {
        'shareSettings.sharedUsers': updatedUsers,
        updatedAt: Timestamp.now(),
      });
    }

    // Log activity
    await logTripActivity(tripId, sharedByUserId, 'shared', `Shared with ${userEmail} (${permission} access)`);
  } catch (error) {
    console.error('Error sharing trip with user:', error);
    throw error;
  }
}

// Remove user from shared trip
export async function removeUserFromTrip(
  tripId: string,
  userEmail: string,
  removedByUserId: string
): Promise<void> {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data() as Trip;
    const currentSharedUsers = tripData.shareSettings?.sharedUsers || [];
    
    const updatedUsers = currentSharedUsers.filter(user => user.email !== userEmail);
    
    await updateDoc(tripRef, {
      'shareSettings.sharedUsers': updatedUsers,
      updatedAt: Timestamp.now(),
    });

    // Log activity
    await logTripActivity(tripId, removedByUserId, 'unshared', `Removed ${userEmail} from trip`);
  } catch (error) {
    console.error('Error removing user from trip:', error);
    throw error;
  }
}

// Update trip sharing settings
export async function updateTripSharingSettings(
  tripId: string,
  settings: {
    isPublic?: boolean;
    allowPublicView?: boolean;
    allowPublicEdit?: boolean;
  },
  updatedByUserId: string
): Promise<void> {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    
    // First, get the current trip to ensure shareSettings exists
    const tripDoc = await getDoc(tripRef);
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }
    
    const tripData = tripDoc.data();
    const currentShareSettings = tripData.shareSettings || {
      isPublic: false,
      allowPublicView: false,
      allowPublicEdit: false,
      sharedUsers: [],
    };
    
    // Create the updated shareSettings object
    const updatedShareSettings = {
      ...currentShareSettings,
      ...(settings.isPublic !== undefined && { isPublic: settings.isPublic }),
      ...(settings.allowPublicView !== undefined && { allowPublicView: settings.allowPublicView }),
      ...(settings.allowPublicEdit !== undefined && { allowPublicEdit: settings.allowPublicEdit }),
    };
    
    await updateDoc(tripRef, {
      shareSettings: updatedShareSettings,
      isPublic: settings.isPublic ?? updatedShareSettings.isPublic, // Keep backward compatibility
      updatedAt: Timestamp.now(),
    });

    // Log activity
    const changes = Object.entries(settings)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    await logTripActivity(tripId, updatedByUserId, 'updated', `Changed sharing settings: ${changes}`);
  } catch (error) {
    console.error('Error updating trip sharing settings:', error);
    throw error;
  }
}

// Check user permissions for a trip
export async function getUserTripPermission(
  tripId: string,
  userId: string
): Promise<'owner' | 'edit' | 'view' | 'none'> {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (!tripDoc.exists()) {
      return 'none';
    }

    const tripData = tripDoc.data() as Trip;
    
    // Check if user is owner
    if (tripData.userId === userId) {
      return 'owner';
    }

    // Check if user is in shared users list
    const sharedUsers = tripData.shareSettings?.sharedUsers || [];
    const sharedUser = sharedUsers.find(user => user.userId === userId);
    
    if (sharedUser) {
      return sharedUser.permission;
    }

    // Check if trip allows public access
    if (tripData.shareSettings?.allowPublicEdit) {
      return 'edit';
    }
    
    if (tripData.shareSettings?.allowPublicView || tripData.isPublic) {
      return 'view';
    }

    return 'none';
  } catch (error) {
    console.error('Error checking user trip permission:', error);
    return 'none';
  }
}

// Log trip activity
export async function logTripActivity(
  tripId: string,
  userId: string,
  action: TripActivity['action'],
  details: string,
  userDisplayName?: string
): Promise<void> {
  try {
    await addDoc(collection(db, TRIP_ACTIVITY_COLLECTION), {
      tripId,
      userId,
      userDisplayName: userDisplayName || 'Unknown User',
      action,
      details,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error logging trip activity:', error);
    // Don't throw - activity logging shouldn't break the main operation
  }
}

// Get trip activity history
export async function getTripActivity(tripId: string): Promise<TripActivity[]> {
  try {
    const activityQuery = query(
      collection(db, TRIP_ACTIVITY_COLLECTION),
      where('tripId', '==', tripId)
    );
    
    const activitySnapshot = await getDocs(activityQuery);
    const activities: TripActivity[] = [];
    
    activitySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp.toDate(),
      } as TripActivity);
    });
    
    // Sort by timestamp (newest first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('Error fetching trip activity:', error);
    throw error;
  }
}

// Delete all share links for a trip
export async function deleteShareLinks(tripId: string): Promise<void> {
  try {
    const shareLinksQuery = query(
      collection(db, SHARE_LINKS_COLLECTION),
      where('tripId', '==', tripId)
    );
    
    const shareLinksSnapshot = await getDocs(shareLinksQuery);
    
    const deletePromises = shareLinksSnapshot.docs.map(doc => 
      doc.ref.delete()
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting share links:', error);
    throw error;
  }
}