import React, { useState, useEffect } from "react";
import {  BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import fetcher from "./http/RequestConfig";

import HomeChatbot from "./financeGPT/components/Home.js"
import Installation from "./financeGPT/components/Installation.js"


function App() {
  const [modelsExist, setModelsExist] = useState(null);
  

  useEffect(() => {
    // Introduce a delay before calling checkModelsExist
    const timer = setTimeout(() => {
      checkModelsExist();
    }, 10000); // 5000 milliseconds = 5 seconds

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timer);
  }, []);


    const checkModelsExist = async () => {
      try {
          const response = await fetcher("/check-models", {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
          });
  
          if (!response.ok) {
              throw new Error("Network response was not ok");
          }
  
          const response_data = await response.json();

          if (response_data.llama2_exists && response_data.mistral_exists) {
            setModelsExist(true);
          } else {
            setModelsExist(false);
          }
  
          return response_data; // This contains whether each model exists e.g., { llama2_exists: true, mistral_exists: false }
      } catch (e) {
          console.error("Failed to check models:", e.message);
          return { llama2_exists: false, mistral_exists: false };
      }
  };

  if (modelsExist === null) {
    return (
    <div className="text-white flex flex-col mt-2 px-20">
    <div className="flex-grow">
      <h1 className="text-4xl font-semibold flex justify-center pt-10">
        <img src="logo.png" className="w-10 h-10" alt="logo" />
        <span>Private GPT</span>
      </h1>
      <h2 className="text-2xl text-center text-lime-300 font-semibold my-2 mb-10">
        Chat with your financial documents
      </h2>
    </div>
    <div className="flex flex-col text-l font-semibold space-y-4">
      <div>Checking if models are downloaded...</div>
    </div>
  </div>
    ); // Placeholder for loading state
  }
  

  return (
    <Router>
      <Routes>
        <Route path="/" element={modelsExist ? <Navigate to="/chatbot" /> : <Navigate to="/installation" />} />
        <Route path="/chatbot" element={<HomeChatbot />} />
        <Route path="/installation" element={<Installation />} />
      </Routes>
    </Router>
  );
}

export default App;
