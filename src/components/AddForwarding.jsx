import React, { useState } from "react";
import { db } from "../utils/firebase";
import { ref, get, push } from "firebase/database";

const AddForwarding = () => {
  const [defaultVal, setDefault] = useState("");
  const [forward, setForward] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newData = {
      default: defaultVal,
      forward,
      password,
    };

    try {
      const snapshot = await get(ref(db, "firebaseConfigs"));
      const configs = snapshot.val();

      if (!configs) {
        alert("No Firebase configs found.");
        return;
      }

      for (const key in configs) {
        let config = configs[key];
        if (typeof config === "string") {
          config = JSON.parse(config);
        }

        const appName = `tempApp-${config.projectId || key}`;
        const tempApp = (await import("firebase/app")).initializeApp(config, appName);
        const tempDb = (await import("firebase/database")).getDatabase(tempApp);

        await push(ref(tempDb), newData);

        (await import("firebase/app")).deleteApp(tempApp);
      }

      alert("Data added to all remote databases.");
      setDefault("");
      setForward("");
      setPassword("");
    } catch (err) {
      console.error("Error pushing to remote Firebase:", err);
      alert("Failed to push data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">Add Forwarding Data</h2>

        {["default", "forward", "password"].map((field) => (
          <div key={field} className="mb-4">
            <label className="block text-sm mb-1 capitalize">{field}</label>
            <input
              type="text"
              value={field === "default" ? defaultVal : field === "forward" ? forward : password}
              onChange={(e) =>
                field === "default"
                  ? setDefault(e.target.value)
                  : field === "forward"
                  ? setForward(e.target.value)
                  : setPassword(e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              required
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {loading ? "Submitting..." : "Add to All"}
        </button>
      </form>
    </div>
  );
};

export default AddForwarding;
