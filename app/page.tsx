export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🌍 Travel Planner
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Plan your trips with interactive maps, detailed itineraries, and smart location suggestions.
            Similar to Wanderlog, but simplified and focused on what matters most.
          </p>
          
          <div className="flex justify-center gap-4 mb-12">
            <a href="/register" className="btn-primary text-lg px-8 py-3">
              Get Started
            </a>
            <a href="/login" className="btn-secondary text-lg px-8 py-3">
              Sign In
            </a>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-2">Interactive Maps</h3>
              <p className="text-gray-600">
                View destinations on color-coded maps with numbered pins for each day
              </p>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">Day-by-Day Planning</h3>
              <p className="text-gray-600">
                Organize your itinerary with detailed time blocks and notes
              </p>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Smart Suggestions</h3>
              <p className="text-gray-600">
                Get personalized recommendations based on your destinations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 