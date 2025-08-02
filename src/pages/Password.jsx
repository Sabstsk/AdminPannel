import React, { useState, useEffect } from "react";
import { db } from "../utils/firebase";
import { ref, get, set } from "firebase/database";

const Password = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentAdminData, setCurrentAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  useEffect(() => {
    const adminRef = ref(db, 'admin');
    const fetchData = async () => {
      try {
        const snapshot = await get(adminRef);
        if (snapshot.exists()) {
          setCurrentAdminData(snapshot.val());
          // Do not pre-fill inputs with current password for security, let user re-enter for update
          setUsername(snapshot.val().username || "");
          // setPassword(snapshot.val().password || ""); // Removed pre-filling password
        } else {
          alert("Admin data not found in database. Please set it up.");
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Error fetching admin data: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Username and Password cannot be empty.");
      return;
    }
    try {
      const adminRef = ref(db, 'admin');
      await set(adminRef, { username, password });
      alert("Admin credentials updated successfully!");
      // Optionally, force re-login or update local storage if needed
    } catch (err) {
      console.error("Error updating admin data:", err);
      alert("Failed to update credentials: " + err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">Loading admin data...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-red-600">{error}</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg p-6 rounded-md w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-center">Update Admin Credentials</h2>
        
        {currentAdminData && (
          <div className="mb-6 p-4 bg-gray-100 rounded-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Current Credentials:</h3>
            <p className="text-gray-700"><strong>Username:</strong> {currentAdminData.username}</p>
            <p className="text-gray-700"><strong>Password:</strong> {currentAdminData.password}</p>
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="mb-3">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">New Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4 relative">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">New Password:</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center top-6 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              {showPassword ? '🙈' : '👁️'} {/* Eye icon for toggle */}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Update Credentials
          </button>
        </form>
      </div>
    </div>
  );
};

export default Password;