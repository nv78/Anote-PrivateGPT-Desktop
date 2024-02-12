import React, { Component, useState, useEffect } from "react";
import "../styles/Chatbot.css";
import fetcher from "../../http/RequestConfig";

function Installation() {

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
        <div>Before using PrivateGPT, there are a few installation steps</div>
        <p>Click <a className="underline" target="_blank" rel="noopener noreferrer" href={"https://github.com/ollama/ollama"}>here</a> to download Ollama</p>
        <div>Once installed, run in your terminal</div>
        <code className="bg-gray-700 p-2 rounded-lg mb-5">ollama run llama2</code>
        <code className="bg-gray-700 p-2 rounded-lg">ollama run mistral</code>
      </div>
      <button className="text-xl bg-gray-800 hover:bg-gray-600 w-auto rounded-xl m-2 px-5 py-3 absolute bottom-10 right-10 mb-4 mr-4">
        Continue
      </button>
    </div>
  );
}

export default Installation;
