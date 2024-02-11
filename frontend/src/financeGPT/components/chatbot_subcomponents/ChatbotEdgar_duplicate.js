import axios from "axios";
import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileDownload,
  faPaperPlane,
  faUndoAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/Chatbot.css";

class ChatbotEdgar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      isPrivate: false,
      userColor: "black", // Default color for user messages
      responseColor: "white", // Default color for responses
      hasUploadedFiles: false,
    };
    this.inputRef = React.createRef(); // Create a ref for the input element
    this.messagesEndRef = React.createRef(); // Create a ref for the end of the message list
  }

  //async componentDidMount() {
  //  const ticker = this.props.ticker;
  //  console.log(ticker)
//
  //  try {
  //    this.setState({
  //      userColor: "black",
  //      responseColor: "white",
  //      messages: [
  //        {
  //          message: `Hello, I am your financial assistant, answer questions about the company ${ticker}, how can I help you?`,
  //          sentTime: "just now",
  //          direction: "incoming",
  //        },
  //      ],
  //    });
  //  } catch (error) {
  //    console.error("Failed to fetch user preferences:", error);
  //  }
  //}
  componentDidMount() {
    // Initialize with the ticker prop when the component first mounts
    this.processTicker(this.props.ticker);
  }

  processTicker(ticker) {
    // Function to process the ticker and update the state
    if (ticker) {
      const newMessage = {
        message: `Hello, I am your financial assistant, I can answer questions about the company ${ticker}, how can I help you?`,
        sentTime: new Date().toLocaleTimeString(),
        direction: "incoming",
      };
      this.setState({ messages: [...this.state.messages, newMessage] });
    }
  }


  componentDidUpdate(prevProps) {
    // Check if the ticker prop has changed
    if (this.props.ticker !== prevProps.ticker) {
      this.processTicker(this.props.ticker);
    }
  }

  componentDidUpdate() {
    // Scroll to the last message whenever a new message is added
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    this.messagesEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };


  handleDownload = () => {
    fetch("http://localhost:5000/api/download-chat-history", {
      method: "POST", // Corrected the array to a string value for the method
    })
      .then((response) => response.blob())
      .then((blob) => {
        // Create a URL pointing to the blob
        const url = URL.createObjectURL(blob);

        // Create a download link and click it
        const a = document.createElement("a");
        a.href = url;
        a.download = "chat_history.csv";
        a.click();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  handleSendMessage = async (ticker, text) => {
    axios
      .post("http://localhost:5000/api/process-data-edgar", {
        message: text,
        company_ticker: ticker
      })
      .then((response) => {
        const answer = response.data.answer;
        this.setState({
          messages: [
            ...this.state.messages,
            {
              message: answer,
              sentTime: "just now",
              direction: "incoming",
            },
          ],
        });
      })
      .catch((error) => {
        console.error("Failed to send the user message to the Flask app:", error);
      });

    this.setState({
      messages: [
        ...this.state.messages,
        {
          message: text,
          sentTime: "just now",
          direction: "outgoing",
        },
      ],
    });

    this.inputRef.current.value = ""; // Clear the input value
  };


  handleReset = () => {
    console.log("ENTERED RESET HANDLER");

    this.resetServer();

    this.resetMessages();
  
  };

  resetServer = () => {
    axios
      .post("http://localhost:5000/api/reset-everything")
      .then((response) => {
        console.log("EXITED RESET HANDLER");
        console.log(response.data); // Reset was successful!
        // Reset the state to its initial values
        this.setState({
          messages: [
            {
              message: "Hello, I am your financial assistant, how can I help you?",
              sentTime: "just now",
              direction: "incoming",
            },
          ],
          isPrivate: false,
          userColor: "black",
          responseColor: "white",
        });
      })
      .catch((error) => {
        console.error("Failed to reset:", error);
        // Handle error cases here
      });
  };

  resetMessages = () => {
    const ticker = this.props.ticker;
    this.setState({
      messages: [
        {
          message: `Hello, I am your financial assistant, I can answer questions about the company ${ticker}, how can I help you?`,
          sentTime: "just now",
          direction: "incoming",
        },
      ],
    });
  };

  render() {
    return (
      <div>
        <div className="chatbot-container border-gray-800 border-[18px] w-11/12 mx-auto md:w-10/12 rounded-2xl">
          <div className="horizontal-container">
            <FontAwesomeIcon
              icon={faUndoAlt}
              onClick={this.handleReset}
              className="reset-icon"
            />
            <div className="download-button send-button">
              <FontAwesomeIcon
                icon={faFileDownload}
                onClick={this.handleDownload}
                className="file-upload"
              />
            </div>
          </div>
          <hr />
          <div className="message-list">
            {this.state.messages.map((msg, index) => (
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
                          ? this.state.responseColor
                          : this.state.userColor,
                    }}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            ))}
            <div ref={this.messagesEndRef} /> {/* Empty div for scrolling */}
          </div>
          <div className="message-input-container">
            <input
              className="message-input"
              type="text"
              placeholder="Type message here"
              ref={this.inputRef} // Assign the input ref
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const text = e.target.value; // Get the input value
                  this.handleSendMessage(this.props.ticker, text);
                }
              }}
            />
            <div
              className="send-button"
              onClick={() => {
                const text = this.inputRef.current.value; // Get the input value
                this.handleSendMessage(this.props.ticker, text);
              }}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </div>
          </div>
          <div className="powered-by">
            Powered by <span className="anote">Anote</span>
          </div>
        </div>
      </div>
    );
  }
}

export default ChatbotEdgar;
