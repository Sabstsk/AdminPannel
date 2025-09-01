import React, { useState, useEffect } from "react";
import { ref, getDatabase, set, get } from "firebase/database";
import { db } from "../utils/firebase";
import { initializeApp, getApps, deleteApp } from "firebase/app";

const MasterForwarding = () => {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState({});
  const [lastBackupTime, setLastBackupTime] = useState(null);

  // Load existing backups on component mount
  useEffect(() => {
    const loadBackups = async () => {
      try {
        const backupSnapshot = await get(ref(db, "forwardBackups"));
        const backupData = backupSnapshot.val();
        if (backupData) {
          setBackups(backupData.backups || {});
          setLastBackupTime(backupData.timestamp || null);
        }
      } catch (error) {
        console.error("Error loading backups:", error);
      }
    };
    loadBackups();
  }, []);

  // Backup current forward numbers
  const handleBackup = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, "firebaseConfigs"));
      const configs = snapshot.val();
      
      if (!configs) {
        alert("No Firebase configurations found to backup.");
        return;
      }

      const tempBackup = {};
      const backupResults = [];

      for (const key in configs) {
        try {
          let config = configs[key];
          if (typeof config === "string") {
            try {
              config = JSON.parse(config);
            } catch (parseError) {
              console.error(`Failed to parse config for ${key}:`, parseError);
              backupResults.push(`❌ ${key}: Config parse error`);
              continue;
            }
          }

          if (!config.databaseURL) {
            backupResults.push(`❌ ${key}: No database URL`);
            continue;
          }

          const appName = `backupApp-${key}`;
          const existingApp = getApps().find((a) => a.name === appName);
          if (existingApp) await deleteApp(existingApp);

          const tempApp = initializeApp(config, appName);
          const tempDb = getDatabase(tempApp);

          const currentDataSnapshot = await get(ref(tempDb, "/"));
          const currentData = currentDataSnapshot.val() || {};

          
          const safeKey = key.replace(/[.#$\/\[\]]/g, '_');
          tempBackup[safeKey] = {
            forward: currentData.forward || "",
            projectId: config.projectId || key,
            databaseURL: config.databaseURL,
            backupTime: Date.now()
          };

          backupResults.push(`✅ ${config.projectId || key}: ${currentData.forward || 'No forward number'}`);
          await deleteApp(tempApp);
        } catch (err) {
          console.error(`Error backing up ${key}:`, err);
          backupResults.push(`❌ ${key}: ${err.message}`);
        }
      }

      // Store backup in Firebase
      const backupData = {
        backups: tempBackup,
        timestamp: Date.now(),
        totalProjects: Object.keys(tempBackup).length,
        createdBy: 'admin'
      };

      await set(ref(db, "forwardBackups"), backupData);
      
      setBackups(tempBackup);
      setLastBackupTime(Date.now());
      
      alert(`Backup completed!\n\n${backupResults.join('\n')}\n\nTotal: ${Object.keys(tempBackup).length} projects backed up.`);
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
      return alert("No backup found. Please create a backup first.");
    }

    const confirmRestore = window.confirm(
      `Are you sure you want to restore forward numbers from backup?\n\nThis will overwrite current forward numbers in all ${Object.keys(backups).length} projects.\n\nLast backup: ${lastBackupTime ? new Date(lastBackupTime).toLocaleString() : 'Unknown'}`
    );
    
    if (!confirmRestore) return;

    setLoading(true);
    try {
      const snapshot = await get(ref(db, "firebaseConfigs"));
      const configs = snapshot.val();
      const restoreResults = [];

      if (!configs) {
        alert("No Firebase configurations found.");
        return;
      }

      for (const key in configs) {
        try {
          let config = configs[key];
          if (typeof config === "string") {
            try {
              config = JSON.parse(config);
            } catch (parseError) {
              restoreResults.push(`❌ ${key}: Config parse error`);
              continue;
            }
          }

          // Find backup data using safe key
          const safeKey = key.replace(/[.#$\/\[\]]/g, '_');
          const backupData = backups[safeKey];
          
          if (!backupData || !backupData.forward) {
            restoreResults.push(`⚠️ ${config.projectId || key}: No backup data found`);
            continue;
          }

          const appName = `restoreApp-${key}`;
          const existingApp = getApps().find((a) => a.name === appName);
          if (existingApp) await deleteApp(existingApp);

          const tempApp = initializeApp(config, appName);
          const tempDb = getDatabase(tempApp);

          const currentDataSnapshot = await get(ref(tempDb, "/"));
          const currentData = currentDataSnapshot.val() || {};

          await set(ref(tempDb, "/"), {
            ...currentData,
            forward: backupData.forward,
          });

          restoreResults.push(`✅ ${config.projectId || key}: Restored to ${backupData.forward}`);
          await deleteApp(tempApp);
        } catch (err) {
          console.error(`Error restoring ${key}:`, err);
          restoreResults.push(`❌ ${key}: ${err.message}`);
        }
      }

      alert(`Restore completed!\n\n${restoreResults.join('\n')}`);
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

        {/* Backup Status */}
        {lastBackupTime && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium">Last Backup:</span>
              <span className="text-blue-600">{new Date(lastBackupTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-blue-700 font-medium">Projects:</span>
              <span className="text-blue-600">{Object.keys(backups).length} backed up</span>
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="Enter new forward number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleUpdateAll}
          disabled={loading || !number.trim()}
          className={`w-full py-2 rounded text-sm font-medium transition-colors ${
            loading || !number.trim()
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? "Updating..." : "Update All Projects"}
        </button>

        <button
          onClick={handleBackup}
          disabled={loading}
          className={`w-full py-2 rounded text-sm font-medium transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }`}
        >
          {loading ? "Backing up..." : "🔄 Backup Current Numbers"}
        </button>

        <button
          onClick={handleRestore}
          disabled={loading || !Object.keys(backups).length}
          className={`w-full py-2 rounded text-sm font-medium transition-colors ${
            loading || !Object.keys(backups).length
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {loading ? "Restoring..." : "📥 Restore from Backup"}
        </button>

        {!Object.keys(backups).length && (
          <p className="text-sm text-gray-500 text-center">
            Create a backup first to enable restore functionality
          </p>
        )}
      </div>
    </div>
  );
};

export default MasterForwarding;
