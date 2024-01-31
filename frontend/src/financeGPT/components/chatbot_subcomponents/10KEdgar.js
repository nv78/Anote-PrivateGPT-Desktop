import React, { useState } from 'react';

import Navbarchatbot from "../NavbarChatbot";
import ChatbotEdgar from "./ChatbotEdgar_duplicate.js";
import Chatbot from '../Chatbot';
import SidebarChatbot from "../SidebarChatbot";



function Edgar() {
  const [ticker, setTicker] = useState('');
  const [isValidTicker, setIsValidTicker] = useState(false);

  const checkTickerValidity = (inputTicker) => /^[A-Z]+$/.test(inputTicker); //Change this to an API call (EDGAR API) that simulates whether the ticker is valid or not

  const handleTickerChange = (e) => {
    const inputTicker = e.target.value.toUpperCase(); // Convert to uppercase
    setTicker(inputTicker);
    setIsValidTicker(checkTickerValidity(inputTicker));
  };

  const processTickerInfo = () => {

  }

  return (
    <div style={{display: 'flex', flexDirection: 'row', width:'100%'}}>
      <div style={{flex: 1}}>
        <Navbarchatbot/>
      </div>
      <div style={{flex: 3, paddingRight: '100px'}}>
        <div style={{paddingLeft: '100px', paddingTop: '50px'}}>
          <div className="input-container" style={{display: 'flex', flexDirection:'column', marginBottom: '10px'}}>
            <h2 style={{color: 'white'}} htmlFor="ticker-input">Enter ticker:</h2>
            <div style={{display: 'flex', flexDirection: 'row', width:'100%'}}>
              <input
                className="border-gray-800 border-[5px] rounded-2xl"
                type="text"
                id="ticker-input"
                placeholder="e.g. AAPL"
                value={ticker}
                onChange={handleTickerChange}
                style={{color: 'black', width: '50%', marginBottom: '10px'}}
              />
              <button
                onClick={(processTickerInfo)}
                style={{ width: '30px', height: '30px', marginTop: '10px', marginLeft: '5px', padding: '5px', backgroundColor: 'grey', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>
                &#10003; {/* Check Mark */}
              </button>
            </div>
            {isValidTicker && (
                <div style={{ color: 'white', backgroundColor: 'green', padding: '8px', borderRadius: '4px', width:'50%' }}>
                  Now you may ask a question based on {ticker}.
                </div>
              )}
          </div>
        </div>
        {isValidTicker && (
            <ChatbotEdgar ticker={ticker} key={ticker}/>
        )}
      </div>
      <div style={{width: '20%', marginTop:'20px'}}>
        <SidebarChatbot/>
      </div>
    </div>
  );
}


export default Edgar;
