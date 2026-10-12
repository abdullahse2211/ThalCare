/**
 * ThalCare - 404 Not Found Page
 */

import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Sorry, the page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the dashboard.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-16 text-sm text-gray-400">
        ThalCare - Alpha Thalassemia Detection System
      </p>
    </div>
  );
}
