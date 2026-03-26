import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">University Mentorship Platform</h1>
      <p className="text-gray-600 mb-6">Connect with mentors. Chunk 1 – routing shell.</p>
      <nav className="flex flex-wrap gap-3 justify-center">
        <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
        <Link to="/profile" className="text-blue-600 hover:underline">Profile</Link>
        <Link to="/mentors" className="text-blue-600 hover:underline">Mentors</Link>
        <Link to="/bookings" className="text-blue-600 hover:underline">Bookings</Link>
        <Link to="/chat" className="text-blue-600 hover:underline">Chat</Link>
        <Link to="/admin" className="text-blue-600 hover:underline">Admin</Link>
      </nav>
    </div>
  );
}

export default Home;
