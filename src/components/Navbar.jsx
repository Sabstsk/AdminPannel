import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiHome, FiPlusSquare, FiFileText, FiUser, FiPhone, 
  FiMessageSquare, FiKey, FiLock, FiSend, FiLogOut, FiMenu, FiX
} from 'react-icons/fi';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navLinks = [
    { to: "/dashboard", icon: <FiHome />, text: "Dashboard" },
    { to: "/add-firebase-config", icon: <FiPlusSquare />, text: "Add Firebase" },
    { to: "/entries", icon: <FiFileText />, text: "Entries" },
    { to: "/profile", icon: <FiUser />, text: "Profile" },
    { to: "/master-number", icon: <FiPhone />, text: "Master Number" },
    { to: "/messages", icon: <FiMessageSquare />, text: "Messages" },
    { to: "/credentials", icon: <FiKey />, text: "Credentials" },
    { to: "/password", icon: <FiLock />, text: "Password" },
    { to: "/bot", icon: <FiSend />, text: "Telegram Bot" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-white text-gray-800 rounded-full shadow-lg lg:hidden"
      >
        {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`bg-white text-gray-800 flex flex-col justify-between fixed top-0 left-0 h-screen shadow-xl transition-all duration-300 ease-in-out z-40 ${isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full'}`}
      >
        <div className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="px-6 py-5 border-b border-gray-200">
            <NavLink to="/dashboard" className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition-colors">
              Admin Panel
            </NavLink>
          </div>

          <nav className="flex-grow mt-4 px-4 space-y-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => 
                  `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`
                }
              >
                <span className="mr-3 text-lg">{link.icon}</span>
                {link.text}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={`px-4 py-4 border-t border-gray-200 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2.5 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-md"
          >
            <FiLogOut className="mr-2" />
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out lg:ml-64`}>
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
