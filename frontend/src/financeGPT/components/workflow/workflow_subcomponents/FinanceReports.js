import React, { useState } from "react";
import fetcher from "../../../../http/RequestConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faFileDownload,
  faPaperPlane,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

const FinanceReports = (props) => {
  const [tickers, setTickers] = useState([]);
  const [ticker, setTicker] = useState("");
  const [isValidTicker, setIsValidTicker] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  // const [enterKeyPressed, setEnterKeyPressed] = useState(false);
  const [pdfContent, setPdfContent] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleTickerChange = (e) => {
    console.log("handleTickerChange");
    const inputTicker = e.target.value.toUpperCase();
    setTicker(inputTicker);
    setIsValidTicker(checkTickerValidity(inputTicker));
  };

  const handleAddTicker = (e) => {
    if (isValidTicker && !tickers.includes(ticker) && e.key === "Enter") {
      console.log("handleAddTicker");
      setTickers([...tickers, ticker]);
      setTicker("");
      setIsValidTicker(false);
      console.log("Tickers:", tickers);
    }
  };

  const handleRemoveTicker = (removedTicker) => {
    console.log("handleRemoveTicker");
    const updatedTickers = tickers.filter((t) => t !== removedTicker);
    setTickers(updatedTickers);
    console.log("Tickers:", tickers);
  };

  const handleQuestionChange = (e) => {
    console.log("handleQuestionChange");
    setCurrentQuestion(e.target.value);
  };

  const askQuestion = () => {
    console.log("askQuestion");
    if (currentQuestion.trim() !== "") {
      setQuestions([...questions, currentQuestion]);
      setCurrentQuestion("");
    }
  };

  const handleRemoveQuestion = (removedQuestion) => {
    console.log("handleRemoveQuestion");
    const updatedQuestions = questions.filter((q) => q !== removedQuestion);
    setQuestions(updatedQuestions);
  };

  const checkTickerValidity = async (inputTicker) => {
    console.log("checkTickerValidity");
    const response = await fetcher("check-valid-ticker", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ticker: inputTicker }),
    });

    const data = await response.json();
    console.log("tiker abc", inputTicker);
    console.log("data is", data.isValid);
    setIsValidTicker(data.isValid);
  };

  const handleTickers = () => {
    if (tickers) {
      //Takesthe
      // Assuming you want to process each ticker in the list
      tickers.forEach(async (ticker) => {
        await processTickerBackend(ticker);
        await addTickerdb(ticker); // Assuming isUpdate should be false
      });
    }
  };

  const processTickerBackend = async (ticker) => {
    setIsUploading(true);
    try {
      const response = await fetcher("process-ticker-info-wf", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflow_id: props.workflowId, ticker: ticker }),
      });
    } catch (error) {
      console.error("Error in processTickerBackend:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const addTickerdb = async (ticker) => {
    const response = await fetcher("add-ticker-to-workflow", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ticker: ticker, workflow_id: props.workflowId }),
    });
  };

  const generatePDF = async () => {
    try {
      console.log("Requesting PDF generation...");
      // Make a fetch request to your Flask backend endpoint
      const response = await fetcher("/generate_financial_report", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tickers: tickers, questions: questions }),
      });

      if (response.ok) {
        // If the response is successful, retrieve the blob
        const blob = await response.blob();

        // Create a URL pointing to the blob
        const pdfDataUrl = URL.createObjectURL(blob);

        // Set the PDF content in the state
        setPdfContent(pdfDataUrl);

        console.log("PDF generated successfully");
      } else {
        console.error("Failed to generate or download PDF");
        // Handle error scenarios
      }
    } catch (error) {
      console.error("Error generating or downloading PDF", error);
    }
  };

  return (
    <div>
      <h1
        style={{
          fontSize: "24px",
          marginTop: "25px",
          fontWeight: "bold",
          marginBottom: "15px",
          color: "white",
          marginLeft: "80px",
        }}
      >
        Financial Report
      </h1>

      <div style={{ display: "flex", justifyContent: "center" }}>
        {/* Column 1: Ticker Input */}
        <div style={{ width: "300px" }}>
          {/* Set a fixed width for the container */}
          <label htmlFor="ticker" style={{ color: "white" }}>
            Enter Ticker:
          </label>
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              marginTop: "5px",
              width: "100%",
            }}
          >
            <input
              type="text"
              id="ticker-input"
              placeholder="e.g. AAPL"
              value={ticker}
              onChange={handleTickerChange}
              onKeyPress={handleAddTicker}
              style={{
                color: "black",
                fontSize: "16px",
                height: "35px",
                width: "70%",
                borderRadius: "10px",
                border: "3px solid #59788E",
              }}
            />
          </div>

          {/* Display tickers below the input box */}
          {tickers.length > 0 && (
            <div>
              <ul>
                {tickers.map((t, index) => (
                  <li key={index} style={{ margin: "5px" }}>
                    <button
                      style={{
                        backgroundColor: "#5daddb",
                        color: "white",
                        borderRadius: "10px",
                        padding: "5px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        width: "150px",
                      }}
                    >
                      <span style={{ marginRight: "5px" }}>{t}</span>
                      <FontAwesomeIcon
                        icon={faTimes}
                        onClick={() => handleRemoveTicker(t)}
                        style={{ color: "red", cursor: "pointer" }}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Question Input and List */}
          <div style={{ marginTop: "20px", width: "500px" }}>
            <label
              htmlFor="question"
              style={{ color: "white", marginTop: "20px" }}
            >
              Ask a Question:
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "5px",
                background: "#59788E", // Background color of the container
                borderRadius: "10px", // Adjust the radius as needed
                padding: "10px", // Adjust padding as needed
              }}
            >
              <input
                type="text"
                id="question"
                placeholder="Enter Question"
                value={currentQuestion}
                onChange={handleQuestionChange}
                style={{
                  color: "black",
                  fontSize: "16px",
                  height: "38px",
                  width: "100%",
                  // backgroundColor: 'transparent', // Make input background transparent
                }}
              />
              <div className="send-button" onClick={askQuestion}>
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  style={{ color: "white" }}
                />
              </div>
            </div>
            {questions.length > 0 && (
              <div>
                <ul>
                  {questions.map((q, index) => (
                    <li key={index} style={{ margin: "5px" }}>
                      <button
                        style={{
                          backgroundColor: "#365563",
                          color: "white",
                          borderRadius: "10px",
                          padding: "5px 20px",
                          display: "flex",
                          justifyContent: "space-between",
                          width: "490px",
                        }}
                      >
                        <span style={{ marginRight: "5px" }}>{q}</span>
                        <FontAwesomeIcon
                          icon={faTimes}
                          onClick={() => handleRemoveQuestion(q)}
                          style={{ color: "red", cursor: "pointer" }}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={generatePDF}
              style={{
                backgroundColor: "green",
                boxShadow: "0 0 5px rgba(0, 255, 0, 0.5)",
                color: "white",
                padding: "10px",
              }}
            >
              Generate PDF
            </button>
          </div>
        </div>

        {/* Display PDF on the screen */}
        {pdfContent && (
          <div>
            <object
              data={pdfContent}
              type="application/pdf"
              width="100%"
              height="500px" // Adjust the height as needed
            >
              <p>PDF cannot be displayed</p>
            </object>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceReports;
