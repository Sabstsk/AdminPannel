import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../utils/firebase';
import { ref, get } from 'firebase/database';

const Profile = () => {
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLoginAttempts = async () => {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await get(ref(db, 'loginAttempts'));
        const data = snapshot.val() || {};
        // Convert to array and sort by timestamp descending
        const attempts = Object.entries(data).map(([id, entry]) => ({ id, ...entry }));
        attempts.sort((a, b) => b.timestamp - a.timestamp);
        setLoginAttempts(attempts);
      } catch (err) {
        setError('Failed to load login attempts');
      } finally {
        setLoading(false);
      }
    };
    fetchLoginAttempts();
  }, []);

  const statusColor = (status) => {
    if (status === 'success') return 'text-green-600 bg-green-100';
    if (status === 'fail') return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-white mb-4">User Login Attempts</h1>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : loginAttempts.length === 0 ? (
          <div className="text-center text-gray-600 py-8">No login attempts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-blue-100">
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Username</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Time</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loginAttempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b last:border-b-0">
                    <td className="px-4 py-2 font-mono text-gray-800">{attempt.username}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {attempt.timestamp ? new Date(attempt.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className={`px-4 py-2 font-semibold rounded ${statusColor(attempt.status)}`}>{attempt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
