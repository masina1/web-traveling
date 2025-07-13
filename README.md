# 🌍 Travel Planning Web App

A clean, responsive travel planning application similar to Wanderlog, built with Next.js and TypeScript.

## ✨ Features

### ✅ **Currently Implemented**

- 🔐 **User Authentication** - Email/password registration and login with Firebase Auth
- 👤 **User Management** - Profile creation and session management
- 🗂️ **Trip Management** - Create, view, edit, and delete trips
- 📅 **Trip Details** - Name, location, dates, description, and privacy settings
- 🎨 **Responsive UI** - Clean TailwindCSS design with mobile support
- 🔒 **Protected Routes** - Dashboard and trip pages require authentication

### 🚧 **Coming Soon**

- 🗺️ Interactive map with color-coded pins by day
- 📍 Destination management and itinerary planning
- 🎯 Location suggestions with images
- 📱 Enhanced mobile responsiveness
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
- **Maps**: Google Maps API (configured, ready for integration)
- **Deployment**: Vercel (ready)

## 📁 Project Structure

```
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Protected dashboard page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── layout.tsx         # Root layout with AuthProvider
├── components/            # React components
│   ├── auth/             # Authentication components (LoginForm, RegisterForm)
│   ├── trip/             # Trip management components (CreateTripForm, TripList)
│   └── ui/               # Reusable UI components (planned)
├── lib/                   # Utility functions
│   ├── auth-context.tsx   # Authentication context and hooks
│   ├── firebase.ts        # Firebase configuration
│   └── trip-service.ts    # Trip CRUD operations
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
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Places API (for location suggestions)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_places_api_key
```

## 🎨 Design Guidelines

- Use rounded buttons (`rounded-xl`) with clear contrast
- 45%/55% split layout (itinerary/map) on desktop
- Mobile-first responsive design
- 24-hour time format (e.g., "14:30")
- Color-coded pins by day with numbered sequence

## 🚦 Development Roadmap

- [x] **Project setup and Git repository**
- [x] **Authentication system** - Firebase Auth integration
- [x] **Trip CRUD operations** - Create, read, update, delete trips
- [x] **User dashboard** - Protected dashboard with trip management
- [x] **Trip management UI** - Forms and lists for trip operations
- [ ] **Map integration** - Google Maps with interactive pins
- [ ] **Destination management** - Add/edit destinations within trips
- [ ] **Itinerary planning** - Day-by-day trip planning
- [ ] **Location suggestions** - Smart recommendations
- [ ] **Mobile responsiveness** - Enhanced mobile experience
- [ ] **Trip sharing** - Public/private trip sharing
- [ ] **Deployment** - Production deployment

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📋 Changelog

### [2025-01-13] - Authentication & Trip Management System Complete

- **Added**: Complete Firebase authentication system with email/password
- **Added**: User registration and login forms with validation
- **Added**: Protected routes and authentication context
- **Added**: Trip CRUD operations with Firestore integration
- **Added**: Trip creation form with validation (name, location, dates, description, privacy)
- **Added**: Trip list view with edit/delete functionality
- **Added**: User dashboard with trip management interface
- **Added**: TypeScript types for Trip and User entities
- **Added**: Responsive UI with TailwindCSS styling
- **Fixed**: Firestore composite index issue by using client-side sorting
- **Fixed**: Next.js configuration warnings for deprecated options
- **Technical**: Enhanced Trip model with createdAt, updatedAt, description, coverImage fields
- **Technical**: Implemented comprehensive error handling for authentication and database operations

### [2025-01-10] - Initial Project Setup

- **Added**: Next.js 14 project with App Router and TypeScript
- **Added**: TailwindCSS configuration with custom design system
- **Added**: Firebase project configuration and environment setup
- **Added**: Google Maps API integration setup
- **Added**: Project structure with feature-based component organization
- **Added**: Git repository initialization and GitHub integration
- **Added**: Comprehensive documentation and setup instructions
