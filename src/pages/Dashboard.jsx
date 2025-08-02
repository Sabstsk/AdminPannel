import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../utils/firebase";
import { ref, onValue } from "firebase/database";

// Navbar Component - You can place this in its own file (e.g., Navbar.jsx)
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
        <>
            {/* Navbar is now included here */}
            <Navbar onLogout={handleLogout} />

            {/* Hacker Background (z-0, never above navbar) */}
            <div className="hacker-bg" style={{ zIndex: 0 }}></div>
            
            {/* Main dashboard card, centered with margin but not full screen */}
            {/* Added pt-24 to push the content down below the fixed navbar */}
            <div className="flex justify-center items-start w-full pt-24 pb-10 px-4">
                <div className="hacker-card p-10 w-full max-w-lg text-center z-10 shadow-2xl border-2 border-blue-500" style={{ backdropFilter: 'blur(3px)' }}>
                    {/* Glitch Effect on Title */}
                    <h1 className="glitch mb-4" data-text="Welcome to the Dashboard" style={{ fontFamily: 'Fira Mono, Courier, monospace', fontSize: '2.3rem', letterSpacing: '0.01em' }}>
                        Welcome to the Dashboard
                    </h1>

                    <p className="text-white mb-4" style={{ fontFamily: 'Fira Mono, Courier, monospace', fontSize: '1.1rem' }}>
                        You are now logged in! This is your main dashboard panel.
                    </p>
                    <p className="text-xl font-semibold" style={{ color: '#00e0ff', fontFamily: 'Fira Mono, Courier, monospace' }}>
                        Total Firebase Configurations: {configCount}
                    </p>

                    {/* Glitch Effect on Power Status */}
                    <p className="text-3xl font-extrabold text-[#ff0055] mt-6 glitch" data-text="Access Rank: GOD MODE UNLOCKED" style={{ fontFamily: 'Fira Mono, Courier, monospace' }}>
                        🔓 Access Rank: <span style={{ color: '#fff' }}>GOD MODE UNLOCKED</span>
                    </p>
                    <p className="text-md text-blue-300 mt-2 italic" style={{ fontFamily: 'Fira Mono, Courier, monospace' }}>
                        You’ve entered a space reserved for system-level mastery.
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <button className="hacker-btn w-full" style={{ maxWidth: '240px' }}>System Logs</button>
                        <button className="hacker-btn w-full" style={{ maxWidth: '240px' }}>Manage Configs</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;