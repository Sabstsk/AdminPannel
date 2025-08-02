import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddFirebase from "./pages/AddFirebase"; // Import AddFirebase
import Entries from "./pages/Entries"; // Import Entries
import Password from "./pages/Password"; // Import Password
import Navbar from "./components/Navbar"; // Import Navbar
import MasterNumber from "./pages/MasterNumber"; // Import MasterNumber
import Credentials from "./pages/Credentials"; // Import Credentials
import React, { useState } from 'react'; // Import useState
import Message from "./pages/Message"; // Import Message
import NotFound from "./pages/NotFound"; // Import NotFound
import TelegramBot from "./pages/TelegramBot"; // Import TelegramBot
import Profile from "./pages/Profile"; // Import Profile

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // New state for sidebar visibility

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        {/* Routes with Navbar */}
        <Route element={<Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />}> {/* Pass props */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-firebase-config" element={<AddFirebase />} />
          <Route path="/entries" element={<Entries />} />
          <Route path="/password" element={<Password />} />
          <Route path="/messages" element={<Message />} />
          <Route path="/master-number" element={<MasterNumber />} />
          <Route path="/bot" element={<TelegramBot />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/credentials" element={<Credentials />} /> {/* New route for Credentials */}
        </Route>
        {/* Catch-all route for 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
