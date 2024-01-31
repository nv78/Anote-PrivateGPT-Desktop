import { React, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileCsv,
  faFilePen,
  faHardDrive,
} from "@fortawesome/free-solid-svg-icons";
import { AiFillDatabase } from "react-icons/ai";
import { LuMonitorDown } from "react-icons/lu";
import { BiGridAlt } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { financialReportsPath, myWorkflowsPath } from "../constants/RouteConstants";
import fetcher from "../http/RequestConfig";

function Workflows({
  onButtonClick,
  dataChooserIndex,
  setDataChooserIndex,
}) {
  const [currWorkflowId, setCurrWorkflowId] = useState(null); // State variable to track the currently selected workflow
  const [workflowName, setWorkflowName] = useState(''); // State variable to store the name of a new workflow
  const [currTask, setcurrTask] = useState(0); //2 is financialReports?...
  const [forceUpdate, setForceUpdate] = useState(0); //to create a new workflow, update an existing workflow, delete a workflow

  // const [newWorkflowName, setNewWorkflowName] = useState('');

  console.log("In CreateDatasetView, onButtonClick:", onButtonClick);

  const handleWorkflowSelect = (workflowId) => {
    setCurrWorkflowId(workflowId);
  };

  const handleForceUpdate = () => {
    setForceUpdate(prev => prev + 1);
  }

  const createNewWorkflow = async () => {
    const response = await fetcher("create-new-workflow", {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        "Content-Type": "application/json",
      },
      body: JSON.stringify({workflow_type: currTask})
    })
      .catch((e) => {
        console.error(e.error);
      });

      const response_data = await response.json();
      handleWorkflowSelect(response_data.workflow_id);

      return response_data.workflow_id;
    };

  function getActiveClass(index) {
    if (index == dataChooserIndex) {
      return "Active";
    } else {
      return "NotActive";
    }
  }
  
  const navigate = useNavigate();
  return (
    <div className="w-1/2 sm:w-3/4 xl:w-1/2 mx-auto my-10">
      <div className="text-4xl text-center text-white font-bold my-4">
        My Workflows
      </div>
      {/* <div className="text-white text-center text-lg pb-5">
        Select Your Workflow
      </div> */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-12 my-10 justify-between mx-auto">
        <li
          key="1"
          onClick={() => {navigate(financialReportsPath)}}
          // onClick={() => {
          //   createNewWorkflow().then(newWorkflowId => {
          //     console.log("new workflow id", newWorkflowId);
          //     const workflow_name = "Chat " + newWorkflowId.toString()
          //   }).catch(error => {
          //     console.error("Error creating new chat:", error);
          //     // Handle any errors here
          //   });
          // }}
        >
          {/* <button className={"ButtonTypeCreate " + getActiveClass(1)}> */}
          <button className="pl-2 pr-2 border-2 flex flex-col space-y-2 items-center rounded-xl w-48 h-48 hover:border-yellow-500 hover:scale-105 duration-200">
            <div className="mb-1 pt-3">
              {/* <img
                src={UploadUnstructuredIcon}
                alt="Upload Unstructured Icon"
              /> */}
              <FontAwesomeIcon
                className="w-12 h-12 text-sky-500 ml-5"
                icon={faFilePen}
              />
            </div>
            <div className="text-xl leading-tight text-white font-bold ">
              Financial Reports
            </div>
            <div className="text-xs leading-tight text-white">
              Create a one page financial report of stock from EDGAR API
            </div>
          </button>
        </li>
        <li
          key="2"
          onClick={() => {
            onButtonClick(2);
          }}
        >
          <button className="pl-2 pr-2 border-2 flex flex-col space-y-2 items-center rounded-xl w-48 h-48 hover:border-yellow-500 hover:scale-105 duration-200">
            <div className="mb-1.5 pt-4">
              {/* <img src={UploadStructuredIcon} alt="Upload Structured Icon" /> */}
              <FontAwesomeIcon
                className="w-11 h-11 text-sky-500 ml-5"
                icon={faFileCsv}
              />
            </div>
            <div className="text-xl leading-tight text-white font-bold ">
              Government Proposal
            </div>
            <div className="text-xs leading-tight text-white">
              Generate your own SBIR grant to apply for federal funding
            </div>
          </button>
        </li>
        <li
          key="3"
          onClick={() => {
            onButtonClick(3);
          }}
        >
          <button className="pl-2 pr-2 border-2 flex flex-col space-y-2 items-center rounded-xl w-48 h-48 hover:border-yellow-500 hover:scale-105 duration-200">
            <div className="mb-1 pt-3">
              {/* <img src={ConnectorIcon} alt="Connector Icon" /> */}
              <BiGridAlt className="text-sky-500 w-14 h-14" />
            </div>
            <div className="text-xl leading-tight text-white font-bold ">
              Buy / Sell Stocks
            </div>
            <div className="text-xs leading-tight text-white">
              Make live buy / sell decisions on stocks given 10-K documents
            </div>
          </button>
        </li>
        {/* </ul> */}
        {/* <ul className="row"> */}
        <li
          key="4"
          onClick={() => {
            onButtonClick(4);
          }}
        >
          <button className="pl-2 pr-2 border-2 flex flex-col space-y-2 items-center rounded-xl w-48 h-48 hover:border-yellow-500 hover:scale-105 duration-200">
            <div className="mb-1 pt-3">
              {/* <img src={WebsiteIcon} alt="Website Icon" /> */}
              {/* <CgWebsite className="text-sky-500 w-14 h-14" /> */}
              <LuMonitorDown className="text-sky-500 w-14 h-14" />
            </div>
            <div className="text-xl leading-tight text-white font-bold ">
              Insurance
            </div>
            <div className="text-xs leading-tight text-white">
              This is an insurance use case
            </div>
          </button>
        </li>
        <li
          key="5"
          onClick={() => {
            onButtonClick(5);
          }}
        >
          <button className="pl-2 pr-2 border-2 flex flex-col space-y-2 items-center rounded-xl w-48 h-48 hover:border-yellow-500 hover:scale-105 duration-200">
            <div className="mb-1 pt-3">
              {/* <img src={DatasetHubIcon} alt="Dataset Hub Icon" /> */}
              <AiFillDatabase className="text-sky-500 w-14 h-14" />
            </div>
            <div className="text-xl leading-tight text-white font-bold ">
              Risk Assessment
            </div>
            <div className="text-xs leading-tight text-white">
              This is a risk assessment use case
            </div>
          </button>
        </li>
        <li
          key="6"
          onClick={() => {
            navigate("/workflows");
          }}
        >
          <button className="pl-3 pr-2 border-2 flex flex-col space-y-2 items-center rounded-xl w-48 h-48 hover:border-yellow-500 hover:scale-105 duration-200">
            <div className="mb-1 pt-3">
              {/* <img src={DatasetHubIcon} alt="Dataset Hub Icon" /> */}
              <FontAwesomeIcon
                className="w-12 h-12 text-sky-500"
                icon={faHardDrive}
              />
            </div>
            <div className="text-xl leading-tight text-white font-bold ">
              Load My Workflows
            </div>
            <div className="text-xs leading-tight text-white">
              Load Your Existing Workflows
            </div>
          </button>
        </li>
      </ul>
    </div>
  );
}

export default Workflows;
