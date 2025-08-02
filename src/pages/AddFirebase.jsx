import React, { useState } from "react";
import { db } from "../utils/firebase";
import { ref, push, get } from "firebase/database";
import JSON5 from "json5";

const AddFirebase = () => {
  const [jsonInput, setJsonInput] = useState("");

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let dataToParse = jsonInput.trim();
  
      // Remove trailing semicolon if any
      if (dataToParse.endsWith(";")) {
        dataToParse = dataToParse.slice(0, -1);
      }
  
      // Try to extract variable assignment part if present
      const regex = /(?:const|let|var)?\s*\w+\s*=\s*([\s\S]*)/;
      const match = dataToParse.match(regex);
      if (match && match[1]) {
        dataToParse = match[1];
      }
  
      // Use JSON5 parse for JS-style object literals
      const parsedData = JSON5.parse(dataToParse);
  
      if (!parsedData || typeof parsedData !== "object" || !parsedData.databaseURL) {
        alert("Invalid config: 'databaseURL' is required in the Firebase config object.");
        return;
      }
  
      const configsRef = ref(db, "firebaseConfigs");
      const snapshot = await get(configsRef);
      const existingConfigs = snapshot.val();
  
      let isDuplicate = false;
  
      if (existingConfigs) {
        for (const key in existingConfigs) {
          let storedConfig = existingConfigs[key];
          if (typeof storedConfig === "string") {
            try {
              storedConfig = JSON.parse(storedConfig);
            } catch {
              continue;
            }
          }
          if (
            storedConfig.databaseURL === parsedData.databaseURL ||
            storedConfig.projectId === parsedData.projectId ||
            storedConfig.appId === parsedData.appId
          ) {
            isDuplicate = true;
            break;
          }
        }
      }
  
      if (isDuplicate) {
        alert("Error: This Firebase config already exists.");
      } else {
        await push(configsRef, parsedData); // Push the parsed object directly
        alert("Firebase config added successfully!");
        setJsonInput("");
      }
    } catch (error) {
      alert("Invalid format: " + error.message);
    }
  };
  
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Add Firebase Configuration
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="jsonInput"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Paste Firebase Config:
            </label>
            <textarea
              id="jsonInput"
              name="jsonInput"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows="10"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={`Paste config as JSON or JavaScript variable declaration here.`}
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Configuration
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddFirebase;
