# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **[FEATURE]** Undo/Redo support for itinerary changes: permanent Undo and Redo buttons in the itinerary panel header, allowing users to revert or reapply changes to destinations (add, delete, move, copy, drag & drop). UI uses modern Heroicons and disables buttons when not available.

### Added (continued)

- **[MAJOR FEATURE]** Trip sharing with public links - Users can share trips with read-only or edit access
- **[FEATURE]** ShareModal component with link generation, user invitations, and permission management
- **[FEATURE]** Public trip view page (shared/[token]) with authentication requirements for edit access
- **[FEATURE]** Collaborative editing with permission checks and conflict resolution using last-writer-wins strategy
- **[FEATURE]** Trip activity logging - Track all changes with user attribution (add, edit, delete, move destinations)
- **[FEATURE]** Enhanced destination service with auth-aware functions (createWithAuth, updateWithAuth, deleteWithAuth)
- **[SECURITY]** Permission-based access control - Owner, edit, and view permissions with proper validation

### Fixed

- **[BUGFIX]** Fixed missing shareSettings initialization for existing trips - checkboxes in ShareModal now work without errors
- **[BUGFIX]** Resolved shared trip page runtime errors by adding missing TripMap props (tripDays, selectedDestination, etc.)
- **[BUGFIX]** Added null checking throughout TripMap component to handle undefined tripDays gracefully
- **[BUGFIX]** Fixed map loading timing issue on shared trips - map now loads properly on first visit without requiring refresh
- **[IMPROVEMENT]** Improved loading sequence and auth handling to prevent unnecessary reloads and ensure smooth UX

### Removed

- **[DOCUMENTATION]** Removed offline mode from roadmap and documentation - feature deemed too complex with limited use case for travel planning apps

### Added (continued)

- **[FEATURE]** Added autocomplete for city/country search in trip creation form
- **[FEATURE]** CityCountrySearch component with Google Places integration
- **[IMPROVEMENT]** Enhanced trip creation UX with intelligent location suggestions
- **[IMPROVEMENT]** Keyboard navigation support for location autocomplete (arrow keys, Enter, Escape)
- **[IMPROVEMENT]** City/country autocomplete now only suggests cities and countries (no states/regions)
- **[IMPROVEMENT]** Itinerary and map panels now use a true 50/50 split with no container wall.
- **[IMPROVEMENT]** Native itinerary scrollbar is hidden and replaced with a custom scrollbar at the far right edge, synced with itinerary scroll.
- **[IMPROVEMENT]** Custom scrollbar is more visible for better usability.
- **[FEATURE]** Between-pins + button for adding places/notes, perfectly centered and overlays a continuous vertical dotted line
- **[IMPROVEMENT]** Continuous vertical dotted line now runs only between itinerary items, not from the pin SVG
- **[IMPROVEMENT]** Pin SVGs are now half-overlapping the left edge of the gray container for a modern look
- **[IMPROVEMENT]** No extra dots or + button after the last pin in a day; connector line is always perfectly flush with gray containers

### Fixed

- **[BUGFIX]** Fixed Google Maps centering issue - map now centers on trip location instead of defaulting to New York
- **[IMPROVEMENT]** Enhanced map initialization with geocoding support for trip locations
- **[IMPROVEMENT]** Added automatic zoom level adjustment based on location type (country vs city)
- **[IMPROVEMENT]** Improved error handling with fallback to NYC if geocoding fails

### Planned

- Photo upload and management
- Route optimization and directions
- Weather integration
- Expense tracking
- Export to PDF/Calendar

### Removed Features

- **Offline mode with service workers** - Removed due to complexity and limited use case for travel planning

## [1.1.0] - 2025-07-14

### Added

- **[FEATURE]** Click-to-add toggle button for map destination creation
- **[FEATURE]** Teardrop-shaped pins in itinerary panel matching map markers
- **[IMPROVEMENT]** Toggle control for enabling/disabling map click-to-add functionality
- **[IMPROVEMENT]** Consistent pin styling across map and itinerary components

### Enhanced

- **[IMPROVEMENT]** Streamlined deletion experience without success notifications
- **[IMPROVEMENT]** Automatic pin renumbering after destination deletion
- **[IMPROVEMENT]** Enhanced user control over map interaction modes
- **[IMPROVEMENT]** Better visual consistency between map and itinerary panels

### Fixed

- **[BUGFIX]** Pin numbering after deletion now always shows sequential numbers (1, 2, 3...)
- **[BUGFIX]** Removed intrusive success notifications during destination deletion
- **[BUGFIX]** Fixed pin numbering gaps when destinations are deleted

## [1.0.0] - 2025-07-14

### Added

- **[MAJOR]** Google Places autocomplete for location search
- **[MAJOR]** Mobile responsive design with collapsible panels
- **[FEATURE]** LocationSearch component with intelligent place suggestions
- **[FEATURE]** Mobile-optimized layout with itinerary/map toggle
- **[FEATURE]** Keyboard navigation support for location search (arrow keys, Enter, Escape)
- **[FEATURE]** Enhanced Places API integration with photos, ratings, and categories
- **[FEATURE]** Comprehensive error handling and diagnostic logging for API issues
- **[FEATURE]** Loading states and visual feedback during search operations
- **[FEATURE]** Debounced search with 300ms delay for optimal performance

### Enhanced

- **[IMPROVEMENT]** Map marker synchronization with itinerary updates
- **[IMPROVEMENT]** Better user experience on mobile devices with touch-friendly interface
- **[IMPROVEMENT]** Consistent UI across desktop and mobile platforms
- **[IMPROVEMENT]** Enhanced TypeScript types and error handling
- **[IMPROVEMENT]** Professional documentation with comprehensive setup guide

### Fixed

- **[BUGFIX]** API integration issues with Google Places legacy endpoints
- **[BUGFIX]** Mobile panel visibility and toggle functionality
- **[BUGFIX]** Console errors related to Places API initialization
- **[BUGFIX]** Destination object structure compatibility with backend

## [0.9.0] - 2025-07-14

### Added

- **[MAJOR]** Cross-day dragging - destinations can now be moved between different days
- **[MAJOR]** Enhanced drag & drop system with single DndContext for seamless operation
- **[FEATURE]** Restructured drag & drop with proper cross-day support
- **[FEATURE]** Added droppable day containers for intuitive cross-day drops
- **[FEATURE]** Enhanced drag logic to handle both same-day reordering and cross-day moves

### Fixed

- **[MAJOR]** Fixed map marker numbers - now properly move with destinations during drag operations
- **[BUGFIX]** Complete map marker recreation ensures proper number synchronization
- **[BUGFIX]** Resolved business name selection - now saves actual business names from Places API
- **[BUGFIX]** Improved marker recreation logic with proper event cleanup
- **[BUGFIX]** Prevented unwanted pin animations when dragging unrelated destinations

### Enhanced

- **[IMPROVEMENT]** Enhanced coordinate-based matching for selected destination highlighting
- **[IMPROVEMENT]** Reduced debug logging noise for cleaner console output
- **[IMPROVEMENT]** Added proper marker animation timing and cleanup
- **[IMPROVEMENT]** Better visual feedback during drag operations

## [0.8.0] - 2025-07-14

### Added

- **[MAJOR]** Drag & drop functionality for destination reordering
- **[FEATURE]** Enhanced ItineraryPanel with sortable destinations within days
- **[FEATURE]** Added @dnd-kit library for modern drag & drop support
- **[FEATURE]** Implemented real-time database updates with reorderDestinations service
- **[FEATURE]** Added drag handles and visual feedback during drag operations
- **[FEATURE]** Pin numbers automatically update to reflect new order

### Fixed

- **[MAJOR]** Fixed map initialization with container DOM timing issue
- **[BUGFIX]** Resolved 'Container element never appeared' error
- **[BUGFIX]** Map container now always rendered with loading/error overlays

### Enhanced

- **[IMPROVEMENT]** Loading states and error handling for better UX
- **[IMPROVEMENT]** Smooth animations and accessibility support via @dnd-kit
- **[IMPROVEMENT]** Improved retry logic with better error handling

## [0.7.0] - 2025-07-14

### Added

- **[MAJOR]** TripMap component with color-coded pins by day
- **[FEATURE]** Interactive map with destination management
- **[FEATURE]** Added 45%/55% split layout (itinerary/map) for trip detail page
- **[FEATURE]** Enhanced debugging capabilities for map initialization
- **[FEATURE]** Added proper component mounting state management

### Enhanced

- **[IMPROVEMENT]** Map container rendering with proper loading states
- **[IMPROVEMENT]** Better error handling and retry mechanisms
- **[IMPROVEMENT]** Improved map initialization timing and reliability

## [0.6.0] - 2025-07-14

### Added

- **[MAJOR]** Complete trip management system
- **[FEATURE]** Create, edit, view, and delete trips
- **[FEATURE]** Trip details with dates, locations, and descriptions
- **[FEATURE]** Trip list with search and filtering capabilities
- **[FEATURE]** User-specific trip ownership and permissions

### Enhanced

- **[IMPROVEMENT]** Enhanced Firebase integration for trip data
- **[IMPROVEMENT]** Better error handling and validation
- **[IMPROVEMENT]** Improved user experience with loading states

## [0.5.0] - 2025-07-14

### Added

- **[MAJOR]** Complete authentication system
- **[FEATURE]** Firebase Auth with email/password authentication
- **[FEATURE]** User registration and login functionality
- **[FEATURE]** Protected routes and session management
- **[FEATURE]** Dashboard with trip management interface

### Enhanced

- **[IMPROVEMENT]** Secure route protection
- **[IMPROVEMENT]** User session persistence
- **[IMPROVEMENT]** Professional authentication UI

## [0.4.0] - 2025-07-14

### Added

- **[MAJOR]** Complete destination management system
- **[FEATURE]** Add destinations with address, notes, and timing
- **[FEATURE]** Real-time database updates for destinations
- **[FEATURE]** Visual feedback during CRUD operations
- **[FEATURE]** Destination editing and deletion capabilities

### Enhanced

- **[IMPROVEMENT]** Enhanced destination form validation
- **[IMPROVEMENT]** Better error handling for database operations
- **[IMPROVEMENT]** Improved user feedback and loading states

## [0.3.0] - 2025-07-14

### Added

- **[MAJOR]** Google Maps API integration
- **[FEATURE]** Interactive maps with custom markers
- **[FEATURE]** Click to add destinations directly on map
- **[FEATURE]** Map/itinerary synchronization
- **[FEATURE]** Pin click opens detailed information
- **[FEATURE]** Color-coded pins by day with numbered sequence

### Enhanced

- **[IMPROVEMENT]** Smooth map interactions
- **[IMPROVEMENT]** Responsive map sizing
- **[IMPROVEMENT]** Better marker clustering and management

## [0.2.0] - 2025-07-14

### Added

- **[MAJOR]** Complete UI/UX system
- **[FEATURE]** Professional design with TailwindCSS
- **[FEATURE]** Responsive layout with mobile-first approach
- **[FEATURE]** Expandable day sections in itinerary
- **[FEATURE]** Loading states and error handling throughout app
- **[FEATURE]** Consistent component styling and theming

### Enhanced

- **[IMPROVEMENT]** Accessibility improvements
- **[IMPROVEMENT]** Better visual hierarchy
- **[IMPROVEMENT]** Smooth animations and transitions

## [0.1.0] - 2025-07-11

### Added

- **[FEATURE]** Initial project setup with Next.js 14 and TypeScript
- **[FEATURE]** TailwindCSS configuration with custom colors and animations
- **[FEATURE]** Firebase integration setup for authentication and Firestore
- **[FEATURE]** Google Maps API integration configuration
- **[FEATURE]** Basic project structure with component organization by feature
- **[FEATURE]** Environment configuration with comprehensive .env.example template
- **[FEATURE]** Git repository initialization with comprehensive .gitignore
- **[FEATURE]** Package.json with all necessary dependencies
- **[FEATURE]** TypeScript configuration in strict mode
- **[FEATURE]** PostCSS and Tailwind configuration
- **[FEATURE]** Next.js configuration with optimizations

### Infrastructure

- **[SETUP]** Project directory structure: `/app`, `/components`, `/lib`, `/types`
- **[SETUP]** Component organization by feature (`/auth`, `/map`, `/trip`, `/ui`)
- **[SETUP]** Development tooling and build configuration
- **[SETUP]** Version control with Git and GitHub integration
- **[SETUP]** Documentation foundation with README template

---

## Legend

- **[MAJOR]** - Significant feature additions or changes
- **[FEATURE]** - New functionality added
- **[IMPROVEMENT]** - Enhancement to existing functionality
- **[BUGFIX]** - Bug fixes and corrections
- **[SETUP]** - Project setup and infrastructure changes

## Version Numbering

- **Major version** (1.0.0): Complete feature set ready for production
- **Minor version** (0.x.0): New features and significant improvements
- **Patch version** (0.0.x): Bug fixes and minor improvements

## Contributing

When adding entries to this changelog:

1. Add new entries to the `[Unreleased]` section first
2. Use the format: `- **[TYPE]** Description of change`
3. Move items from `[Unreleased]` to a new version section when releasing
4. Include the date in format `YYYY-MM-DD`
5. Link to relevant issues or pull requests when applicable
