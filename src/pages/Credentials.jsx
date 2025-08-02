import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../utils/firebase";
import { ref, get, getDatabase } from "firebase/database";
import { initializeApp, getApps, deleteApp } from "firebase/app";

// Cache for storing fetched data
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Credentials = () => {
  const [allCowData, setAllCowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  // Optimized data fetching with caching and parallel processing
  const fetchDataFromConfig = useCallback(async (key, config) => {
    const cacheKey = `${key}-${config.databaseURL}`;
    const cached = dataCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    if (typeof config === "string") {
      try {
        config = JSON.parse(config);
      } catch (e) {
        console.warn(`Skipping config ${key} due to JSON parse error:`, e.message);
        return [];
      }
    }

    if (!config.databaseURL) {
      console.warn(`Skipping config ${key} as no databaseURL found.`);
      return [];
    }

    const appName = `cowApp-${key}-${Date.now()}`;
    let remoteApp = null;

    try {
      remoteApp = initializeApp(config, appName);
      const remoteDb = getDatabase(remoteApp);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = get(ref(remoteDb, "Cow"));
      const cowSnapshot = await Promise.race([dataPromise, timeoutPromise]);
      const cowData = cowSnapshot.val();

      if (cowData) {
        const entries = Object.entries(cowData).map(([entryId, entryVal]) => ({
          id: entryId,
          ...entryVal,
          _projectId: config.projectId || key,
        }));
        
        // Cache the result
        dataCache.set(cacheKey, {
          data: entries,
          timestamp: Date.now()
        });
        
        return entries;
      }
      return [];
    } catch (remoteErr) {
      console.warn(
        `Error fetching Cow data from ${config.databaseURL}:`,
        remoteErr.message || remoteErr
      );
      return [];
    } finally {
      if (remoteApp) {
        try {
          await deleteApp(remoteApp);
        } catch (e) {
          console.error('Error deleting app:', e);
        }
      }
    }
  }, []);

  const fetchAllCowData = useCallback(async () => {
    try {
      setLoading(true);
      setBackgroundLoading(false);
      setError(null);
      setAllCowData([]);

      const configsSnapshot = await get(ref(db, "firebaseConfigs"));
      const configs = configsSnapshot.val() || {};
      const configEntries = Object.entries(configs);
      let finishedCount = 0;
      let combinedCowData = [];
      let firstPageShown = false;

      // Progressive rendering: as each config loads, append results
      await Promise.all(
        configEntries.map(async ([key, config]) => {
          try {
            const entries = await fetchDataFromConfig(key, config);
            combinedCowData = combinedCowData.concat(entries);
            // Sort and update state after each config
            combinedCowData.sort((a, b) => {
              const tsA = Number(a.timestamp) || 0;
              const tsB = Number(b.timestamp) || 0;
              return tsB - tsA;
            });
            // Show first page as soon as we have enough data
            if (!firstPageShown && combinedCowData.length >= itemsPerPage) {
              setAllCowData([...combinedCowData]);
              setLoading(false);
              setBackgroundLoading(true);
              firstPageShown = true;
            } else if (!firstPageShown) {
              setAllCowData([...combinedCowData]);
            } else {
              setAllCowData([...combinedCowData]); // Keep updating as more data arrives
            }
          } catch (err) {
            console.warn(`Failed to fetch data for config ${key}:`, err);
          } finally {
            finishedCount++;
            if (finishedCount === configEntries.length) {
              setLoading(false);
              setBackgroundLoading(false);
            }
          }
        })
      );
    } catch (err) {
      console.error("Error fetching all Cow data:", err);
      setError(err);
      setLoading(false);
      setBackgroundLoading(false);
    }
  }, [fetchDataFromConfig, itemsPerPage]);

  useEffect(() => {
    fetchAllCowData();

    return () => {
      // Cleanup any remaining apps
      getApps().forEach((app) => {
        if (app.name.startsWith("cowApp-")) {
          deleteApp(app).catch((e) => console.error("Error deleting temp app:", e));
        }
      });
    };
  }, [fetchAllCowData]);

  const formatDate = useCallback((ms) => {
    const date = new Date(Number(ms));
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
  }, []);

  // Filter and paginate data
  const filteredData = useMemo(() => {
    if (!searchTerm) return allCowData;
    return allCowData.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [allCowData, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Serial number for each row (descending, latest at top)
  const getSerialNumber = (index) => {
    return filteredData.length - ((currentPage - 1) * itemsPerPage + index);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    setBackgroundLoading(true);
    // Start background fetch, but don't clear data immediately
    fetchAllCowData();
  }, [fetchAllCowData]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading User data...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment for the first load</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        Error: {error.message}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">All Users Path Data</h2>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Search and Stats */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-600">
              Showing {paginatedData.length} of {filteredData.length} entries (Total loaded: {allCowData.length})
              {backgroundLoading && (
                <span className="ml-2 text-blue-500 animate-pulse">Loading more in background...</span>
              )}
            </div>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <p className="text-center text-gray-600">
            {allCowData.length === 0 
              ? "No data found at /Cow path in any Firebase database."
              : "No data matches your search criteria."
            }
          </p>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {paginatedData.map((dataEntry, idx) => (
              <div
                key={`${dataEntry._projectId}-${dataEntry.id}`}
                className="border border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm"
              >
                <div className="flex items-center mb-1">
                  <span className="text-xs font-bold text-blue-400 mr-2">#{getSerialNumber(idx)}</span>
                  <p className="text-sm font-medium">Entry ID: {dataEntry.id}</p>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  <strong>Project:</strong> {dataEntry._projectId}
                </p>

                <p className="text-sm font-medium mb-1">Entry ID: {dataEntry.id}</p>
                {dataEntry.timestamp && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Timestamp:</strong> {formatDate(dataEntry.timestamp)}
                  </p>
                )}

                <ul className="text-sm text-gray-700 list-disc list-inside">
                  {Object.entries(dataEntry).map(([key, value]) => {
                    if (key.startsWith("_") || key === "id" || key === "timestamp") return null;
                    return (
                      <li key={key}>
                        <strong>{key}:</strong>{" "}
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 
                    ? i + 1 
                    : currentPage >= totalPages - 2 
                      ? totalPages - 4 + i 
                      : currentPage - 2 + i;
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              
              <span className="text-sm text-gray-600 ml-4">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);
};
export default Credentials;
