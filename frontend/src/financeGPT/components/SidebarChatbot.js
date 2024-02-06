import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import fetcher from "../../http/RequestConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrashCan,
  faCommentDots,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";

import Sources from "./Sources";


function SidebarChatbot(props) {
  const [docs, setDocs] = useState([]);

  const [showConfirmPopupDoc, setShowConfirmPopupDoc] = useState(false);
  const [docToDeleteName, setDocToDeleteName] = useState(null);
  const [docToDeleteId, setDocToDeleteId] = useState(null);

  const urlObject = new URL(window.location.origin);

  var hostname = urlObject.hostname;
  if (hostname.startsWith("www.")) {
    hostname = hostname.substring(4);
  }
  urlObject.hostname = `dashboard.${hostname}`;

  useEffect(() => {
    retrieveDocs();
  }, [props.selectedChatId, props.forceUpdate]);

  {
    /* Delete doc section */
  }
  const handleDeleteDoc = async (doc_name, doc_id) => {
    setDocToDeleteName(doc_name);
    setDocToDeleteId(doc_id);
    setShowConfirmPopupDoc(true);
  };

  const confirmDeleteDoc = () => {
    console.log("Deleting document:", docToDeleteName);

    deleteDoc(docToDeleteId);
    setShowConfirmPopupDoc(false);
  };

  const cancelDeleteDoc = () => {
    setShowConfirmPopupDoc(false);
  };

  {
    /* Delete chat section */
  }

  const retrieveDocs = async () => {
    const response = await fetcher("retrieve-current-docs", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: props.selectedChatId }),
    }).catch((e) => {
      console.error(e.error);
    });

    const response_data = await response.json();
    console.log("THE RESPONE Is", response_data);
    setDocs(response_data.doc_info);
  };

  const deleteDoc = async (doc_id) => {
    const response = await fetcher("delete-doc", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ doc_id: doc_id }),
    }).catch((e) => {
      console.error(e.error);
    });
    props.handleForceUpdate(); //to force it to update
  };

  const deleteConfirmationPopupDoc = showConfirmPopupDoc ? (
    <div
      style={{
        position: "absolute",
        zIndex: 1000,
        color: "black",
        background: "white",
        padding: 20,
        borderRadius: 5,
        boxShadow: "0px 0px 15px rgba(0,0,0,0.5)",
      }}
    >
      <p>Are you sure you want to delete {docToDeleteName}?</p>
      <button
        onClick={confirmDeleteDoc}
        className="p-2 my-1 bg-gray-600 rounded-lg hover:bg-gray-400 mr-5"
      >
        Yes
      </button>
      <button
        onClick={cancelDeleteDoc}
        className="p-2 my-1 bg-gray-600 rounded-lg hover:bg-gray-400"
      >
        No
      </button>
    </div>
  ) : null;

  return (
    <>
    <div className="flex flex-col h-[40vh] bg-[#2A2C38] rounded-xl text-white">
      {deleteConfirmationPopupDoc}
      <div className="flex flex-col flex-grow overflow-y-auto">
        {/* Documents Section */}
        <div className="flex flex-col px-4 mt-4">
          <h2 className="text-gray-500 uppercase tracking-wide font-semibold text-xs mb-2">
            Uploaded Files
          </h2>
          {/* Map through docs */}
          {docs.map((doc) => (
            <div
              key={doc.document_name}
              className="flex items-center justify-between px-4 hover:bg-[#3A3B41] rounded-xl"
            >
              <button
                key={doc.document_name}
                className="flex items-center p-2 my-1 rounded-lg "
              >
                <span className="text-lg">📄</span>{" "}
                {/* Replace with actual icon */}
                <span className="ml-2">{doc.document_name}</span>
              </button>
              <button
                onClick={() => handleDeleteDoc(doc.document_name, doc.id)}
                className="p-2 ml-4 rounded-full "
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
          ))}
        </div> 
      </div>
    </div>
    <div className="mt-4">
      <Sources
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
        relevantChunk={props.relevantChunk}
        activeMessageIndex={props.activeMessageIndex}
      />
  </div>
  </>
  );
}

export default SidebarChatbot;
