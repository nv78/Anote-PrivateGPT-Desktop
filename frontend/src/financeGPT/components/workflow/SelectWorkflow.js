// import React, { Component, useState, useEffect } from "react";
// import fetcher from "../../http/RequestConfig";
// import FinancialReports from "../workflow_subcomponents/FinancialReports.js"

// function SelectWorkflow(props) {
  // const [selectedWorkflowId, setSelectedWorkflowId] = useState(null); // State variable to track the currently selected workflow
  // const [workflowName, setWorkflowName] = useState(''); // State variable to store the name of a new workflow
  // const [currTask, setcurrTask] = useState(0); //2 is financialReports?...
  // const [forceUpdate, setForceUpdate] = useState(0); //to create a new workflow, update an existing workflow, delete a workflow


  // const handleWorkflowSelect = (workflowId) => {
  //   setSelectedWorkflowId(workflowId);
  // };


  // const createNewWorkflow = async () => {
  //   const response = await fetcher("create-new-workflow", {
  //     method: "POST",
  //     headers: {
  //       'Accept': 'application/json',
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({workflow_type: currTask})
  //   })
  //     .catch((e) => {
  //       console.error(e.error);
  //     });

  //     const response_data = await response.json();
  //     handleWorkflowSelect(response_data.workflow_id);

  //     return response_data.workflow_id;
  //   };

  return (
    <h1>This is where a list of my workflows will be</h1>

  );
}

export default SelectWorkflow;