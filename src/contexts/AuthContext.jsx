import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (check localStorage or sessionStorage)
    const checkAuthStatus = () => {
      try {
        const authStatus = localStorage.getItem('isAuthenticated');
        const loginTime = localStorage.getItem('loginTime');
        
        if (authStatus === 'true' && loginTime) {
          // Check if login is still valid (optional: add expiration logic)
          const currentTime = Date.now();
          const loginTimestamp = parseInt(loginTime);
          const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
          
          if (currentTime - loginTimestamp < sessionDuration) {
            setIsAuthenticated(true);
          } else {
            // Session expired, clear auth
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('loginTime');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('loginTime', Date.now().toString());
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loginTime');
    // Clear any other user data if needed
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
