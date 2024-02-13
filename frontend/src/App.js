import Dashboard from "./Dashboard";
import Test from "./financeGPT/components/Test.js"
// import MetricsRoutes from "./metrics_components/MetricsRoutes";
// import ReactGA4 from "react-ga4";
import {  BrowserRouter as Router, Route, Routes } from "react-router-dom";
// ReactGA4.initialize("G-PNX85JC0CV");

import HomeChatbot from "./financeGPT/components/Home.js"
import Installation from "./financeGPT/components/Installation.js"


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Installation />} />
        <Route path="/chatbot" element={<HomeChatbot />} />
      </Routes>
    </Router>
  );
}

export default App;
