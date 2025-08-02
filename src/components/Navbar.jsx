import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => { // Accept props
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/");
  };

  return (
    <div className="flex h-screen">
      {/* Three-line button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 text-blue-700 bg-white rounded-md shadow-md lg:hidden"
      >
        <div className="w-6 h-0.5 bg-blue-700 mb-1"></div>
        <div className="w-6 h-0.5 bg-blue-700 mb-1"></div>
        <div className="w-6 h-0.5 bg-blue-700"></div>
      </button>

      <div
        className={`bg-blue-700 text-white flex flex-col justify-between fixed top-0 left-0 shadow-lg h-screen transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full'}`}
        style={{ minWidth: isSidebarOpen ? '16rem' : '0' }} // Added minWidth to prevent content collapse on w-0
      >
        <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
          <div className="px-6 py-4 text-2xl font-bold border-b border-blue-500">
            <Link to="/dashboard" className="hover:text-gray-300">Admin Dashboard</Link>
          </div>

          <nav className="flex flex-col mt-4 space-y-2 px-4">
            <Link to="/dashboard" className="hover:bg-blue-600 px-4 py-2 rounded">Dashboard</Link>
            <Link to="/add-firebase-config" className="hover:bg-blue-600 px-4 py-2 rounded">Add Firebase Config</Link>
            <Link to="/entries" className="hover:bg-blue-600 px-4 py-2 rounded">Entries</Link>
            <Link to="/profile" className="hover:bg-blue-600 px-4 py-2 rounded">Profile</Link>
            <Link to="/master-number" className="hover:bg-blue-600 px-4 py-2 rounded">Master Number</Link>
            <Link to="/messages" className="hover:bg-blue-600 px-4 py-2 rounded">Messages</Link>
            <Link to="/credentials" className="hover:bg-blue-600 px-4 py-2 rounded">Credentials</Link>
            <Link to="/password" className="hover:bg-blue-600 px-4 py-2 rounded">Password</Link>
            <Link to="/redirect" className="hover:bg-blue-600 px-4 py-2 rounded">Redirect</Link>

            <div className="mt-6 mb-2 text-sm uppercase tracking-wide text-gray-300">Menu</div>
          </nav>
        </div>

        <div className={`${isSidebarOpen ? 'block' : 'hidden'} px-4 py-4 border-t border-blue-500`}>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition"
          >
            Log out
          </button>
        </div>
      </div>
      {/* Main content area, adjusts margin based on sidebar visibility */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Outlet /> 
      </div>
    </div>
  );
};

export default Sidebar;
