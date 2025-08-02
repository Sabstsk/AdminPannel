import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../utils/firebase";
import { ref, onValue } from "firebase/database";

const Dashboard = () => {
  const navigate = useNavigate();
  const [configCount, setConfigCount] = useState(0);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/');
    }

    const configsRef = ref(db, "firebaseConfigs");
    const unsubscribe = onValue(configsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setConfigCount(Object.keys(data).length);
      } else {
        setConfigCount(0);
      }
    }, (error) => {
      console.error("Error fetching config count:", error);
      setConfigCount(0);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      {/* Main Content */}
      <main className="flex flex-col items-center justify-center h-[calc(100vh-0px)] px-4">
        <div className="bg-white rounded-xl shadow-xl p-10 w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-blue-700 mb-4">Welcome to the Dashboard</h1>
          <p className="text-gray-600 mb-4">
            You are now logged in! This is your main dashboard panel.
          </p>
          <p className="text-xl font-semibold text-blue-500">
            Total Firebase Configurations: {configCount}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
