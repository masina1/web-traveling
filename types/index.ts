export type Trip = {
  id: string;
  userId: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  description?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
  // Sharing and collaboration
  shareToken?: string; // Unique token for public links
  shareSettings: {
    isPublic: boolean;
    allowPublicView: boolean;
    allowPublicEdit: boolean;
    sharedUsers: SharedUser[];
  };
  lastEditedBy?: string; // User ID of last editor
  lastEditedAt?: Date;
};

export type Destination = {
  id: string;
  tripId: string;
  locationName: string;
  address: string;
  lat: number;
  lng: number;
  day: number; // Use 0 for ungrouped/freeform destinations
  startTime?: string;
  endTime?: string;
  notes?: string;
  orderIndex: number; // For pin numbering within a day
  placeId?: string; // Google Places ID for additional data
  category?: string; // e.g., 'restaurant', 'attraction', 'hotel'
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTripData = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  userId: string;
  description?: string;
  coverImage?: string;
  shareSettings?: {
    isPublic: boolean;
    allowPublicView: boolean;
    allowPublicEdit: boolean;
    sharedUsers: SharedUser[];
  };
};

export type UpdateTripData = {
  name?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
  description?: string;
  coverImage?: string;
};

export type CreateDestinationData = {
  tripId: string;
  locationName: string;
  address: string;
  lat: number;
  lng: number;
  day: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
  orderIndex: number;
  placeId?: string;
  category?: string;
  rating?: number;
  priceLevel?: number;
  photos?: string[];
};

export type UpdateDestinationData = {
  locationName?: string;
  address?: string;
  lat?: number;
  lng?: number;
  day?: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
  orderIndex?: number;
  placeId?: string;
  category?: string;
  rating?: number;
  priceLevel?: number;
  photos?: string[];
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  sharedTrips: string[];
};

export type SharedUser = {
  userId: string;
  email: string;
  displayName: string;
  permission: 'view' | 'edit';
  invitedAt: Date;
  acceptedAt?: Date;
};

export type ShareLink = {
  tripId: string;
  token: string;
  permission: 'view' | 'edit';
  expiresAt?: Date;
  createdAt: Date;
};

export type TripActivity = {
  id: string;
  tripId: string;
  userId: string;
  userDisplayName: string;
  action: 'created' | 'updated' | 'added_destination' | 'removed_destination' | 'moved_destination' | 'shared' | 'unshared';
  details: string;
  timestamp: Date;
};

export type PlaceSuggestion = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  priceLevel?: number;
  placeId?: string;
};

export type DayColor = {
  bg: string;
  text: string;
  border: string;
  pin: string;
};

export type ViewMode = 'list' | 'compact';

export type MapCenter = {
  lat: number;
  lng: number;
  zoom: number;
};

export type TripDay = {
  day: number;
  date: string;
  destinations: Destination[];
  color: DayColor;
};

// Day color palette - each day gets a different color
export const DAY_COLORS: DayColor[] = [
  { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', pin: '#DC2626' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', pin: '#2563EB' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', pin: '#16A34A' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', pin: '#CA8A04' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', pin: '#9333EA' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', pin: '#DB2777' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', pin: '#4F46E5' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', pin: '#EA580C' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', pin: '#0D9488' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', pin: '#0891B2' },
];

// Helper function to get color for a specific day
export function getDayColor(day: number): DayColor {
  return DAY_COLORS[(day - 1) % DAY_COLORS.length];
} 