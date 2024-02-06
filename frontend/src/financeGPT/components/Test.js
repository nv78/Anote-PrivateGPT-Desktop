import React, { Component, useState, useEffect } from "react";
import Navbarchatbot from "./NavbarChatbot";
import Chatbot from "./Chatbot";
import "../styles/Chatbot.css";
import SidebarChatbot from "./SidebarChatbot";
import fetcher from "../../http/RequestConfig";
import ChatbotEdgar from "./chatbot_subcomponents/ChatbotEdgar";

function Test() {

  const testClick = async () => {
    console.log("hello");
    const response = await fetcher("test-flask", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
    const data = await response.json();
    console.log("data is", data)
  };

  return (
    <div className="flex flex-row mt-2 text-white">
        Test
        <button className="border" onClick={testClick}>Click</button>
    </div>
  );
}

export default Test;
