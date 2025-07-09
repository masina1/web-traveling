export type Trip = {
  id: string;
  userId: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
};

export type Destination = {
  id: string;
  tripId: string;
  locationName: string;
  address: string;
  lat: number;
  lng: number;
  day: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  sharedTrips: string[];
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
};

export type DayColor = {
  bg: string;
  text: string;
  border: string;
};

export type ViewMode = 'list' | 'compact'; 