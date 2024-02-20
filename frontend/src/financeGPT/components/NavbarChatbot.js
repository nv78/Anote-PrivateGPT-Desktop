import React, { useState, useEffect } from "react";
//import NavLinks from "./NavLinksChatbot"; Changed from using nav to showing all on same page
import Switch from "react-switch";
import fetcher from "../../http/RequestConfig";
import ChatHistory from "./ChatHistory";

function NavbarChatbot(props) {
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const [showConfirmModelKey, setShowConfirmModelKey] = useState(false);
  const [showErrorKeyMessage, setShowErrorKeyMesage] = useState(false);
  const [showConfirmResetKey, setShowConfirmResetKey] = useState(false);
  const [pendingModel, setPendingModel] = useState(props.isPrivate);
  const [modelKey, setModelKey] = useState("");

  const urlObject = new URL(window.location.origin);
  var hostname = urlObject.hostname;
  if (hostname.startsWith("www.")) {
    hostname = hostname.substring(4);
  }
  urlObject.hostname = `dashboard.${hostname}`;

  useEffect(() => {
    //changeChatMode(props.isPrivate);
    props.handleForceUpdate();
  }, [props.isPrivate]);

  useEffect(() => {
    setModelKey(props.confirmedModelKey);
    props.handleForceUpdate();
  }, [props.confirmedModelKey]);

  const handleSwitchChange = () => {
    setShowConfirmPopup(true);
  };

  const confirmSwitchChange = () => {
    props.setIsPrivate((prevState) => 1 - prevState); //toggle true or false
    changeChatMode(props.isPrivate);
    setShowConfirmPopup(false);
  };

  const cancelSwitchChange = () => {
    setShowConfirmPopup(false);
  };

  const confirmModelKey = () => {
    resetChat();
    props.setConfirmedModelKey(modelKey);
    addModelKeyToDb(modelKey);
    setShowConfirmModelKey(false);
  };

  const cancelModelKey = () => {
    setShowConfirmModelKey(false);
  };

  const cancelErrorKeyMessage = () => {
    setShowErrorKeyMesage(false);
  };


  const confirmResetModel = () => {
    resetChat();
    addModelKeyToDb(null);
    props.setConfirmedModelKey("");
    setShowConfirmResetKey(false);
  };

  const cancelResetModel = () => {
    setShowConfirmResetKey(false);
  };

  const addModelKeyToDb = async (model_key_db) => {
    const response = await fetcher("add-model-key", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: props.selectedChatId,
        model_key: model_key_db,
      }),
    });
    props.handleForceUpdate();
  };

  const resetChat = async () => {
    const response = await fetcher("reset-chat", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: props.selectedChatId }),
    });
    props.handleForceUpdate();
  };

  const changeChatMode = async (isPrivate) => {
    const response = await fetcher("change-chat-mode", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: props.selectedChatId,
        model_type: isPrivate,
      }), //model_type=1 when mistral, model_type=0 when llama
    })
      .then((response) => {
      })
      .catch((e) => {
        console.error(e.error);
      });

  };

  const confirmPopup = showConfirmPopup ? (
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
      <p>
        Warning: You are changing the chat mode. This will reset your current
        chat and delete its history. Are you sure you want to proceed?
      </p>
      <div className="w-full flex justify-between mt-4">
        <button
          onClick={confirmSwitchChange}
          className="w-1/2 mx-2 py-2 bg-gray-700 rounded-lg hover:bg-gray-900"
        >
          Yes
        </button>
        <button
          onClick={cancelSwitchChange}
          className="w-1/2 mx-2 py-2 bg-gray-700 rounded-lg hover:bg-gray-900"
        >
          No
        </button>
      </div>
    </div>
  ) : null;

  const confirmResetModelPopup = showConfirmResetKey ? (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black
          zIndex: 999, // Ensure it's below the modal but above everything else
        }}
      ></div>
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          color: "black",
          backgroundColor: "white",
          padding: 20,
          borderRadius: 5,
          boxShadow: "0px 0px 15px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        <p>
          Warning: You are resetting the OpenAI fine tuning model. This will
          reset your current chat and delete its history. Are you sure you want
          to proceed?
        </p>
        <button
          onClick={confirmResetModel}
          className="p-2 my-1 bg-gray-600 rounded-lg hover:bg-gray-400 mr-5"
        >
          Yes
        </button>
        <button
          onClick={cancelResetModel}
          className="p-2 my-1 bg-gray-600 rounded-lg hover:bg-gray-400"
        >
          No
        </button>
      </div>
    </>
  ) : null;

  const errorKeyPopup = showErrorKeyMessage ? (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black
          zIndex: 999, // Ensure it's below the modal but above everything else
        }}
      ></div>
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          color: "black",
          backgroundColor: "white",
          padding: 20,
          borderRadius: 5,
          boxShadow: "0px 0px 15px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        <p>
          You cannot add your own fine-tuned model key when you are in private
          mode
        </p>
        <button
          onClick={cancelErrorKeyMessage}
          className="p-2 my-1 bg-gray-600 rounded-lg hover:bg-gray-400 mr-5"
        >
          Close
        </button>
      </div>
    </>
  ) : null;

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999, // Ensure it's below the popup but above everything else
  };

  return (
    // <nav className="relative h-screen left-0 w-44 bg-[#1A1922] text-white z-30">
    //   <div className="flex flex-col items-center font-medium justify-around h-full">
    <>
      {showConfirmPopup && <div style={overlayStyle}></div>}
      <nav className="flex flex-col h-screen text-white">
        {confirmPopup}
        {errorKeyPopup}
        {confirmResetModelPopup}
        <div className="flex-1 overflow-y-auto">
          {/* <div className="p-5 w-full flex justify-center">
            <div className="text-3xl mt-4" onClick={() => props.setOpen(!props.open)}>
              <FontAwesomeIcon icon={props.open ? faXmark : faBars} />
            </div>
          </div> */}
          <div className="flex-1 overflow-y-auto bg-[#2A2C38] my-2 rounded-xl">
            <ul className="my-4">
              <div className="mx-4 my-2">
                <h2 className="text-gray-500 uppercase tracking-wide font-semibold text-xs">
                  Task Types
                </h2>
              </div>
              <div className="mx-4 my-2">
                {/*<NavLinks /> remove this because we are not going to a different page anymore*/}
                <ul className="space-y-1 bg-[#2A2C38]">
                  <button
                    className="w-full"
                    onClick={() => props.setcurrTask(0)}
                  >
                    <a
                      className={`flex items-center px-3 py-2 text-lg font-medium text-gray-100 rounded transition-colors ${
                        props.currTask === 0
                          ? "text-white bg-gradient-to-r from-[#2E5C82] to-[#50B7C3]"
                          : "hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      File Uploader
                    </a>
                  </button>
                </ul>
                <ul className="space-y-1 bg-[#2A2C38]">
                  <button
                    className="w-full"
                    onClick={() => props.setcurrTask(1)}
                  >
                    <a
                      className={`flex items-center px-3 py-2 text-lg font-medium text-gray-100 rounded transition-colors ${
                        props.currTask === 1
                          ? "text-white bg-gradient-to-r from-[#2E5C82] to-[#50B7C3]"
                          : "hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      10-K Edgar
                    </a>
                  </button>
                </ul>
                {/*}
                <ul className="space-y-1 bg-[#2A2C38]">
                  <button
                    className="w-full"
                    onClick={() => props.setcurrTask(2)}
                  >
                    <a
                      className={`flex items-center px-3 py-2 text-lg font-medium text-gray-100 rounded transition-colors ${
                        props.currTask === 2
                          ? "text-white bg-gradient-to-r from-[#2E5C82] to-[#50B7C3]"
                          : "hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      MySQL Connector
                    </a>
                  </button>
                </ul>
                    */}
              </div>
            </ul>
          </div>
          <div>
            <ChatHistory
              onChatSelect={props.onChatSelect}
              setIsPrivate={props.setIsPrivate}
              setTicker={props.setTicker}
              setConfirmedModelKey={props.setConfirmedModelKey}
              setcurrTask={props.setcurrTask}
              setCurrChatName={props.setCurrChatName}
              setIsEdit={props.setIsEdit}
              setShowChatbot={props.setShowChatbot}
              handleForceUpdate={props.handleForceUpdate}
              createNewChat={props.createNewChat}
              selectedChatId={props.selectedChatId}
              handleChatSelect={props.handleChatSelect}
              forceUpdate={props.forceUpdate}
            />
          </div>
          <div className="bg-[#2A2C38] rounded-xl py-4">
            <h2 className="text-gray-500 uppercase tracking-wide font-semibold text-xs px-4">
              Settings
            </h2>
            <div className="rounded p-3 mx-3">
              {/* <div className="mb-5">
                <div className="font-semibold">Private</div>
                <select name="privateOptions" id="privateOptions">
                  <option value="LLaMA">LLaMA</option>
                  <option value="GPT4All">GPT4All</option>
                </select>
              </div> */}
              <div className="flex items-center justify-between">
                <div className="font-semibold">Private Model</div>
                <select
                  name="publicOptions"
                  id="publicOptions"
                  className="bg-[#3A3B41] rounded-lg focus:ring-0 hover:ring-0 hover:border-white border-none text-white cursor-pointer"
                  onChange={handleSwitchChange}
                  value={props.isPrivate === 0 ? "llama2" : "mistral"}
                >
                  <option value="llama2">LLaMA 2</option>
                  <option value="mistral">Mistral</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default NavbarChatbot;
