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

  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState('');

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
      console.log("response_data", response_data)

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
      console.log("test1")
      openInstallationModal();
    }
  };

  const openInstallationModal = () => {
    setShowInstallationModal(true);
  };

  const pollOllamaStatus = async () => {
    try {
      if (props.isPrivate === 0) {
        const response = await fetcher('/llama-status', { method: 'POST' });
        const status = await response.json();

        console.log("status llama is", status)

        if (!status.running && status.completed) {
          // Process has completed, update UI accordingly
          console.log("progress is", status.progress)
          console.log(status.output || status.error);
          setIsLoading(false); // Stop the loading indicator
          setProgress(100);
          setTimeLeft('');
          setShowInstallationModal(false);
        } else {
          // Process is still running, update UI with time left
          console.log("progress is", status.progress)
          setTimeLeft(status.time_left || 'Calculating time left...');
          setProgress(status.progress);
          setTimeout(pollOllamaStatus, 3000); // Continue polling
        }
      } else {
        const response = await fetcher('/mistral-status', { method: 'POST' });
        const status = await response.json();

        console.log("status mistral is", status)
  
        if (!status.running && status.completed) {
          // Process has completed, update UI accordingly
          console.log(status.output || status.error);
          setIsLoading(false); // Stop the loading indicator
          setProgress(100);
          setTimeLeft('');
          setShowInstallationModal(false);
        } else {
          // Process is still running, update UI with time left
          setTimeLeft(status.time_left || 'Calculating time left...');
          setProgress(status.progress);
          setTimeout(pollOllamaStatus, 3000); // Continue polling
        }
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setIsLoading(false); // Stop the loading indicator on error
      setTimeLeft(''); // Clear the time left due to error
      setShowInstallationModal(false);
    }
  };


  // const installDependencies = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetcher("install-llama-and-mistral", {
  //       method: "POST",
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     const response_data = await response.json();
  //     setIsLoading(false); // Stop loading after fetch completes
  //     setShowInstallationModal(false);
  //   } catch (e) {
  //     console.error(e.error);
  //     setIsLoading(false); // Stop loading on error
  //     setShowInstallationModal(false);
  //   }
  // };

  const installDependencies = async () => {
    setIsLoading(true); // Show loading indicator
    pollOllamaStatus();

    try {
      if (props.isPrivate === 0) {
        const response = await fetcher("/install-llama", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        const responseData = await response.json();
        if (!responseData.success) {
          console.error(responseData.message);
          setIsLoading(false); // Stop loading only if initiation was not successful
          // Consider adding logic here to stop polling if necessary
        }
      } else {
        const response = await fetcher("/install-mistral", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        const responseData = await response.json();
        if (!responseData.success) {
          console.error(responseData.message);
          setIsLoading(false); // Stop loading only if initiation was not successful
          // Consider adding logic here to stop polling if necessary
        }
      }
    } catch (error) {
      console.error("Installation initiation failed:", error);
      setIsLoading(false); // Stop loading on initiation failure
      // Again, consider stopping the polling here if the request fails
    }
  };


  const installationModal = showInstallationModal ? (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          padding: 20,
          borderRadius: 5,
          boxShadow: "0px 0px 15px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
        className="bg-gray-800 text-white"
      >
        <div style={{ position: "relative" }}>
          {isLoading ? (
            <div className="loading-bar my-2" style={{ width: "100%", backgroundColor: "#ddd" }}>
              <div style={{ height: '20px', width: `${progress}%`, backgroundColor: '#4CAF50' }}></div> {/* This div represents the loading progress */}
            </div>
          ) : (
            <div className="my-2">You have not installed LLaMa or Mistral. Please install below</div>
          )}
          <div className="w-full flex justify-center mt-4">
            <button
              onClick={installDependencies}
              disabled={isLoading} // Disable button when loading
              className={`w-1/2 mx-2 py-2 bg-gray-700 rounded-lg hover:bg-gray-900 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Download {props.isPrivate === 0 ? "LLaMa" : "Mistral"}
            </button>
          </div>
          <p>{timeLeft}</p> {/* Display the time left */}
        </div>
      </div>
    </>
  ) : null;



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
    resetServer();
  };

  const resetServer = () => {
    axios
      .post("http://localhost:5000/api/reset-everything")
      .then((response) => {
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
      {showInstallationModal && installationModal}
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
                  className={`message ${msg.direction === "incoming" ? "incoming" : "outgoing"
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
