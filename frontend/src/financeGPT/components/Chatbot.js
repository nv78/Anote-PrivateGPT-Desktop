import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PDFUploader from "./PdfUploader";
import {
  faFileDownload,
  faPaperPlane,
  faUndoAlt,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/Chatbot.css";
import fetcher from "../../http/RequestConfig";

const Chatbot = (props) => {
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const responseColor = "white";
  const userColor = "black";

  //initial state
  useEffect(() => {
    loadLatestChat();
    handleLoadChat();
    setMessages([
      {
        message: "Hello, I am your financial assistant, how can I help you?",
        sentTime: "just now",
        direction: "incoming",
      },
    ]);
  }, []);

  useEffect(() => {
    handleLoadChat();
  }, [props.selectedChatId, props.forceUpdate]);

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const loadLatestChat = async () => {
    try {
      const response = await fetcher("find-most-recent-chat", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), 
    });

      const response_data = await response.json();

      props.handleChatSelect(response_data.chat_info.id);
      props.setCurrChatName(response_data.chat_info.chat_name)


    } catch (e) {
      console.error("Error during chat deletion", e);
    }
  }

  const handleDownload = async () => {
    if (props.selectedChatId === null) {
      console.log("Error: no chat selected"); //replace this later with a popup
    } else {
      try {
        console.log("handledownlaod1, ", props.selectedChatId, props.chat_type);
        const response = await fetcher("download-chat-history", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: props.selectedChatId,
            chat_type: props.chat_type,
          }),
        });
      } catch (e) {
        console.error("Error in fetcher:", e);
      }
    }
  };

  const togglePopup = (index) => {
    props.setActiveMessageIndex(props.activeMessageIndex === index ? null : index);
  };

  const handleTryMessage = (text, chat_id, isPrivate) => {
    if (chat_id === null || chat_id === undefined) {
      props.createNewChat().then((newChatId) => {
        if (newChatId) {
          handleSendMessage(text, newChatId, isPrivate);
        } else {
          console.error("Failed to create new chat");
        }
      });
    } else {
      handleSendMessage(text, chat_id, isPrivate);
    }
  };

  const handleSendMessage = async (text, chat_id) => {
    console.log("props confirmed model key", props.confirmedModelKey);
    inputRef.current.value = "";

    const tempMessageId = Date.now();
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        message: text,
        direction: "outgoing",
      },
      {
        id: tempMessageId,
        message: "Loading...",
        direction: "incoming",
      },
    ]);

    try {
      scrollToBottom();
      const response = await fetcher("process-message-pdf", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          chat_id: chat_id,
          model_type: props.isPrivate,
          model_key: props.confirmedModelKey,
        }),
      });
      const response_data = await response.json();
      const answer = response_data.answer;
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempMessageId
            ? { ...msg, message: answer, id: undefined } // Replace the loading message
            : msg
        )
      );

      handleLoadChat();
      scrollToBottom();
    } catch (e) {
      console.error("Error in fetcher:", e);
    }
  };

  const handleLoadChat = async () => {
    try {
      const response = await fetcher("retrieve-messages-from-chat", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: props.selectedChatId,
          chat_type: props.chat_type,
        }),
      });

      setMessages([
        {
          message: "Hello, I am your financial assistant, how can I help you?",
          sentTime: "just now",
          direction: "incoming",
        },
      ]);

      const response_data = await response.json();

      const transformedMessages = response_data.messages.map((item) => ({
        message: item.message_text,
        direction: item.sent_from_user === 1 ? "outgoing" : "incoming",
        relevant_chunks: item.relevant_chunks,
      }));

      setMessages((prevMessages) => [...prevMessages, ...transformedMessages]);
    } catch (error) {
      console.error("Error loading chat messages:", error);
    }
  };

  const handleReset = () => {
    console.log("ENTERED RESET HANDLER");

    resetServer();
  };

  const resetServer = () => {
    axios
      .post("http://localhost:5000/api/reset-everything")
      .then((response) => {
        console.log("EXITED RESET HANDLER");
        console.log(response.data); // Reset was successful!
        // Reset the state to its initial values
        setMessages([
          {
            message:
              "Hello, I am your financial assistant, how can I help you?",
            sentTime: "just now",
            direction: "incoming",
          },
        ]);
      })
      .catch((error) => {
        console.error("Failed to reset:", error);
        // Handle error cases here
      });
  };

  return (
    <>
      <div className="min-h-[90vh] h-[90vh] mt-2 relative bg-[#2A2C38] p-4 w-full rounded-2xl">
        {props.currChatName ? (
          <>
            <div className="flex flex-row justify-between">
              <FontAwesomeIcon
                icon={faUndoAlt}
                onClick={handleReset}
                className="reset-icon"
              />
              <div className="text-white font-bold">{props.currChatName}</div>
              <div className="download-button send-button">
                <FontAwesomeIcon
                  icon={faFileDownload}
                  onClick={handleDownload}
                  className="file-upload"
                />
              </div>
            </div>
            <hr />
            <div className="flex flex-col space-y-2 h-[70vh] overflow-y-scroll relative">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${
                    msg.direction === "incoming" ? "incoming" : "outgoing"
                  }`}
                >
                  <div className="message-content">
                    <div
                      className="message-text"
                      style={{
                        color:
                          msg.direction === "incoming"
                            ? responseColor
                            : userColor,
                      }}
                    >
                      {msg.message}
                    </div>
                    {msg.direction === "incoming" && index != 0 && (
                      <FontAwesomeIcon
                        style={{
                          height: "13px",
                          cursor: "pointer",
                          marginLeft: "10px",
                        }}
                        icon={faEye}
                        onClick={() => togglePopup(index)}
                        className="eye-icon text-white"
                      />
                    )}

                    {props.activeMessageIndex === index && (
                      <div
                        style={{
                          position: "absolute",
                          border: "1px solid #ccc",
                          padding: "10px",
                          borderRadius: "5px",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                          width: "70%",
                          height: "30%",
                          overflowY: "auto",
                          whiteSpace: "pre-wrap",
                        }}
                        className="bg-gray-900 text-white"
                      >
                        {console.log(
                          "active message index",
                          props.activeMessageIndex,
                          index
                        )}
                        {console.log("xyz is", msg.relevant_chunks)}
                        {props.setRelevantChunk(msg.relevant_chunks)}
                        <p>{msg.relevant_chunks}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* Empty div for scrolling */}
            </div>
            <div className="absolute bottom-12 flex items-center w-[95%] mx-auto ">
              <div className="mr-4 text-white bg-[#3A3B41] rounded-xl p-2 cursor-pointer">
                <PDFUploader
                  className=""
                  chat_id={props.selectedChatId}
                  handleForceUpdate={props.handleForceUpdate}
                />
              </div>
              <input
                className="w-full rounded-xl bg-[#3A3B41] border-none focus:ring-0 focus:border-white text-white placeholder:text-gray-300"
                type="text"
                placeholder="Type message here"
                ref={inputRef} // Assign the input ref
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const text = e.target.value;
                    handleTryMessage(
                      text,
                      props.selectedChatId,
                      props.isPrivate
                    );
                  }
                }}
              />
              <div
                className="text-white bg-[#3A3B41] p-2 rounded-xl ml-4 cursor-pointer"
                onClick={() => {
                  const text = inputRef.current.value; // Get the input value
                  handleTryMessage(text, props.selectedChatId, props.isPrivate);
                }}
              >
                <FontAwesomeIcon className="w-8" icon={faPaperPlane} />
              </div>
            </div>
            <div className="absolute bottom-4 right-4 text-gray-400 ">
              Powered by <span className="anote">Anote</span>
            </div>
          </>
        ) : (
          <div className="text-white">
            Create a new chat from left sidebar
          </div>
        )}
      </div>
    </>
  );
};

export default Chatbot;
