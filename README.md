# 🌍 Travel Planning Web App

A clean, responsive travel planning application similar to Wanderlog, built with Next.js and TypeScript.

## ✨ Features

- 🔐 User authentication (email/password)
- 🗺️ Interactive map with color-coded pins by day
- 📅 Multi-day trip planning with detailed itineraries
- 🎯 Location suggestions with images
- 📱 Responsive design (desktop + mobile)
- 🔗 Trip sharing capabilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/masina1/web-traveling.git
cd web-traveling
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys (see setup instructions below)

4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Maps**: Google Maps API
- **Deployment**: Vercel

## 📁 Project Structure

```
├── app/                    # Next.js app router pages
│   ├── debug/             # Debug utilities
│   ├── test-map/          # Map testing page
│   └── trip/              # Trip management pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── map/              # Map-related components
│   ├── trip/             # Trip management components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_places_api_key
```

## 🎨 Design Guidelines

- Use rounded buttons (`rounded-xl`) with clear contrast
- 45%/55% split layout (itinerary/map) on desktop
- Mobile-first responsive design
- 24-hour time format (e.g., "14:30")
- Color-coded pins by day with numbered sequence

## 🚦 Development Roadmap

### Current Status

- [x] Project setup and Git repository
- [x] Next.js 14 configuration with TypeScript
- [x] TailwindCSS styling setup
- [x] Firebase integration for authentication and data
- [x] **Map integration with Google Maps API** 🎉
- [x] **TripMap component with color-coded pins** 🎉
- [x] **45%/55% split layout (itinerary/map)** 🎉
- [x] **Interactive map with destination management** 🎉
- [x] **Authentication system (login/register)** 🎉
- [x] **Trip CRUD operations** 🎉
- [x] **Destination management with drag & drop** 🎉
- [x] **Location search with autocomplete** 🎉
- [x] **Mobile responsive design** 🎉
- [ ] Trip sharing functionality
- [ ] Deployment to Vercel

### Next Phase

- Add location suggestions with images
- Implement trip sharing functionality
- Deploy to production
- Add offline support and PWA capabilities

## 🧪 Testing

The project includes testing utilities:

- **Test Map Page**: `/test-map` - Tests Google Maps API integration
- **Debug Page**: `/debug` - Shows authentication and environment status
- **Trip Test**: `/test-maps` - Tests TripMap component with sample data

## 🎯 Key Features Implemented

### ✅ **Complete Authentication System**

- Firebase Auth with email/password
- User registration and login
- Protected routes and session management
- Dashboard with trip management

### ✅ **Complete Trip Management**

- Create, edit, view, and delete trips
- Trip details with dates, locations, and descriptions
- Trip list with search and filtering
- User-specific trip ownership

### ✅ **Complete Map Integration**

- Google Maps API with interactive maps
- Color-coded pins by day (numbered sequence)
- Click to add destinations directly on map
- Map/itinerary synchronization
- Pin click opens detailed information

### ✅ **Complete Destination Management**

- Add destinations with address, notes, and timing
- **Drag & drop reordering** within days and cross-day support
- **Location search with Google Places autocomplete**
- Real-time database updates
- Pin number auto-updates
- Visual feedback during operations

### ✅ **Complete UI/UX**

- Professional design with TailwindCSS
- 45%/55% split layout (itinerary/map) on desktop
- **Mobile responsive design** with toggle panels
- Expandable day sections
- Loading states and error handling
- Keyboard navigation support

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## Changelog

### 2025-01-10

- **[MAJOR]** Implemented location search with Google Places autocomplete
- **[MAJOR]** Added mobile responsive design with toggle panels
- **[FEATURE]** LocationSearch component with intelligent place suggestions
- **[FEATURE]** Mobile-optimized layout with itinerary/map toggle
- **[FEATURE]** Keyboard navigation support for location search
- **[FEATURE]** Enhanced Places API integration with photos and ratings
- **[IMPROVEMENT]** Better user experience on mobile devices
- **[IMPROVEMENT]** Consistent UI across desktop and mobile platforms

### 2025-01-10

- **[MAJOR]** Enabled cross-day dragging - destinations can now be moved between different days
- **[MAJOR]** Fixed map marker numbers now properly moving with circles during drag operations
- **[FEATURE]** Restructured drag & drop with single DndContext for cross-day support
- **[FEATURE]** Added droppable day containers for intuitive cross-day drops
- **[FEATURE]** Enhanced drag logic to handle both same-day reordering and cross-day moves
- **[BUGFIX]** Complete map marker recreation ensures proper number synchronization
- **[BUGFIX]** Resolved business name selection - now saves actual business names from Places API
- **[BUGFIX]** Improved marker recreation logic with proper event cleanup
- **[BUGFIX]** Prevented unwanted pin animations when dragging unrelated destinations
- **[IMPROVEMENT]** Enhanced coordinate-based matching for selected destination highlighting
- **[IMPROVEMENT]** Reduced debug logging noise for cleaner console output
- **[IMPROVEMENT]** Added proper marker animation timing and cleanup

### 2025-01-07

- **[MAJOR]** Added drag & drop functionality for destination reordering
- **[FEATURE]** Enhanced ItineraryPanel with sortable destinations within days
- **[FEATURE]** Added @dnd-kit library for modern drag & drop support
- **[FEATURE]** Implemented real-time database updates with reorderDestinations service
- **[FEATURE]** Added drag handles and visual feedback during drag operations
- **[FEATURE]** Pin numbers automatically update to reflect new order
- **[IMPROVEMENT]** Loading states and error handling for better UX
- **[IMPROVEMENT]** Smooth animations and accessibility support via @dnd-kit
- **[MAJOR]** Fixed map initialization with container DOM timing issue
- **[FEATURE]** TripMap component now loads successfully with color-coded pins by day
- **[FEATURE]** Added proper component mounting state management
- **[FEATURE]** Implemented interactive map with destination management
- **[FEATURE]** Added 45%/55% split layout (itinerary/map) for trip detail page
- **[FEATURE]** Enhanced debugging capabilities for map initialization
- **[BUGFIX]** Resolved 'Container element never appeared' error
- **[IMPROVEMENT]** Map container now always rendered with loading/error overlays
- **[IMPROVEMENT]** Improved retry logic with better error handling

### 2024-12-28

- **[FEATURE]** Initial project setup with Next.js 14 and TypeScript
- **[FEATURE]** TailwindCSS configuration with custom colors and animations
- **[FEATURE]** Firebase integration for authentication and Firestore
- **[FEATURE]** Google Maps API integration setup
- **[FEATURE]** Basic project structure with component organization
- **[FEATURE]** Environment configuration with .env.example template
- **[FEATURE]** Git repository initialization with comprehensive .gitignore
