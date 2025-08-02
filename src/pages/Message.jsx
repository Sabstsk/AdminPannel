import React, { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { ref, get } from "firebase/database";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const Message = () => {
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllMilkMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const configsSnapshot = await get(ref(db, "firebaseConfigs"));
        const configs = configsSnapshot.val() || {};

        let combinedMessages = [];

        for (const key in configs) {
          let config = configs[key];

          if (typeof config === "string") {
            try {
              config = JSON.parse(config);
            } catch (e) {
              console.warn(`Skipping config ${key} due to JSON parse error.`);
              continue;
            }
          }

          if (!config.databaseURL) {
            console.warn(`Skipping config ${key} as no databaseURL found.`);
            continue;
          }

          const appName = `remoteApp-${key}`;
          const existingApp = getApps().find((app) => app.name === appName);
          if (existingApp) {
            await deleteApp(existingApp);
          }

          try {
            const remoteApp = initializeApp(config, appName);
            const remoteDb = getDatabase(remoteApp);
            const milkSnapshot = await get(ref(remoteDb, "Milk"));
            const milkData = milkSnapshot.val();

            if (milkData) {
              const messages = Object.entries(milkData).map(([msgKey, msgVal]) => ({
                id: msgKey,
                ...msgVal,
                _projectId: config.projectId || key,
                _databaseURL: config.databaseURL,
              }));
              combinedMessages = combinedMessages.concat(messages);
            }
            await deleteApp(remoteApp);
          } catch (remoteErr) {
            // Handle error for this particular remote DB (like permission denied)
            console.warn(
              `Skipping ${key} due to error fetching Milk data:`,
              remoteErr.message || remoteErr
            );
            // Don't throw; continue to next config
          }
        }

        combinedMessages.sort((a, b) => (a.id < b.id ? 1 : -1));

        setAllMessages(combinedMessages);
      } catch (err) {
        console.error("Error fetching Milk data:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMilkMessages();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading Milk messages...
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
        <h2 className="text-2xl font-bold mb-6 text-center">All Milk Messages</h2>

        {allMessages.length === 0 ? (
          <p className="text-center text-gray-600">
            No Milk messages found in any Firebase database.
          </p>
        ) : (
          <div className="space-y-4 max-h-[80vh] overflow-auto">
            {allMessages.map((msg) => (
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
        )}
      </div>
    </div>
  );
};

export default Message;
