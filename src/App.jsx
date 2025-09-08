import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddFirebase from "./pages/AddFirebase";
import Entries from "./pages/Entries";
import Password from "./pages/Password";
import Navbar from "./components/Navbar";
import MasterNumber from "./pages/MasterNumber";
import Credentials from "./pages/Credentials";
import React, { useState } from 'react';
import Message from "./pages/Message";
import NotFound from "./pages/NotFound";
import TelegramBot from "./pages/TelegramBot";
import Profile from "./pages/Profile";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // New state for sidebar visibility

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          {/* Protected Routes with Navbar */}
          <Route element={
            <ProtectedRoute>
              <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-firebase-config" element={<AddFirebase />} />
            <Route path="/entries" element={<Entries />} />
            <Route path="/password" element={<Password />} />
            <Route path="/messages" element={<Message />} />
            <Route path="/master-number" element={<MasterNumber />} />
            <Route path="/bot" element={<TelegramBot />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/credentials" element={<Credentials />} />
          </Route>
          {/* Catch-all route for 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
