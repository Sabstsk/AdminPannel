import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from "../utils/firebase";
import { ref, onValue } from "firebase/database";
import { FiDatabase, FiUsers, FiMessageSquare, FiSettings, FiArrowRight } from 'react-icons/fi';

const StatCard = ({ icon, title, value, color }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 ${color}`}>
    <div className={`text-3xl ${color.replace('border', 'text')}`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const QuickLink = ({ to, icon, title, subtitle }) => (
  <Link to={to} className="bg-white p-5 rounded-xl shadow-lg flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all duration-300">
    <div className="flex items-center space-x-4">
      <div className="text-2xl text-blue-600">{icon}</div>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
    <FiArrowRight className="text-gray-400" />
  </Link>
);

const Navbar = ({ onLogout }) => {
    return (
        <nav className="fixed top-0 left-0 w-full bg-black bg-opacity-70 backdrop-blur-md text-white shadow-lg z-20" style={{ fontFamily: 'Fira Mono, Courier, monospace' }}>
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="text-xl font-bold text-blue-600">
                    <span className="glitch text-blue-600" data-text="Terminal_App">Terminal_App</span>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onLogout}
                        className="hacker-btn-sm"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [configCount, setConfigCount] = useState(0);
    const [messageCount, setMessageCount] = useState(0);
    const [userCount, setUserCount] = useState(0);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            navigate('/');
        }

        const configsRef = ref(db, "firebaseConfigs");
        const messagesRef = ref(db, "Milk");
        const usersRef = ref(db, "Cow");

        const unsubscribeConfigs = onValue(configsRef, (snapshot) => {
            setConfigCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
        });

        const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
            setMessageCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
        });

        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            setUserCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
        });

        return () => {
            unsubscribeConfigs();
            unsubscribeMessages();
            unsubscribeUsers();
        };
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        navigate('/');
    };

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div className="space-y-8 pt-24">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard icon={<FiDatabase />} title="Firebase Configs" value={configCount} color="border-blue-500" />
                    <StatCard icon={<FiUsers />} title="Total Users" value={userCount} color="border-green-500" />
                    <StatCard icon={<FiMessageSquare />} title="Total Messages" value={messageCount} color="border-purple-500" />
                </div>

                {/* Quick Links */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Quick Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuickLink to="/add-firebase-config" icon={<FiDatabase />} title="Manage Firebase" subtitle="Add or edit configurations" />
                        <QuickLink to="/messages" icon={<FiMessageSquare />} title="View Messages" subtitle="Check all incoming messages" />
                        <QuickLink to="/credentials" icon={<FiUsers />} title="User Credentials" subtitle="Manage user data" />
                        <QuickLink to="/password" icon={<FiSettings />} title="Admin Settings" subtitle="Update your password" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;