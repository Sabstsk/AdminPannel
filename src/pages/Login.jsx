import React, { useState } from 'react';
import { db } from '../utils/firebase'; // Corrected import path
import { ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const snapshot = await get(ref(db, 'admin'));
      const adminData = snapshot.val();

      if (adminData) {
        if (adminData.username === username && adminData.password === password) {
          localStorage.setItem('isLoggedIn', 'true');
          navigate('/dashboard');
        } else {
          setError('Incorrect username or password');
        }
      } else {
        setError('No admin data found');
      }
    } catch (error) {
      setError('Firebase error: ' + error.message);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d)' }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
        >
          Login
        </button>

        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
