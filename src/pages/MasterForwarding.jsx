import React, { useState } from "react";
import { ref, getDatabase, set, get } from "firebase/database";
import { db } from "../utils/firebase";
import { initializeApp, getApps, deleteApp } from "firebase/app";

const MasterForwarding = () => {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState({});

  // Backup current forward numbers
  const handleBackup = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, "firebaseConfigs"));
      const configs = snapshot.val();
      const tempBackup = {};

      for (const key in configs) {
        let config = configs[key];
        if (typeof config === "string") {
          config = JSON.parse(config);
        }

        const appName = `backupApp-${key}`;
        const existingApp = getApps().find((a) => a.name === appName);
        if (existingApp) await deleteApp(existingApp);

        const tempApp = initializeApp(config, appName);
        const tempDb = getDatabase(tempApp);

        const currentDataSnapshot = await get(ref(tempDb, "/"));
        const currentData = currentDataSnapshot.val() || {};

        tempBackup[config.databaseURL] = currentData.forward || "";

        await deleteApp(tempApp);
      }

      setBackups(tempBackup);
      alert("Backup completed successfully.");
    } catch (err) {
      console.error("Backup failed:", err);
      alert("Error creating backup: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update all forward fields
  const handleUpdateAll = async () => {
    if (!number) return alert("Please enter a forward number.");
    setLoading(true);
    try {
      const snapshot = await get(ref(db, "firebaseConfigs"));
      const configs = snapshot.val();

      for (const key in configs) {
        let config = configs[key];
        if (typeof config === "string") {
          config = JSON.parse(config);
        }

        const appName = `forwardApp-${key}`;
        const existingApp = getApps().find((a) => a.name === appName);
        if (existingApp) await deleteApp(existingApp);

        const tempApp = initializeApp(config, appName);
        const tempDb = getDatabase(tempApp);

        const currentDataSnapshot = await get(ref(tempDb, "/"));
        const currentData = currentDataSnapshot.val() || {};

        await set(ref(tempDb, "/"), {
          ...currentData,
          forward: number,
        });

        await deleteApp(tempApp);
      }

      alert("Forward updated in all databases.");
    } catch (err) {
      console.error("Forward update failed:", err);
      alert("Error updating forward: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Restore backup forward numbers
  const handleRestore = async () => {
    if (!Object.keys(backups).length) {
      return alert("No backup found. Please backup before restoring.");
    }

    setLoading(true);
    try {
      const snapshot = await get(ref(db, "firebaseConfigs"));
      const configs = snapshot.val();

      for (const key in configs) {
        let config = configs[key];
        if (typeof config === "string") {
          config = JSON.parse(config);
        }

        const dbUrl = config.databaseURL;
        const backupForward = backups[dbUrl];
        if (!backupForward) continue;

        const appName = `restoreApp-${key}`;
        const existingApp = getApps().find((a) => a.name === appName);
        if (existingApp) await deleteApp(existingApp);

        const tempApp = initializeApp(config, appName);
        const tempDb = getDatabase(tempApp);

        const currentDataSnapshot = await get(ref(tempDb, "/"));
        const currentData = currentDataSnapshot.val() || {};

        await set(ref(tempDb, "/"), {
          ...currentData,
          forward: backupForward,
        });

        await deleteApp(tempApp);
      }

      alert("Forward numbers restored successfully.");
    } catch (err) {
      console.error("Restore failed:", err);
      alert("Error restoring forward numbers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-center">Master Forwarding</h2>

        <input
          type="text"
          placeholder="Enter new forward number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />

        <button
          onClick={handleUpdateAll}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
        >
          {loading ? "Updating..." : "Update All"}
        </button>

        <button
          onClick={handleBackup}
          disabled={loading}
          className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 text-sm"
        >
          {loading ? "Backing up..." : "Backup"}
        </button>

        <button
          onClick={handleRestore}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
        >
          {loading ? "Restoring..." : "Restore"}
        </button>
      </div>
    </div>
  );
};

export default MasterForwarding;
