import { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import ChatWindow from './components/ChatWindow';
import FileManager from './components/FileManager';
import Auth from './components/Auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    // The Main Grid Layout: 260px Sidebar | Flexible Middle | 320px Right Sidebar
    <div className="grid grid-cols-[260px_1fr_320px] h-screen w-full overflow-hidden">
      
      {/* Left Column */}
      <aside className="h-full">
        <NavBar onLogout={handleLogout} />
      </aside>

      {/* Middle Column */}
      <main className="h-full overflow-hidden">
        <ChatWindow />
      </main>

      {/* Right Column */}
      <aside className="h-full">
        <FileManager />
      </aside>

    </div>
  );
}

export default App;