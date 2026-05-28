import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <p className="text-gray-600 mb-6">Page not found.</p>
      <Link to="/dashboard"><Button>Go to Dashboard</Button></Link>
    </div>
  );
}
