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
- [ ] Authentication system (login/register)
- [ ] Trip CRUD operations
- [ ] Destination management with drag & drop
- [ ] Location suggestions with images
- [ ] Mobile responsiveness
- [ ] Trip sharing functionality
- [ ] Deployment to Vercel

### Next Phase

- Complete authentication system
- Implement full trip management
- Add location search and suggestions
- Mobile optimization

## 🧪 Testing

The project includes testing utilities:

- **Test Map Page**: `/test-map` - Tests Google Maps API integration
- **Debug Page**: `/debug` - Shows authentication and environment status
- **Trip Test**: `/test-maps` - Tests TripMap component with sample data

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## Changelog

### 2025-01-07

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
