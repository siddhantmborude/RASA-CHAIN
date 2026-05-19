import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-chain-dark flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-8">This route doesn't exist in the RASA-CHAIN system.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
          <Link to="/" className="btn-secondary">Home</Link>
        </div>
      </div>
    </div>
  );
}
