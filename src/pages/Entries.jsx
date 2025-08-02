import React, { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { ref, onValue, set, getDatabase } from "firebase/database";
import { initializeApp, getApps, deleteApp } from "firebase/app";

const Entries = () => {
  const [firebaseConfigs, setFirebaseConfigs] = useState([]);
  const [remoteData, setRemoteData] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const configsRef = ref(db, "firebaseConfigs");

    const unsubscribe = onValue(configsRef, async (snapshot) => {
      const data = snapshot.val();
      const configs = [];

      if (data) {
        for (const key in data) {
          let config = data[key];
          if (typeof config === "string") {
            try {
              config = JSON.parse(config);
            } catch {}
          }
          if (config?.databaseURL) {
            configs.push({ id: key, ...config });
          }
        }
      }

      setFirebaseConfigs(configs);
      setLoading(false);

      // Load remote data
      for (const config of configs) {
        try {
          const appName = `remoteApp-${config.projectId || config.id}`;
          const existingApp = getApps().find((app) => app.name === appName);
          if (existingApp) {
            await deleteApp(existingApp);
          }

          const tempApp = initializeApp(config, appName);
          const tempDb = getDatabase(tempApp);
          const remoteRef = ref(tempDb, "/");

          onValue(remoteRef, (snap) => {
            const val = snap.val();
            setRemoteData((prev) => ({
              ...prev,
              [config.databaseURL]: val,
            }));

            setInputs((prev) => ({
              ...prev,
              [config.databaseURL]: {
                default: val?.default || "",
                forward: val?.forward || "",
                password: val?.password || "",
              },
            }));
          });
        } catch (err) {
          console.error(`Error loading from ${config.databaseURL}:`, err);
          setRemoteData((prev) => ({
            ...prev,
            [config.databaseURL]: { error: err.message },
          }));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (url, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [url]: {
        ...prev[url],
        [field]: value,
      },
    }));
  };

  const handleUpdate = async (config) => {
    const appName = `remoteApp-${config.projectId || config.id}`;
    const tempApp = getApps().find((app) => app.name === appName);
    if (!tempApp) return alert("App not initialized.");

    const tempDb = getDatabase(tempApp);
    const updateRef = ref(tempDb, "/");

    const existingData = remoteData[config.databaseURL] || {};
    const updatedFields = inputs[config.databaseURL];

    try {
      const updatedData = {
        ...existingData,
        ...updatedFields,
      };

      await set(updateRef, updatedData);
      alert("Updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed: " + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="text-red-600 p-8 text-center">Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Remote Firebase Database</h2>
        {firebaseConfigs.length === 0 ? (
          <p className="text-center text-gray-500">No Firebase configs found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {firebaseConfigs.map((config) => {
              const url = config.databaseURL;
              const values = inputs[url] || {};
              const allData = remoteData[url];

              return (
                <div key={url} className="border border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-600 mb-2">
                    {config.projectId || "Project"}
                  </h3>
                  <p className="text-xs text-gray-600 break-all mb-4">{url}</p>

                  <div className="space-y-3 mb-4">
                    {["default", "forward", "password"].map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium capitalize">{field}</label>
                        <input
                          type="text"
                          value={values[field] || ""}
                          onChange={(e) => handleChange(url, field, e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => handleUpdate(config)}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      Update
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200 rounded p-2 text-sm max-h-60 overflow-auto">
                    <p className="font-semibold mb-1 text-gray-700">Stored Data:</p>
                    <pre className="text-xs text-gray-700">{JSON.stringify(allData, null, 2)}</pre>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Entries;
